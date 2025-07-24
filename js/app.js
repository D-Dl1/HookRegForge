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
        console.log('开始绑定按钮事件...');
        
        // 清空按钮
        if (this.ui.elements.clearBtn) {
            this.ui.elements.clearBtn.addEventListener('click', () => {
                console.log('清空按钮被点击');
                this.clearInput();
            });
            console.log('清空按钮事件绑定成功');
        } else {
            console.warn('清空按钮未找到');
        }

        // 加载示例按钮
        if (this.ui.elements.loadSampleBtn) {
            this.ui.elements.loadSampleBtn.addEventListener('click', () => {
                console.log('加载示例按钮被点击');
                this.loadSampleCode();
            });
            console.log('加载示例按钮事件绑定成功');
        } else {
            console.warn('加载示例按钮未找到');
        }

        // 文件上传功能
        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                console.log('文件上传触发');
                this.handleFileUpload(e);
            });
            console.log('文件上传事件绑定成功');
        } else {
            console.warn('文件上传元素未找到');
        }

        // 生成按钮
        if (this.ui.elements.generateBtn) {
            this.ui.elements.generateBtn.addEventListener('click', () => {
                console.log('生成Hook正则按钮被点击');
                this.generateHook();
            });
            console.log('生成按钮事件绑定成功');
        } else {
            console.warn('生成按钮未找到');
        }

        // 复制正则按钮
        if (this.ui.elements.copyRegexBtn) {
            this.ui.elements.copyRegexBtn.addEventListener('click', () => {
                console.log('复制正则按钮被点击');
                this.copyRegex();
            });
            console.log('复制正则按钮事件绑定成功');
        } else {
            console.warn('复制正则按钮未找到');
        }

        // 测试按钮
        if (this.ui.elements.testBtn) {
            this.ui.elements.testBtn.addEventListener('click', () => {
                console.log('测试按钮被点击');
                this.testRegex();
            });
            console.log('测试按钮事件绑定成功');
        } else {
            console.warn('测试按钮未找到');
        }

        // 展开AST按钮
        if (this.ui.elements.expandAstBtn) {
            this.ui.elements.expandAstBtn.addEventListener('click', () => {
                console.log('展开AST按钮被点击');
                this.expandAST();
            });
            console.log('展开AST按钮事件绑定成功');
        } else {
            console.warn('展开AST按钮未找到');
        }
        
        console.log('所有按钮事件绑定完成');
    }

    /**
     * 绑定配置变化事件
     */
    bindConfigEvents() {
        const configElements = [
            this.ui.elements.targetFunction,
            this.ui.elements.hookType,
            this.ui.elements.depth,
            this.ui.elements.flexible
        ];

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
        if (this.ui.elements.jsInput) {
            const debouncedValidation = debounce(() => {
                this.validateSyntax();
            }, APP_CONFIG.ui.debounceDelay);

            this.ui.elements.jsInput.addEventListener('input', debouncedValidation);
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
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
        const allowedTypes = ['.js', '.jsx', '.ts', '.tsx', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.ui.showMessage('不支持的文件类型，请上传 JavaScript (.js, .jsx, .ts, .tsx) 或文本 (.txt) 文件', 'warning');
            event.target.value = ''; // 清空文件选择
            return;
        }

        // 检查文件大小 (最大 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.ui.showMessage('文件太大，请上传小于 5MB 的文件', 'warning');
            event.target.value = ''; // 清空文件选择
            return;
        }

        this.ui.showLoading(true);

        try {
            const content = await this.readFileContent(file);
            this.ui.setJavaScriptCode(content);
            this.ui.showMessage(`成功加载文件: ${file.name}`, 'success');
            
            // 自动验证语法
            setTimeout(() => {
                this.validateSyntax();
            }, 100);
            
        } catch (error) {
            this.ui.showMessage(`文件读取失败: ${error.message}`, 'error');
        } finally {
            this.ui.showLoading(false);
            event.target.value = ''; // 清空文件选择，允许重新上传同一文件
        }
    }

    /**
     * 读取文件内容
     * @param {File} file 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
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

/**
 * 更新调试状态
 * @param {string} type 状态类型
 * @param {string} status 状态文本
 */
function updateDebugStatus(type, status) {
    const debugPanel = document.getElementById('debug-status');
    const statusElement = document.getElementById(`${type}-status`);
    
    if (debugPanel && statusElement) {
        debugPanel.style.display = 'block';
        statusElement.textContent = status;
        
        // 3秒后隐藏调试面板（如果所有状态都正常）
        setTimeout(() => {
            const allStatuses = ['status-text', 'deps-status', 'buttons-status'];
            const allGood = allStatuses.every(id => {
                const el = document.getElementById(id);
                return el && (el.textContent.includes('完成') || el.textContent.includes('成功'));
            });
            
            if (allGood) {
                debugPanel.style.display = 'none';
            }
        }, 3000);
    }
}

/**
 * 显示错误消息
 * @param {string} message 错误消息
 */
function showErrorMessage(message) {
    updateDebugStatus('status', '错误: ' + message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        z-index: 1001;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    updateDebugStatus('status', '开始初始化...');
    
    // 检查依赖
    if (typeof esprima === 'undefined') {
        console.error('Esprima 库未加载，请检查依赖');
        updateDebugStatus('deps', '缺失');
        // 尝试延迟初始化
        setTimeout(() => {
            if (typeof esprima !== 'undefined') {
                updateDebugStatus('deps', '延迟加载成功');
                initializeApp();
            } else {
                updateDebugStatus('deps', '加载失败');
                showErrorMessage('依赖库加载失败，请刷新页面重试');
            }
        }, 1000);
        return;
    }

    updateDebugStatus('deps', '正常');
    initializeApp();
});

/**
 * 初始化应用
 */
function initializeApp() {
    try {
        window.hookRegForge = new HookRegForge();
        updateDebugStatus('status', '初始化完成');
        updateDebugStatus('buttons', '事件已绑定');
        console.log('HookRegForge 应用初始化成功');
    } catch (error) {
        console.error('初始化 HookRegForge 失败:', error);
        updateDebugStatus('status', '初始化失败');
        showErrorMessage('应用初始化失败: ' + error.message);
    }
}

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
});