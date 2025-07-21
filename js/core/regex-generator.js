/**
 * 正则表达式生成器模块
 * 处理Hook路径的正则表达式生成
 */

import { APP_CONFIG } from './config.js';

export class RegexGenerator {
    constructor() {
        this.patterns = APP_CONFIG.regex.patterns;
    }

    /**
     * 生成正则表达式
     * @param {Array} paths 路径数组
     * @param {Object} config 配置对象
     * @returns {Object} { regex: string, explanation: string }
     */
    generate(paths, config) {
        if (!paths || paths.length === 0) {
            return {
                regex: '',
                explanation: '没有找到可生成正则的路径'
            };
        }

        const patterns = paths.map(path => this.createPathPattern(path, config));
        const uniquePatterns = [...new Set(patterns.filter(p => p))];
        
        const combinedPattern = uniquePatterns.length === 1 ? 
            uniquePatterns[0] : 
            `(${uniquePatterns.join('|')})`;

        return {
            regex: combinedPattern,
            explanation: this.explainRegex(combinedPattern, uniquePatterns, config)
        };
    }

    /**
     * 为单个路径创建正则模式
     * @param {Object} path 路径对象
     * @param {Object} config 配置对象
     * @returns {string} 正则模式
     */
    createPathPattern(path, config) {
        if (!path || !path.path) return '';

        let pattern = this.escapeRegexChars(path.path);

        if (config.flexible) {
            pattern = this.makeFlexiblePattern(pattern, path);
        } else {
            pattern = this.makeExactPattern(pattern, path);
        }

        return pattern;
    }

    /**
     * 创建弹性匹配模式
     * @param {string} pattern 基础模式
     * @param {Object} path 路径对象
     * @returns {string} 弹性模式
     */
    makeFlexiblePattern(pattern, path) {
        // 处理计算属性访问
        if (path.computed) {
            pattern = pattern.replace(/\\\["/g, '\\[(?:"|\')?');
            pattern = pattern.replace(/"\\\]/g, '(?:"|\')?\\]');
        }

        // 允许不同的属性访问方式
        pattern = pattern.replace(/\\\./g, '(?:\\.|\\[(?:["\']?)\\w+(?:["\']?)\\])');

        // 允许标识符变化
        pattern = pattern.replace(
            /([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 
            `(?:${this.patterns.property})`
        );

        // 可选的函数调用参数
        if (path.type === 'method' || path.type === 'function') {
            pattern += this.patterns.functionCall;
        }

        return pattern;
    }

    /**
     * 创建精确匹配模式
     * @param {string} pattern 基础模式
     * @param {Object} path 路径对象
     * @returns {string} 精确模式
     */
    makeExactPattern(pattern, path) {
        // 精确匹配路径
        if (path.type === 'method' || path.type === 'function') {
            pattern += this.patterns.functionCall;
        }

        return pattern;
    }

    /**
     * 转义正则表达式特殊字符
     * @param {string} str 要转义的字符串
     * @returns {string} 转义后的字符串
     */
    escapeRegexChars(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 解释正则表达式
     * @param {string} pattern 正则模式
     * @param {Array} patterns 所有模式
     * @param {Object} config 配置对象
     * @returns {string} 解释文本
     */
    explainRegex(pattern, patterns, config) {
        let explanation = '<div class="regex-explanation-content">';
        
        // 模式概述
        if (patterns.length > 1) {
            explanation += `<div class="explanation-section">`;
            explanation += `<h5><i class="fas fa-info-circle"></i> 组合模式</h5>`;
            explanation += `<p>匹配以下任意一种路径:</p>`;
            explanation += `<ul class="pattern-list">`;
            patterns.forEach(p => {
                explanation += `<li><code>${this.escapeHtml(p)}</code></li>`;
            });
            explanation += `</ul></div>`;
        } else {
            explanation += `<div class="explanation-section">`;
            explanation += `<h5><i class="fas fa-bullseye"></i> 单一模式</h5>`;
            explanation += `<p><code>${this.escapeHtml(pattern)}</code></p>`;
            explanation += `</div>`;
        }

        // 模式特性说明
        explanation += `<div class="explanation-section">`;
        explanation += `<h5><i class="fas fa-cogs"></i> 模式特性</h5>`;
        explanation += `<ul class="feature-list">`;
        
        if (config.flexible) {
            explanation += `<li><i class="fas fa-arrows-alt"></i> <strong>弹性匹配</strong>: 允许属性名变化和不同的访问方式</li>`;
            explanation += `<li><i class="fas fa-code"></i> <code>${this.patterns.property}</code> - 匹配各种标识符模式</li>`;
            explanation += `<li><i class="fas fa-brackets-curly"></i> <code>(?:\\.|\\[...\\])</code> - 支持点号和方括号访问</li>`;
        } else {
            explanation += `<li><i class="fas fa-lock"></i> <strong>精确匹配</strong>: 严格按照路径结构匹配</li>`;
            explanation += `<li><i class="fas fa-equals"></i> 字符级别的严格匹配</li>`;
        }
        
        explanation += `<li><i class="fas fa-parentheses"></i> <code>${this.patterns.functionCall}</code> - 可选的函数调用参数</li>`;
        explanation += `</ul></div>`;

        // 使用场景
        explanation += `<div class="explanation-section">`;
        explanation += `<h5><i class="fas fa-lightbulb"></i> 适用场景</h5>`;
        explanation += `<ul class="usage-list">`;
        
        if (config.flexible) {
            explanation += `<li>混淆代码中的函数追踪</li>`;
            explanation += `<li>动态属性访问的检测</li>`;
            explanation += `<li>多种访问模式的统一匹配</li>`;
        } else {
            explanation += `<li>精确的函数调用拦截</li>`;
            explanation += `<li>特定API的准确匹配</li>`;
            explanation += `<li>减少误报的严格过滤</li>`;
        }
        
        explanation += `</ul></div>`;

        // 正则标志说明
        explanation += `<div class="explanation-section">`;
        explanation += `<h5><i class="fas fa-flag"></i> 正则标志</h5>`;
        explanation += `<p><code>g</code> - 全局匹配，查找所有匹配项</p>`;
        explanation += `</div>`;

        explanation += `</div>`;

        return explanation;
    }

    /**
     * 测试正则表达式
     * @param {string} regex 正则表达式
     * @param {string} testString 测试字符串
     * @returns {Object} 测试结果
     */
    test(regex, testString) {
        if (!regex || !testString) {
            return {
                success: false,
                error: '正则表达式或测试字符串不能为空'
            };
        }

        try {
            const regexObj = new RegExp(regex, APP_CONFIG.regex.flags);
            const matches = [...testString.matchAll(regexObj)];

            return {
                success: true,
                matches: matches.map((match, index) => ({
                    index: index + 1,
                    text: match[0],
                    position: match.index,
                    length: match[0].length,
                    groups: match.slice(1)
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: `正则表达式错误: ${error.message}`
            };
        }
    }

    /**
     * 优化正则表达式
     * @param {string} regex 原始正则
     * @returns {string} 优化后的正则
     */
    optimize(regex) {
        if (!regex) return '';

        // 移除重复的模式
        let optimized = regex;

        // 简化重复的字符类
        optimized = optimized.replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (match, group1, group2) => {
            if (group1 === group2) {
                return `[${group1}]`;
            }
            return match;
        });

        // 合并相邻的可选项
        optimized = optimized.replace(/\?\?\?+/g, '?');

        return optimized;
    }

    /**
     * 生成测试用例
     * @param {Array} paths 路径数组
     * @returns {Array} 测试用例数组
     */
    generateTestCases(paths) {
        const testCases = [];

        paths.forEach(path => {
            // 基本匹配测试
            testCases.push({
                name: `基本匹配 - ${path.name}`,
                input: path.path,
                shouldMatch: true
            });

            // 函数调用测试
            if (path.type === 'method' || path.type === 'function') {
                testCases.push({
                    name: `函数调用 - ${path.name}`,
                    input: `${path.path}()`,
                    shouldMatch: true
                });

                testCases.push({
                    name: `带参数调用 - ${path.name}`,
                    input: `${path.path}(arg1, arg2)`,
                    shouldMatch: true
                });
            }

            // 计算属性测试
            if (path.computed) {
                const parts = path.path.split('.');
                const computedPath = parts.map(part => {
                    if (part.includes('[')) return part;
                    return `["${part}"]`;
                }).join('');
                
                testCases.push({
                    name: `计算属性 - ${path.name}`,
                    input: computedPath,
                    shouldMatch: true
                });
            }
        });

        return testCases;
    }

    /**
     * HTML转义
     * @param {string} text 要转义的文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}