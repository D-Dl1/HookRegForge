/**
 * AST解析器模块
 * 处理JavaScript代码解析和路径提取
 */

import { APP_CONFIG } from './config.js';

export class ASTParser {
    constructor() {
        this.ast = null;
        this.paths = [];
    }

    /**
     * 解析JavaScript代码
     * @param {string} code JavaScript代码
     * @returns {Object} AST对象
     */
    parse(code) {
        if (!code || !code.trim()) {
            throw new Error('代码不能为空');
        }

        try {
            this.ast = esprima.parseScript(code, APP_CONFIG.parser.options);
            return this.ast;
        } catch (error) {
            throw new Error(`解析失败: ${error.message}`);
        }
    }

    /**
     * 提取函数路径
     * @param {Object} config 配置对象
     * @returns {Array} 路径数组
     */
    extractPaths(config) {
        if (!this.ast) {
            throw new Error('请先解析代码');
        }

        this.paths = [];
        this.traverseNode(this.ast, [], 0, config.depth || APP_CONFIG.parser.defaultDepth);

        // 过滤路径
        return this.filterPaths(config);
    }

    /**
     * 遍历AST节点
     * @param {Object} node AST节点
     * @param {Array} currentPath 当前路径
     * @param {number} currentDepth 当前深度
     * @param {number} maxDepth 最大深度
     */
    traverseNode(node, currentPath, currentDepth, maxDepth) {
        if (!node || typeof node !== 'object' || currentDepth > maxDepth) {
            return;
        }

        // 处理不同类型的节点
        switch (node.type) {
            case 'MemberExpression':
                this.handleMemberExpression(node, currentPath);
                break;
            case 'CallExpression':
                this.handleCallExpression(node, currentPath);
                break;
            case 'FunctionDeclaration':
                this.handleFunctionDeclaration(node, currentPath);
                break;
            case 'Property':
                this.handleProperty(node, currentPath);
                break;
            case 'AssignmentExpression':
                this.handleAssignmentExpression(node, currentPath);
                break;
            case 'VariableDeclarator':
                this.handleVariableDeclarator(node, currentPath);
                break;
        }

        // 递归遍历子节点
        this.traverseChildren(node, currentPath, currentDepth, maxDepth);
    }

    /**
     * 处理成员表达式
     * @param {Object} node AST节点
     * @param {Array} currentPath 当前路径
     */
    handleMemberExpression(node, currentPath) {
        const path = this.buildMemberPath(node);
        if (path) {
            this.paths.push({
                type: 'property',
                name: this.getLastProperty(node),
                path: path,
                node: node,
                context: this.getContext(node),
                computed: node.computed
            });
        }
    }

    /**
     * 处理函数调用表达式
     * @param {Object} node AST节点
     * @param {Array} currentPath 当前路径
     */
    handleCallExpression(node, currentPath) {
        if (node.callee) {
            const path = this.buildMemberPath(node.callee);
            const functionName = this.getFunctionName(node.callee);
            
            if (path && functionName) {
                this.paths.push({
                    type: node.callee.type === 'MemberExpression' ? 'method' : 'function',
                    name: functionName,
                    path: path,
                    node: node,
                    context: this.getContext(node),
                    arguments: node.arguments.length,
                    computed: node.callee.computed
                });
            }
        }
    }

    /**
     * 处理函数声明
     * @param {Object} node AST节点
     * @param {Array} currentPath 当前路径
     */
    handleFunctionDeclaration(node, currentPath) {
        if (node.id && node.id.name) {
            this.paths.push({
                type: 'function',
                name: node.id.name,
                path: node.id.name,
                node: node,
                context: 'declaration',
                parameters: node.params.length
            });
        }
    }

    /**
     * 处理对象属性
     * @param {Object} node AST节点
     * @param {Array} currentPath 当前路径
     */
    handleProperty(node, currentPath) {
        if (node.value && node.value.type === 'FunctionExpression') {
            const propertyName = this.getPropertyName(node.key);
            if (propertyName) {
                this.paths.push({
                    type: 'method',
                    name: propertyName,
                    path: [...currentPath, propertyName].join('.'),
                    node: node,
                    context: 'object_method',
                    parameters: node.value.params.length
                });
            }
        }
    }

    /**
     * 处理赋值表达式
     * @param {Object} node AST节点
     * @param {Array} currentPath 当前路径
     */
    handleAssignmentExpression(node, currentPath) {
        if (node.left && node.left.type === 'MemberExpression') {
            const path = this.buildMemberPath(node.left);
            const propertyName = this.getLastProperty(node.left);
            
            if (path && propertyName) {
                this.paths.push({
                    type: 'property',
                    name: propertyName,
                    path: path,
                    node: node,
                    context: 'assignment',
                    computed: node.left.computed
                });
            }
        }
    }

    /**
     * 处理变量声明
     * @param {Object} node AST节点
     * @param {Array} currentPath 当前路径
     */
    handleVariableDeclarator(node, currentPath) {
        if (node.id && node.id.name && node.init) {
            if (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression') {
                this.paths.push({
                    type: 'function',
                    name: node.id.name,
                    path: node.id.name,
                    node: node,
                    context: 'variable_function',
                    parameters: node.init.params ? node.init.params.length : 0
                });
            }
        }
    }

    /**
     * 遍历子节点
     * @param {Object} node 父节点
     * @param {Array} currentPath 当前路径
     * @param {number} currentDepth 当前深度
     * @param {number} maxDepth 最大深度
     */
    traverseChildren(node, currentPath, currentDepth, maxDepth) {
        for (const key in node) {
            if (key === 'parent') continue;
            const child = node[key];
            
            if (Array.isArray(child)) {
                child.forEach(item => 
                    this.traverseNode(item, [...currentPath], currentDepth + 1, maxDepth)
                );
            } else if (child && typeof child === 'object') {
                this.traverseNode(child, [...currentPath], currentDepth + 1, maxDepth);
            }
        }
    }

    /**
     * 构建成员访问路径
     * @param {Object} node AST节点
     * @returns {string|null} 路径字符串
     */
    buildMemberPath(node) {
        const parts = [];
        let current = node;

        while (current) {
            if (current.type === 'MemberExpression') {
                const property = this.getPropertyName(current.property, current.computed);
                if (property) {
                    parts.unshift(property);
                }
                current = current.object;
            } else if (current.type === 'Identifier') {
                parts.unshift(current.name);
                break;
            } else if (current.type === 'ThisExpression') {
                parts.unshift('this');
                break;
            } else if (current.type === 'Literal') {
                parts.unshift(String(current.value));
                break;
            } else {
                break;
            }
        }

        return parts.length > 0 ? parts.join('.') : null;
    }

    /**
     * 获取属性名
     * @param {Object} property 属性节点
     * @param {boolean} computed 是否为计算属性
     * @returns {string|null} 属性名
     */
    getPropertyName(property, computed = false) {
        if (!property) return null;
        
        if (computed) {
            if (property.type === 'Literal') {
                return `["${property.value}"]`;
            } else if (property.type === 'Identifier') {
                return `[${property.name}]`;
            }
            return '[...]';
        } else {
            return property.type === 'Identifier' ? property.name : 
                   property.type === 'Literal' ? String(property.value) : null;
        }
    }

    /**
     * 获取最后一个属性
     * @param {Object} node AST节点
     * @returns {string|null} 属性名
     */
    getLastProperty(node) {
        if (node.type === 'MemberExpression') {
            return this.getPropertyName(node.property, node.computed);
        } else if (node.type === 'Identifier') {
            return node.name;
        }
        return null;
    }

    /**
     * 获取函数名
     * @param {Object} node AST节点
     * @returns {string|null} 函数名
     */
    getFunctionName(node) {
        if (node.type === 'Identifier') {
            return node.name;
        } else if (node.type === 'MemberExpression') {
            return this.getLastProperty(node);
        }
        return null;
    }

    /**
     * 获取上下文信息
     * @param {Object} node AST节点
     * @returns {string} 上下文描述
     */
    getContext(node) {
        // 简化的上下文分析
        if (node.type === 'CallExpression') {
            return 'function_call';
        } else if (node.type === 'MemberExpression') {
            return 'property_access';
        }
        return 'runtime';
    }

    /**
     * 过滤路径
     * @param {Object} config 配置对象
     * @returns {Array} 过滤后的路径数组
     */
    filterPaths(config) {
        let filteredPaths = [...this.paths];

        // 按目标函数过滤
        if (config.targetFunction) {
            const target = config.targetFunction.toLowerCase();
            filteredPaths = filteredPaths.filter(path => 
                path.name.toLowerCase().includes(target) || 
                path.path.toLowerCase().includes(target)
            );
        }

        // 按类型过滤
        if (config.hookType && config.hookType !== 'all') {
            filteredPaths = filteredPaths.filter(path => path.type === config.hookType);
        }

        // 去重
        const uniquePaths = [];
        const pathSet = new Set();
        
        filteredPaths.forEach(path => {
            const key = `${path.type}:${path.path}`;
            if (!pathSet.has(key)) {
                pathSet.add(key);
                uniquePaths.push(path);
            }
        });

        return uniquePaths;
    }

    /**
     * 获取AST对象
     * @returns {Object|null} AST对象
     */
    getAST() {
        return this.ast;
    }

    /**
     * 获取所有路径
     * @returns {Array} 路径数组
     */
    getAllPaths() {
        return this.paths;
    }

    /**
     * 清除数据
     */
    clear() {
        this.ast = null;
        this.paths = [];
    }
}