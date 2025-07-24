/**
 * UI管理器模块
 * 处理所有用户界面交互
 */

import { APP_CONFIG } from '../core/config.js';
import { getElement, getElements, createElement, escapeHtml, formatAstForDisplay } from '../utils/helpers.js';

export class UIManager {
    constructor() {
        this.elements = {};
        this.currentTab = 'ast';
        this.init();
    }

    /**
     * 初始化UI管理器
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupTabs();
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        console.log('开始缓存DOM元素...');
        
        // 输入字段
        this.elements.jsInput = getElement(APP_CONFIG.selectors.fields.jsInput);
        this.elements.targetFunction = getElement(APP_CONFIG.selectors.fields.targetFunction);
        this.elements.hookType = getElement(APP_CONFIG.selectors.fields.hookType);
        this.elements.depth = getElement(APP_CONFIG.selectors.fields.depth);
        this.elements.flexible = getElement(APP_CONFIG.selectors.fields.flexible);
        this.elements.testString = getElement(APP_CONFIG.selectors.fields.testString);

        // 操作按钮
        this.elements.clearBtn = getElement(APP_CONFIG.selectors.actions.clear);
        this.elements.loadSampleBtn = getElement(APP_CONFIG.selectors.actions.loadSample);
        this.elements.generateBtn = getElement(APP_CONFIG.selectors.actions.generate);
        this.elements.copyRegexBtn = getElement(APP_CONFIG.selectors.actions.copyRegex);
        this.elements.testBtn = getElement(APP_CONFIG.selectors.actions.test);
        this.elements.expandAstBtn = getElement(APP_CONFIG.selectors.actions.expandAst);

        // 输出区域
        this.elements.astOutput = getElement(APP_CONFIG.selectors.outputs.ast);
        this.elements.regexOutput = getElement(APP_CONFIG.selectors.outputs.regex);
        this.elements.regexExplanation = getElement(APP_CONFIG.selectors.outputs.regexExplanation);
        this.elements.testOutput = getElement(APP_CONFIG.selectors.outputs.test);

        // 列表和计数器
        this.elements.pathsList = getElement(APP_CONFIG.selectors.lists.paths);
        this.elements.pathsCounter = getElement(APP_CONFIG.selectors.counters.paths);

        // UI组件
        this.elements.tabs = getElements(APP_CONFIG.selectors.ui.tabs);
        this.elements.tabPanels = getElements(APP_CONFIG.selectors.ui.tabPanels);
        this.elements.loadingOverlay = getElement(APP_CONFIG.selectors.ui.loadingOverlay);
        
        // 调试信息
        console.log('DOM元素缓存完成，检查关键元素:');
        console.log('- 输入框:', this.elements.jsInput ? '✓' : '✗');
        console.log('- 清空按钮:', this.elements.clearBtn ? '✓' : '✗');
        console.log('- 加载示例按钮:', this.elements.loadSampleBtn ? '✓' : '✗');
        console.log('- 生成按钮:', this.elements.generateBtn ? '✓' : '✗');
        console.log('- 复制按钮:', this.elements.copyRegexBtn ? '✓' : '✗');
        console.log('- 测试按钮:', this.elements.testBtn ? '✓' : '✗');
        console.log('- 展开AST按钮:', this.elements.expandAstBtn ? '✓' : '✗');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 标签页切换
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 输入字段占位符设置
        if (this.elements.jsInput) {
            this.elements.jsInput.placeholder = '在此输入您的JavaScript代码...\n\n示例:\nfunction test() {\n    return "Hello World";\n}\n\nconst obj = {\n    method: function() {\n        console.log("method called");\n    }\n};\n\nobj.method();';
        }

        if (this.elements.targetFunction) {
            this.elements.targetFunction.placeholder = '例: getName, encrypt, method';
        }

        if (this.elements.testString) {
            this.elements.testString.placeholder = '输入要测试的字符串...';
        }
    }

    /**
     * 设置标签页
     */
    setupTabs() {
        this.switchTab('ast');
    }

    /**
     * 切换标签页
     * @param {string} tabName 标签页名称
     */
    switchTab(tabName) {
        // 更新按钮状态
        this.elements.tabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
            }
        });

        // 更新面板显示
        this.elements.tabPanels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.dataset.tabPanel === tabName) {
                panel.classList.add('active');
            }
        });

        this.currentTab = tabName;
    }

    /**
     * 显示加载状态
     * @param {boolean} show 是否显示
     */
    showLoading(show) {
        if (this.elements.loadingOverlay) {
            if (show) {
                this.elements.loadingOverlay.classList.add('show');
            } else {
                this.elements.loadingOverlay.classList.remove('show');
            }
        }
    }

    /**
     * 显示消息
     * @param {string} message 消息内容
     * @param {string} type 消息类型
     */
    showMessage(message, type = 'info') {
        const messageEl = createElement('div', {
            className: `message message-${type}`,
            innerHTML: `<i class="fas fa-${this.getMessageIcon(type)}"></i> ${escapeHtml(message)}`
        });

        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            border-left: 4px solid var(--accent-${this.getMessageColor(type)});
            box-shadow: var(--shadow-medium);
            z-index: 1001;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, APP_CONFIG.ui.messageDisplayTime);
    }

    /**
     * 获取消息图标
     * @param {string} type 消息类型
     * @returns {string} 图标类名
     */
    getMessageIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * 获取消息颜色
     * @param {string} type 消息类型
     * @returns {string} 颜色名称
     */
    getMessageColor(type) {
        const colors = {
            info: 'primary',
            success: 'secondary',
            warning: 'warning',
            error: 'error'
        };
        return colors[type] || 'primary';
    }

    /**
     * 显示AST
     * @param {Object} ast AST对象
     */
    displayAST(ast) {
        if (!this.elements.astOutput) return;

        const formattedAst = formatAstForDisplay(ast, 0, APP_CONFIG.ui.maxAstDisplayDepth);
        this.elements.astOutput.innerHTML = `<code class="language-json">${escapeHtml(formattedAst)}</code>`;

        // 应用语法高亮
        if (window.Prism) {
            Prism.highlightElement(this.elements.astOutput.querySelector('code'));
        }
    }

    /**
     * 显示路径列表
     * @param {Array} paths 路径数组
     */
    displayPaths(paths) {
        if (!this.elements.pathsList || !this.elements.pathsCounter) return;

        this.elements.pathsCounter.textContent = `${paths.length} 个路径`;

        if (paths.length === 0) {
            this.elements.pathsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>未找到匹配的函数路径</p>
                </div>`;
            return;
        }

        const pathsHtml = paths.map(path => `
            <div class="path-item">
                <div class="path-name">${escapeHtml(path.path)}</div>
                <div class="path-details">
                    <span class="path-type"><i class="fas fa-${this.getPathIcon(path.type)}"></i> ${this.getTypeDisplayName(path.type)}</span>
                    ${path.parameters !== undefined ? ` • <span class="path-params">参数: ${path.parameters}</span>` : ''}
                    ${path.arguments !== undefined ? ` • <span class="path-args">实参: ${path.arguments}</span>` : ''}
                    • <span class="path-context">上下文: ${path.context}</span>
                    ${path.computed ? ' • <span class="path-computed">计算属性</span>' : ''}
                </div>
            </div>
        `).join('');

        this.elements.pathsList.innerHTML = pathsHtml;
    }

    /**
     * 获取路径类型图标
     * @param {string} type 路径类型
     * @returns {string} 图标类名
     */
    getPathIcon(type) {
        const icons = {
            function: 'function',
            method: 'cog',
            property: 'key'
        };
        return icons[type] || 'question';
    }

    /**
     * 获取类型显示名称
     * @param {string} type 类型
     * @returns {string} 显示名称
     */
    getTypeDisplayName(type) {
        return APP_CONFIG.hookTypes[type] || type;
    }

    /**
     * 显示正则表达式
     * @param {string} regex 正则表达式
     * @param {string} explanation 解释文本
     */
    displayRegex(regex, explanation) {
        if (this.elements.regexOutput) {
            if (regex) {
                this.elements.regexOutput.innerHTML = `<code class="language-regex">${escapeHtml(regex)}</code>`;
                if (window.Prism) {
                    Prism.highlightElement(this.elements.regexOutput.querySelector('code'));
                }
            } else {
                this.elements.regexOutput.innerHTML = '<code>生成的正则表达式将在这里显示...</code>';
            }
        }

        if (this.elements.regexExplanation) {
            this.elements.regexExplanation.innerHTML = explanation;
        }
    }

    /**
     * 显示测试结果
     * @param {Object} result 测试结果
     */
    displayTestResult(result) {
        if (!this.elements.testOutput) return;

        if (!result.success) {
            this.elements.testOutput.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: var(--accent-error);"></i>
                    <p>${escapeHtml(result.error)}</p>
                </div>`;
            return;
        }

        if (result.matches.length === 0) {
            this.elements.testOutput.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-times-circle" style="color: var(--accent-error);"></i>
                    <p>没有找到匹配项</p>
                </div>`;
            return;
        }

        const resultsHtml = result.matches.map(match => `
            <div class="match-result">
                <div class="match-text">
                    <i class="fas fa-check-circle"></i>
                    匹配 ${match.index}: "${escapeHtml(match.text)}"
                </div>
                <div class="path-details">
                    位置: ${match.position} - ${match.position + match.length - 1}
                    ${match.groups.length > 0 ? ` • 捕获组: ${match.groups.join(', ')}` : ''}
                </div>
            </div>
        `).join('');

        this.elements.testOutput.innerHTML = resultsHtml;
    }

    /**
     * 获取配置数据
     * @returns {Object} 配置对象
     */
    getConfig() {
        return {
            targetFunction: this.elements.targetFunction?.value || '',
            hookType: this.elements.hookType?.value || 'function',
            depth: parseInt(this.elements.depth?.value || '3'),
            flexible: this.elements.flexible?.checked || false
        };
    }

    /**
     * 获取JavaScript代码
     * @returns {string} JavaScript代码
     */
    getJavaScriptCode() {
        return this.elements.jsInput?.value || '';
    }

    /**
     * 设置JavaScript代码
     * @param {string} code JavaScript代码
     */
    setJavaScriptCode(code) {
        if (this.elements.jsInput) {
            this.elements.jsInput.value = code;
        }
    }

    /**
     * 获取测试字符串
     * @returns {string} 测试字符串
     */
    getTestString() {
        return this.elements.testString?.value || '';
    }

    /**
     * 清空输入
     */
    clearInput() {
        if (this.elements.jsInput) {
            this.elements.jsInput.value = '';
        }
        this.clearResults();
    }

    /**
     * 清空结果
     */
    clearResults() {
        if (this.elements.astOutput) {
            this.elements.astOutput.innerHTML = '<code>解析的AST结构将在这里显示...</code>';
        }
        
        if (this.elements.pathsList) {
            this.elements.pathsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>输入代码并点击"生成Hook正则"来发现函数路径</p>
                </div>`;
        }
        
        if (this.elements.regexOutput) {
            this.elements.regexOutput.innerHTML = '<code>生成的正则表达式将在这里显示...</code>';
        }
        
        if (this.elements.regexExplanation) {
            this.elements.regexExplanation.innerHTML = '<p>正则表达式的详细解释将在这里显示...</p>';
        }
        
        if (this.elements.pathsCounter) {
            this.elements.pathsCounter.textContent = '0 个路径';
        }
    }

    /**
     * 展开AST显示
     * @param {Object} ast AST对象
     */
    expandAST(ast) {
        if (!this.elements.astOutput || !ast) return;

        const fullAst = JSON.stringify(ast, null, 2);
        this.elements.astOutput.innerHTML = `<code class="language-json">${escapeHtml(fullAst)}</code>`;
        
        if (window.Prism) {
            Prism.highlightElement(this.elements.astOutput.querySelector('code'));
        }
    }

    /**
     * 设置配置字段值
     * @param {string} field 字段名
     * @param {any} value 值
     */
    setConfigField(field, value) {
        if (field === 'targetFunction' && this.elements.targetFunction) {
            this.elements.targetFunction.value = value;
        }
    }
}