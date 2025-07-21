// HookRegForge - JavaScript Hook路径正则生成器
class HookRegForge {
    constructor() {
        this.ast = null;
        this.paths = [];
        this.regex = '';
        this.currentConfig = {
            targetFunction: '',
            hookType: 'function',
            depth: 3,
            flexible: false
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initTabs();
        this.loadSampleCode();
    }

    bindEvents() {
        // 按钮事件
        document.getElementById('generateBtn').addEventListener('click', () => this.generateHook());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearInput());
        document.getElementById('loadSampleBtn').addEventListener('click', () => this.loadSampleCode());
        document.getElementById('copyRegexBtn').addEventListener('click', () => this.copyRegex());
        document.getElementById('testBtn').addEventListener('click', () => this.testRegex());
        document.getElementById('expandAstBtn').addEventListener('click', () => this.expandAst());

        // 配置变化事件
        ['targetFunction', 'hookType', 'depth', 'flexible'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('change', () => this.updateConfig());
        });

        // 实时语法检查
        document.getElementById('jsInput').addEventListener('input', 
            this.debounce(() => this.validateSyntax(), 500)
        );
    }

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // 更新按钮状态
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 更新面板显示
                tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === `${targetTab}-tab`) {
                        pane.classList.add('active');
                    }
                });
            });
        });
    }

    loadSampleCode() {
        const sampleCode = `// 复杂的JavaScript对象结构
var MyApp = {
    user: {
        profile: {
            getName: function() {
                return this.name;
            },
            setName: function(name) {
                this.name = name;
            }
        },
        preferences: {
            theme: 'dark',
            language: 'zh-CN'
        }
    },
    utils: {
        crypto: {
            encrypt: function(data) {
                return btoa(JSON.stringify(data));
            },
            decrypt: function(encrypted) {
                return JSON.parse(atob(encrypted));
            }
        },
        validate: {
            email: function(email) {
                return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
            }
        }
    },
    api: {
        request: function(url, options) {
            return fetch(url, options);
        }
    }
};

// 函数调用示例
function processUserData(userData) {
    const name = MyApp.user.profile.getName();
    const encrypted = MyApp.utils.crypto.encrypt(userData);
    return {
        name: name,
        data: encrypted
    };
}

// 动态属性访问
window['MyApp']['user']['profile']['getName']();`;

        document.getElementById('jsInput').value = sampleCode;
        document.getElementById('targetFunction').value = 'getName';
        this.updateConfig();
    }

    clearInput() {
        document.getElementById('jsInput').value = '';
        this.clearResults();
    }

    clearResults() {
        document.getElementById('astOutput').innerHTML = '<code>解析的AST结构将在这里显示...</code>';
        document.getElementById('pathsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>输入代码并点击"生成Hook正则"来发现函数路径</p>
            </div>`;
        document.getElementById('regexOutput').innerHTML = '<code>生成的正则表达式将在这里显示...</code>';
        document.getElementById('regexExplanation').innerHTML = '<p>正则表达式的详细解释将在这里显示...</p>';
        document.getElementById('pathCount').textContent = '0 个路径';
    }

    updateConfig() {
        this.currentConfig = {
            targetFunction: document.getElementById('targetFunction').value,
            hookType: document.getElementById('hookType').value,
            depth: parseInt(document.getElementById('depth').value),
            flexible: document.getElementById('flexible').checked
        };
    }

    validateSyntax() {
        const code = document.getElementById('jsInput').value.trim();
        if (!code) return;

        try {
            esprima.parseScript(code);
            this.showMessage('语法正确', 'success');
        } catch (error) {
            this.showMessage(`语法错误: ${error.message}`, 'error');
        }
    }

    async generateHook() {
        const code = document.getElementById('jsInput').value.trim();
        if (!code) {
            this.showMessage('请输入JavaScript代码', 'warning');
            return;
        }

        this.showLoading(true);
        
        try {
            // 解析AST
            this.ast = esprima.parseScript(code, { 
                range: true, 
                loc: true,
                attachComments: true 
            });
            
            // 显示AST
            this.displayAst();
            
            // 提取路径
            this.extractPaths();
            
            // 生成正则
            this.generateRegex();
            
            // 切换到路径标签页
            document.querySelector('[data-tab="paths"]').click();
            
            this.showMessage('Hook正则生成完成', 'success');
        } catch (error) {
            this.showMessage(`解析错误: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayAst() {
        const astContainer = document.getElementById('astOutput');
        const formattedAst = this.formatAstForDisplay(this.ast);
        astContainer.innerHTML = `<code class="language-json">${this.escapeHtml(formattedAst)}</code>`;
        
        // 应用语法高亮
        if (window.Prism) {
            Prism.highlightElement(astContainer.querySelector('code'));
        }
    }

    formatAstForDisplay(node, depth = 0, maxDepth = 3) {
        if (depth > maxDepth) return '...';
        
        if (typeof node !== 'object' || node === null) {
            return JSON.stringify(node);
        }

        const indent = '  '.repeat(depth);
        const nextIndent = '  '.repeat(depth + 1);
        
        if (Array.isArray(node)) {
            if (node.length === 0) return '[]';
            const items = node.slice(0, 10).map(item => 
                nextIndent + this.formatAstForDisplay(item, depth + 1, maxDepth)
            );
            return '[\n' + items.join(',\n') + 
                   (node.length > 10 ? ',\n' + nextIndent + '...' : '') + 
                   '\n' + indent + ']';
        }

        const keys = Object.keys(node).filter(key => 
            !['range', 'loc', 'start', 'end'].includes(key)
        );
        
        if (keys.length === 0) return '{}';
        
        const pairs = keys.slice(0, 8).map(key => {
            const value = this.formatAstForDisplay(node[key], depth + 1, maxDepth);
            return `${nextIndent}"${key}": ${value}`;
        });
        
        return '{\n' + pairs.join(',\n') + 
               (keys.length > 8 ? ',\n' + nextIndent + '...' : '') + 
               '\n' + indent + '}';
    }

    extractPaths() {
        this.paths = [];
        const { targetFunction, hookType, depth } = this.currentConfig;
        
        this.traverseNode(this.ast, [], 0, depth);
        
        // 过滤路径
        if (targetFunction) {
            this.paths = this.paths.filter(path => 
                path.name.includes(targetFunction) || 
                path.path.includes(targetFunction)
            );
        }

        // 按类型过滤
        if (hookType !== 'all') {
            this.paths = this.paths.filter(path => path.type === hookType);
        }

        this.displayPaths();
    }

    traverseNode(node, currentPath, currentDepth, maxDepth) {
        if (!node || typeof node !== 'object' || currentDepth > maxDepth) {
            return;
        }

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
        }

        // 递归遍历子节点
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

    handleMemberExpression(node, currentPath) {
        const path = this.buildMemberPath(node);
        if (path) {
            this.paths.push({
                type: 'property',
                name: this.getLastProperty(node),
                path: path,
                node: node,
                context: this.getContext(node)
            });
        }
    }

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
                    arguments: node.arguments.length
                });
            }
        }
    }

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
                    context: 'assignment'
                });
            }
        }
    }

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
            } else {
                break;
            }
        }

        return parts.length > 0 ? parts.join('.') : null;
    }

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

    getLastProperty(node) {
        if (node.type === 'MemberExpression') {
            return this.getPropertyName(node.property, node.computed);
        } else if (node.type === 'Identifier') {
            return node.name;
        }
        return null;
    }

    getFunctionName(node) {
        if (node.type === 'Identifier') {
            return node.name;
        } else if (node.type === 'MemberExpression') {
            return this.getLastProperty(node);
        }
        return null;
    }

    getContext(node) {
        // 简化的上下文分析
        return 'runtime';
    }

    displayPaths() {
        const pathsList = document.getElementById('pathsList');
        const pathCount = document.getElementById('pathCount');
        
        pathCount.textContent = `${this.paths.length} 个路径`;

        if (this.paths.length === 0) {
            pathsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>未找到匹配的函数路径</p>
                </div>`;
            return;
        }

        const pathsHtml = this.paths.map(path => `
            <div class="path-item">
                <div class="path-name">${this.escapeHtml(path.path)}</div>
                <div class="path-details">
                    <span>类型: ${this.getTypeDisplayName(path.type)}</span>
                    ${path.parameters !== undefined ? ` • 参数: ${path.parameters}` : ''}
                    ${path.arguments !== undefined ? ` • 实参: ${path.arguments}` : ''}
                    • 上下文: ${path.context}
                </div>
            </div>
        `).join('');

        pathsList.innerHTML = pathsHtml;
    }

    getTypeDisplayName(type) {
        const typeNames = {
            'function': '函数调用',
            'method': '方法调用',
            'property': '属性访问'
        };
        return typeNames[type] || type;
    }

    generateRegex() {
        if (this.paths.length === 0) {
            this.displayRegex('', '没有找到可生成正则的路径');
            return;
        }

        const { flexible } = this.currentConfig;
        const patterns = this.paths.map(path => this.createPathPattern(path.path, flexible));
        
        // 合并模式并去重
        const uniquePatterns = [...new Set(patterns)];
        const combinedPattern = uniquePatterns.length === 1 ? 
            uniquePatterns[0] : 
            `(${uniquePatterns.join('|')})`;

        this.regex = combinedPattern;
        this.displayRegex(combinedPattern, this.explainRegex(combinedPattern, uniquePatterns));
    }

    createPathPattern(path, flexible) {
        if (!path) return '';

        // 转义特殊字符
        let escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (flexible) {
            // 弹性匹配：允许属性名变化、数组访问等
            return escapedPath
                .replace(/\\\./g, '[\\.\\[]')  // 允许 . 或 [
                .replace(/\\\\\\[/g, '\\[')     // 处理数组访问
                .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '(?:[a-zA-Z_$][a-zA-Z0-9_$]*|\\w+)') // 允许标识符变化
                + '(?:\\(.*?\\))?';  // 可选的函数调用
        } else {
            // 精确匹配
            return escapedPath + '(?:\\(.*?\\))?';
        }
    }

    explainRegex(pattern, patterns) {
        let explanation = '<div>';
        
        if (patterns.length > 1) {
            explanation += `<p><strong>组合模式:</strong> 匹配以下任意一种路径:</p><ul>`;
            patterns.forEach(p => {
                explanation += `<li><code>${this.escapeHtml(p)}</code></li>`;
            });
            explanation += '</ul>';
        } else {
            explanation += `<p><strong>单一模式:</strong> <code>${this.escapeHtml(pattern)}</code></p>`;
        }

        explanation += '<p><strong>模式说明:</strong></p>';
        explanation += '<ul>';
        
        if (this.currentConfig.flexible) {
            explanation += '<li>弹性匹配：允许属性名变化和不同的访问方式</li>';
            explanation += '<li><code>[a-zA-Z_$][a-zA-Z0-9_$]*</code> - 匹配标识符</li>';
            explanation += '<li><code>[\\.\\[]</code> - 允许点号或方括号访问</li>';
        } else {
            explanation += '<li>精确匹配：严格按照路径结构匹配</li>';
        }
        
        explanation += '<li><code>(?:\\(.*?\\))?</code> - 可选的函数调用参数</li>';
        explanation += '</ul></div>';

        return explanation;
    }

    displayRegex(regex, explanation) {
        const regexOutput = document.getElementById('regexOutput');
        const regexExplanation = document.getElementById('regexExplanation');

        if (regex) {
            regexOutput.innerHTML = `<code class="language-regex">${this.escapeHtml(regex)}</code>`;
            if (window.Prism) {
                Prism.highlightElement(regexOutput.querySelector('code'));
            }
        } else {
            regexOutput.innerHTML = '<code>生成的正则表达式将在这里显示...</code>';
        }

        regexExplanation.innerHTML = explanation;
    }

    copyRegex() {
        if (!this.regex) {
            this.showMessage('没有可复制的正则表达式', 'warning');
            return;
        }

        navigator.clipboard.writeText(this.regex).then(() => {
            this.showMessage('正则表达式已复制到剪贴板', 'success');
        }).catch(() => {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = this.regex;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showMessage('正则表达式已复制到剪贴板', 'success');
        });
    }

    testRegex() {
        const testString = document.getElementById('testString').value.trim();
        const testOutput = document.getElementById('testOutput');

        if (!this.regex) {
            this.showMessage('请先生成正则表达式', 'warning');
            return;
        }

        if (!testString) {
            this.showMessage('请输入测试字符串', 'warning');
            return;
        }

        try {
            const regex = new RegExp(this.regex, 'g');
            const matches = [...testString.matchAll(regex)];

            if (matches.length === 0) {
                testOutput.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-times-circle" style="color: var(--accent-error);"></i>
                        <p>没有找到匹配项</p>
                    </div>`;
            } else {
                const resultsHtml = matches.map((match, index) => `
                    <div class="match-result">
                        <div class="match-text">匹配 ${index + 1}: "${this.escapeHtml(match[0])}"</div>
                        <div class="path-details">
                            位置: ${match.index} - ${match.index + match[0].length - 1}
                            ${match.length > 1 ? ` • 捕获组: ${match.slice(1).join(', ')}` : ''}
                        </div>
                    </div>
                `).join('');

                testOutput.innerHTML = resultsHtml;
            }
        } catch (error) {
            testOutput.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: var(--accent-error);"></i>
                    <p>正则表达式错误: ${error.message}</p>
                </div>`;
        }
    }

    expandAst() {
        if (!this.ast) {
            this.showMessage('请先解析JavaScript代码', 'warning');
            return;
        }

        const astOutput = document.getElementById('astOutput');
        const fullAst = JSON.stringify(this.ast, null, 2);
        astOutput.innerHTML = `<code class="language-json">${this.escapeHtml(fullAst)}</code>`;
        
        if (window.Prism) {
            Prism.highlightElement(astOutput.querySelector('code'));
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('show');
        } else {
            loading.classList.remove('show');
        }
    }

    showMessage(message, type = 'info') {
        // 创建临时消息显示
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            border-left: 4px solid var(--accent-${type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'secondary' : 'primary'});
            box-shadow: var(--shadow-medium);
            z-index: 1001;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new HookRegForge();
});