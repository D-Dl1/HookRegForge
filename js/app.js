/**
 * HookRegForge 主应用
 * 整合所有模块并处理业务逻辑
 */

import { APP_CONFIG, DEFAULT_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from './core/config.js';
import { ASTParser } from './core/parser.js';
import { RegexGenerator } from './core/regex-generator.js';
import { UIManager } from './ui/ui-manager.js';
import { debounce, validateJavaScript, copyToClipboard } from './utils/helpers.js';

class HookRegForge {
    constructor() {
        this.parser = new ASTParser();
        this.regexGenerator = new RegexGenerator();
        this.ui = new UIManager();
        
        this.currentPaths = [];
        this.currentRegex = '';
        this.config = { ...DEFAULT_CONFIG };
        
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.bindEvents();
        this.loadSampleCode();
        
        // 添加CSS动画
        this.addAnimationStyles();
        
        console.log(`${APP_CONFIG.name} v${APP_CONFIG.version} 已初始化`);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 操作按钮事件
        this.bindActionEvents();
        
        // 配置变化事件
        this.bindConfigEvents();
        
        // 语法验证事件
        this.bindValidationEvents();
    }

    /**
     * 绑定操作按钮事件
     */
    bindActionEvents() {
        // 清空按钮
        const clearBtn = document.querySelector('[data-action="clear"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearInput();
            });
        }

        // 加载示例按钮
        const loadSampleBtn = document.querySelector('[data-action="load-sample"]');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => {
                this.loadSampleCode();
            });
        }

        // 生成按钮
        const generateBtn = document.querySelector('[data-action="generate"]');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateHook();
            });
        }

        // 复制正则按钮
        const copyRegexBtn = document.querySelector('[data-action="copy-regex"]');
        if (copyRegexBtn) {
            copyRegexBtn.addEventListener('click', () => {
                this.copyRegex();
            });
        }

        // 测试按钮
        const testBtn = document.querySelector('[data-action="test"]');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testRegex();
            });
        }

        // 展开AST按钮
        const expandAstBtn = document.querySelector('[data-action="expand-ast"]');
        if (expandAstBtn) {
            expandAstBtn.addEventListener('click', () => {
                this.expandAST();
            });
        }

        // 文件上传功能
        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        }
    }

    /**
     * 绑定配置变化事件
     */
    bindConfigEvents() {
        // 直接查询配置元素
        const targetFunction = document.querySelector('[data-field="target-function"]');
        const hookType = document.querySelector('[data-field="hook-type"]');
        const depth = document.querySelector('[data-field="depth"]');
        const flexible = document.querySelector('[data-field="flexible"]');

        const configElements = [targetFunction, hookType, depth, flexible];

        configElements.forEach(element => {
            if (element) {
                element.addEventListener('change', () => {
                    this.updateConfig();
                });
            }
        });
    }

    /**
     * 绑定语法验证事件
     */
    bindValidationEvents() {
        const jsInput = document.querySelector('[data-field="js-input"]');
        if (jsInput) {
            const debouncedValidation = debounce(() => {
                this.validateSyntax();
            }, APP_CONFIG.ui.debounceDelay);

            jsInput.addEventListener('input', debouncedValidation);
        }
    }

    /**
     * 更新配置
     */
    updateConfig() {
        this.config = this.ui.getConfig();
    }

    /**
     * 验证语法
     */
    validateSyntax() {
        const code = this.ui.getJavaScriptCode().trim();
        if (!code) return;

        const result = validateJavaScript(code);
        if (result.valid) {
            this.ui.showMessage(SUCCESS_MESSAGES.SYNTAX_VALID, 'success');
        } else {
            this.ui.showMessage(`语法错误: ${result.error}`, 'error');
        }
    }

    /**
     * 加载示例代码
     */
    loadSampleCode() {
        this.ui.setJavaScriptCode(APP_CONFIG.samples.default);
        this.ui.setConfigField('targetFunction', 'getName');
        this.updateConfig();
    }

    /**
     * 清空输入
     */
    clearInput() {
        this.ui.clearInput();
        this.parser.clear();
        this.currentPaths = [];
        this.currentRegex = '';
    }

    /**
     * 处理文件上传
     * @param {Event} event 文件上传事件
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.ui.setJavaScriptCode(content);
            this.ui.showMessage(`已加载文件: ${file.name}`, 'success');
        };
        reader.onerror = () => {
            this.ui.showMessage('文件读取失败', 'error');
        };
        reader.readAsText(file);

        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
    }

    /**
     * 生成Hook正则
     */
    async generateHook() {
        const code = this.ui.getJavaScriptCode().trim();
        if (!code) {
            this.ui.showMessage(ERROR_MESSAGES.EMPTY_CODE, 'warning');
            return;
        }

        this.ui.showLoading(true);

        try {
            // 解析AST
            const ast = this.parser.parse(code);
            this.ui.displayAST(ast);

            // 提取路径
            this.currentPaths = this.parser.extractPaths(this.config);
            this.ui.displayPaths(this.currentPaths);

            // 生成正则
            const regexResult = this.regexGenerator.generate(this.currentPaths, this.config);
            this.currentRegex = regexResult.regex;
            this.ui.displayRegex(regexResult.regex, regexResult.explanation);

            // 切换到路径标签页
            this.ui.switchTab('paths');

            this.ui.showMessage(SUCCESS_MESSAGES.HOOK_GENERATED, 'success');

        } catch (error) {
            this.ui.showMessage(`${ERROR_MESSAGES.PARSE_ERROR}: ${error.message}`, 'error');
            console.error('生成Hook正则时出错:', error);
        } finally {
            this.ui.showLoading(false);
        }
    }

    /**
     * 复制正则表达式
     */
    async copyRegex() {
        if (!this.currentRegex) {
            this.ui.showMessage(ERROR_MESSAGES.NO_REGEX, 'warning');
            return;
        }

        const success = await copyToClipboard(this.currentRegex);
        if (success) {
            this.ui.showMessage(SUCCESS_MESSAGES.REGEX_COPIED, 'success');
        } else {
            this.ui.showMessage('复制失败，请手动复制', 'error');
        }
    }

    /**
     * 测试正则表达式
     */
    testRegex() {
        if (!this.currentRegex) {
            this.ui.showMessage(ERROR_MESSAGES.NO_REGEX, 'warning');
            return;
        }

        const testString = this.ui.getTestString().trim();
        if (!testString) {
            this.ui.showMessage(ERROR_MESSAGES.NO_TEST_STRING, 'warning');
            return;
        }

        const result = this.regexGenerator.test(this.currentRegex, testString);
        this.ui.displayTestResult(result);

        if (result.success && result.matches.length > 0) {
            this.ui.showMessage(`找到 ${result.matches.length} 个匹配项`, 'success');
        }
    }

    /**
     * 展开AST显示
     */
    expandAST() {
        const ast = this.parser.getAST();
        if (!ast) {
            this.ui.showMessage(ERROR_MESSAGES.NO_AST, 'warning');
            return;
        }

        this.ui.expandAST(ast);
        this.ui.switchTab('ast');
    }

    /**
     * 添加CSS动画样式
     */
    addAnimationStyles() {
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

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .path-item, .match-result {
                animation: fadeInUp 0.3s ease-out;
            }

            .explanation-section {
                margin-bottom: 1rem;
                padding: 1rem;
                background: var(--bg-primary);
                border-radius: var(--border-radius);
                border-left: 3px solid var(--accent-primary);
            }

            .explanation-section h5 {
                color: var(--text-primary);
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .explanation-section h5 i {
                color: var(--accent-primary);
            }

            .pattern-list, .feature-list, .usage-list {
                list-style: none;
                padding: 0;
                margin: 0.5rem 0;
            }

            .pattern-list li {
                margin-bottom: 0.5rem;
                padding: 0.5rem;
                background: var(--bg-tertiary);
                border-radius: var(--border-radius);
                font-family: var(--font-mono);
            }

            .feature-list li, .usage-list li {
                margin-bottom: 0.5rem;
                padding-left: 1.5rem;
                position: relative;
            }

            .feature-list li i, .usage-list li::before {
                position: absolute;
                left: 0;
                top: 0.2rem;
                color: var(--accent-primary);
            }

            .usage-list li::before {
                content: '•';
                font-weight: bold;
            }

            .config-input, .config-select, .test-input, .code-input {
                width: 100%;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 0.75rem;
                color: var(--text-primary);
                font-size: 14px;
                transition: border-color 0.3s ease;
            }

            .config-input:focus, .config-select:focus, .test-input:focus, .code-input:focus {
                outline: none;
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 2px rgba(97, 218, 251, 0.2);
            }

            .code-input {
                font-family: var(--font-mono);
                min-height: 400px;
                resize: vertical;
                line-height: 1.5;
            }

            .test-input {
                font-family: var(--font-mono);
                min-height: 100px;
                resize: vertical;
            }

            .config-form {
                display: grid;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .code-output {
                background: transparent !important;
                color: var(--text-primary) !important;
                padding: 1rem;
                font-family: var(--font-mono);
                font-size: 13px;
                line-height: 1.4;
                max-height: 400px;
                overflow: auto;
                margin: 0;
            }

            .generate-btn {
                width: 100%;
                margin-top: 1rem;
            }

            .test-input-group {
                margin-bottom: 1rem;
            }

            .test-input-group label {
                display: block;
                color: var(--text-secondary);
                margin-bottom: 0.5rem;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态
     */
    getState() {
        return {
            config: this.config,
            paths: this.currentPaths,
            regex: this.currentRegex,
            ast: this.parser.getAST()
        };
    }

    /**
     * 导出配置
     * @returns {string} JSON配置
     */
    exportConfig() {
        const state = this.getState();
        return JSON.stringify(state, null, 2);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 检查依赖
    if (typeof esprima === 'undefined') {
        console.error('Esprima 库未加载，请检查依赖');
        return;
    }

    try {
        window.hookRegForge = new HookRegForge();
    } catch (error) {
        console.error('初始化 HookRegForge 失败:', error);
    }
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
});