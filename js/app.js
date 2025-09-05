/**
 * HookRegForge 主应用 - 修复版本
 * 整合所有模块并处理业务逻辑
 */

import { APP_CONFIG, DEFAULT_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from './core/config.js';
import { ASTParser } from './core/parser.js';
import { RegexGenerator } from './core/regex-generator.js';
import { UIManager } from './ui/ui-manager.js';
import { debounce, validateJavaScript, copyToClipboard } from './utils/helpers.js';

class HookRegForge {
    constructor() {
        console.log('🚀 开始初始化 HookRegForge...');
        
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
        console.log(`开始初始化 ${APP_CONFIG.name} v${APP_CONFIG.version}`);
        
        // 等待DOM完全加载后再绑定事件
        setTimeout(() => {
            this.debugElementsStatus();
            this.bindEvents();
            this.loadSampleCode();
            this.addAnimationStyles();
            console.log(`✅ ${APP_CONFIG.name} v${APP_CONFIG.version} 初始化完成`);
        }, 100);
    }

    /**
     * 调试元素状态
     */
    debugElementsStatus() {
        console.log('=== 🔍 调试UI元素状态 ===');
        
        // 检查按钮元素
        const buttons = {
            clearBtn: this.ui.elements.clearBtn,
            loadSampleBtn: this.ui.elements.loadSampleBtn,
            generateBtn: this.ui.elements.generateBtn,
            copyRegexBtn: this.ui.elements.copyRegexBtn,
            testBtn: this.ui.elements.testBtn,
            expandAstBtn: this.ui.elements.expandAstBtn,
            uploadFileBtn: this.ui.elements.uploadFileBtn
        };
        
        Object.entries(buttons).forEach(([name, element]) => {
            if (element) {
                console.log(`✅ ${name}: 已找到`, element);
            } else {
                console.warn(`❌ ${name}: 未找到`);
                // 尝试重新查找
                const selector = this.getElementSelector(name);
                if (selector) {
                    const foundElement = document.querySelector(selector);
                    if (foundElement) {
                        console.log(`🔄 ${name}: 重新找到`, foundElement);
                        this.ui.elements[name] = foundElement;
                    }
                }
            }
        });
        
        // 检查输入元素
        const inputs = {
            jsInput: this.ui.elements.jsInput,
            targetFunction: this.ui.elements.targetFunction,
            hookType: this.ui.elements.hookType,
            depth: this.ui.elements.depth,
            flexible: this.ui.elements.flexible,
            testString: this.ui.elements.testString,
            fileInput: this.ui.elements.fileInput
        };
        
        Object.entries(inputs).forEach(([name, element]) => {
            if (element) {
                console.log(`✅ ${name}: 已找到`, element);
            } else {
                console.warn(`❌ ${name}: 未找到`);
                // 尝试重新查找
                const selector = this.getElementSelector(name);
                if (selector) {
                    const foundElement = document.querySelector(selector);
                    if (foundElement) {
                        console.log(`🔄 ${name}: 重新找到`, foundElement);
                        this.ui.elements[name] = foundElement;
                    }
                }
            }
        });
        
        console.log('=== 调试结束 ===');
    }

    /**
     * 获取元素选择器
     */
    getElementSelector(elementName) {
        const selectorMap = {
            clearBtn: APP_CONFIG.selectors.actions.clear,
            loadSampleBtn: APP_CONFIG.selectors.actions.loadSample,
            uploadFileBtn: APP_CONFIG.selectors.actions.uploadFile,
            generateBtn: APP_CONFIG.selectors.actions.generate,
            copyRegexBtn: APP_CONFIG.selectors.actions.copyRegex,
            testBtn: APP_CONFIG.selectors.actions.test,
            expandAstBtn: APP_CONFIG.selectors.actions.expandAst,
            jsInput: APP_CONFIG.selectors.fields.jsInput,
            targetFunction: APP_CONFIG.selectors.fields.targetFunction,
            hookType: APP_CONFIG.selectors.fields.hookType,
            depth: APP_CONFIG.selectors.fields.depth,
            flexible: APP_CONFIG.selectors.fields.flexible,
            testString: APP_CONFIG.selectors.fields.testString,
            fileInput: APP_CONFIG.selectors.fields.fileInput
        };
        return selectorMap[elementName];
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        console.log('🔗 开始绑定事件...');
        
        // 操作按钮事件
        this.bindActionEvents();
        
        // 配置变化事件
        this.bindConfigEvents();
        
        // 语法验证事件
        this.bindValidationEvents();
        
        // 标签页切换事件
        this.bindTabEvents();
        
        console.log('✅ 事件绑定完成');
    }

    /**
     * 绑定操作按钮事件 - 使用直接DOM查询方式
     */
    bindActionEvents() {
        console.log('🔗 绑定操作按钮事件...');
        
        // 清空按钮 - 使用多种方式确保绑定成功
        this.bindButtonEvent('[data-action="clear"]', () => {
            console.log('🎯 清空按钮被点击');
            this.clearInput();
            this.showMessage('输入已清空', 'success');
        }, '清空按钮');

        // 加载示例按钮
        this.bindButtonEvent('[data-action="load-sample"]', () => {
            console.log('🎯 加载示例按钮被点击');
            this.loadSampleCode();
        }, '加载示例按钮');

        // 生成按钮
        this.bindButtonEvent('[data-action="generate"]', () => {
            console.log('🎯 生成按钮被点击');
            this.generateHook();
        }, '生成按钮');

        // 复制正则按钮
        this.bindButtonEvent('[data-action="copy-regex"]', () => {
            console.log('🎯 复制正则按钮被点击');
            this.copyRegex();
        }, '复制正则按钮');

        // 测试按钮
        this.bindButtonEvent('[data-action="test"]', () => {
            console.log('🎯 测试按钮被点击');
            this.testRegex();
        }, '测试按钮');

        // 展开AST按钮
        this.bindButtonEvent('[data-action="expand-ast"]', () => {
            console.log('🎯 展开AST按钮被点击');
            this.expandAST();
        }, '展开AST按钮');

        // 文件上传事件
        this.bindFileUploadEvent();
    }

    /**
     * 通用按钮事件绑定方法
     */
    bindButtonEvent(selector, handler, description) {
        const element = document.querySelector(selector);
        if (element) {
            // 移除可能存在的旧事件
            element.onclick = null;
            
            // 绑定新事件
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler();
            });
            
            // 备用绑定方式
            element.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler();
            };
            
            console.log(`✅ ${description}事件绑定成功`);
        } else {
            console.error(`❌ ${description}元素未找到: ${selector}`);
        }
    }

    /**
     * 绑定文件上传事件
     */
    bindFileUploadEvent() {
        const fileInput = document.querySelector('[data-field="file-input"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                console.log('🎯 文件选择事件触发');
                const file = e.target.files[0];
                if (file) {
                    this.handleFileUpload(file);
                }
            });
            console.log('✅ 文件上传事件绑定成功');
        } else {
            console.error('❌ 文件输入元素未找到');
        }
    }

    /**
     * 绑定配置变化事件
     */
    bindConfigEvents() {
        const configSelectors = [
            '[data-field="target-function"]',
            '[data-field="hook-type"]',
            '[data-field="depth"]',
            '[data-field="flexible"]'
        ];

        configSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('change', () => {
                    this.updateConfig();
                });
                console.log(`✅ 配置字段事件绑定成功: ${selector}`);
            } else {
                console.warn(`⚠️ 配置字段未找到: ${selector}`);
            }
        });
    }

    /**
     * 绑定标签页事件
     */
    bindTabEvents() {
        console.log('🔗 绑定标签页事件...');
        
        // 查找所有标签页按钮
        const tabButtons = document.querySelectorAll('[data-tab]');
        const tabPanels = document.querySelectorAll('[data-tab-panel]');
        
        console.log(`找到 ${tabButtons.length} 个标签页按钮，${tabPanels.length} 个标签页面板`);
        
        tabButtons.forEach((button, index) => {
            const tabName = button.dataset.tab;
            console.log(`绑定标签页: ${tabName}`);
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🎯 标签页 "${tabName}" 被点击`);
                this.switchTab(tabName);
            });
        });
        
        // 默认激活第一个标签页
        if (tabButtons.length > 0) {
            this.switchTab('ast');
        }
    }

    /**
     * 切换标签页
     * @param {string} tabName 标签页名称
     */
    switchTab(tabName) {
        console.log(`🔄 切换到标签页: ${tabName}`);
        
        // 更新按钮状态
        const tabButtons = document.querySelectorAll('[data-tab]');
        tabButtons.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
            }
        });

        // 更新面板显示
        const tabPanels = document.querySelectorAll('[data-tab-panel]');
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.dataset.tabPanel === tabName) {
                panel.classList.add('active');
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
            console.log('✅ 语法验证事件绑定成功');
        } else {
            console.warn('⚠️ JavaScript输入框未找到');
        }
    }

    /**
     * 显示消息 - 简化版本
     */
    showMessage(message, type = 'info') {
        console.log(`💬 消息: ${message} (${type})`);
        
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            max-width: 300px;
        `;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    /**
     * 更新配置
     */
    updateConfig() {
        const targetFunction = document.querySelector('[data-field="target-function"]')?.value || '';
        const hookType = document.querySelector('[data-field="hook-type"]')?.value || 'function';
        const depth = parseInt(document.querySelector('[data-field="depth"]')?.value || '3');
        const flexible = document.querySelector('[data-field="flexible"]')?.checked || false;
        
        this.config = { targetFunction, hookType, depth, flexible };
        console.log('📝 配置已更新:', this.config);
    }

    /**
     * 验证语法
     */
    validateSyntax() {
        const jsInput = document.querySelector('[data-field="js-input"]');
        const code = jsInput?.value?.trim();
        if (!code) return;

        const result = validateJavaScript(code);
        if (result.valid) {
            this.showMessage('语法正确', 'success');
        } else {
            this.showMessage(`语法错误: ${result.error}`, 'error');
        }
    }

    /**
     * 加载示例代码
     */
    loadSampleCode() {
        const jsInput = document.querySelector('[data-field="js-input"]');
        const targetFunction = document.querySelector('[data-field="target-function"]');
        
        if (jsInput) {
            jsInput.value = APP_CONFIG.samples.default;
        }
        if (targetFunction) {
            targetFunction.value = 'getName';
        }
        
        this.updateConfig();
        this.showMessage('示例代码已加载', 'success');
    }

    /**
     * 处理文件上传
     */
    async handleFileUpload(file) {
        if (!file) return;

        console.log(`📁 开始处理文件: ${file.name} (${file.size} bytes)`);
        this.showMessage(`正在读取文件: ${file.name}`, 'info');

        try {
            // 检查文件大小
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new Error('文件大小超过限制 (最大10MB)');
            }

            // 检查文件类型
            const validExtensions = ['.js', '.txt', '.json'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!validExtensions.includes(fileExtension)) {
                throw new Error('不支持的文件类型。请上传 .js, .txt 或 .json 文件');
            }

            // 读取文件
            const content = await this.readFileContent(file);
            
            // 设置内容
            const jsInput = document.querySelector('[data-field="js-input"]');
            if (jsInput) {
                jsInput.value = content;
                this.showMessage(`文件 "${file.name}" 上传成功`, 'success');
                
                // 重置文件输入以允许重复上传同一文件
                const fileInput = document.querySelector('[data-field="file-input"]');
                if (fileInput) {
                    fileInput.value = '';
                }
                
                // 自动验证语法
                setTimeout(() => {
                    this.validateSyntax();
                }, 100);
            }
            
        } catch (error) {
            console.error('文件上传失败:', error);
            this.showMessage(`文件上传失败: ${error.message}`, 'error');
        }
    }

    /**
     * 读取文件内容
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
     * 清空输入
     */
    clearInput() {
        const jsInput = document.querySelector('[data-field="js-input"]');
        if (jsInput) {
            jsInput.value = '';
        }
        
        this.parser.clear();
        this.currentPaths = [];
        this.currentRegex = '';
        
        // 清空结果显示
        this.clearResults();
    }

    /**
     * 清空结果
     */
    clearResults() {
        const astOutput = document.querySelector('[data-output="ast"]');
        const regexOutput = document.querySelector('[data-output="regex"]');
        const pathsList = document.querySelector('[data-list="paths"]');
        
        if (astOutput) {
            astOutput.innerHTML = '<code>解析的AST结构将在这里显示...</code>';
        }
        if (regexOutput) {
            regexOutput.innerHTML = '<code>生成的正则表达式将在这里显示...</code>';
        }
        if (pathsList) {
            pathsList.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>输入代码并点击"生成Hook正则"来发现函数路径</p></div>';
        }
    }

    /**
     * 生成Hook正则
     */
    async generateHook() {
        const jsInput = document.querySelector('[data-field="js-input"]');
        const code = jsInput?.value?.trim();
        
        if (!code) {
            this.showMessage('请输入JavaScript代码', 'error');
            return;
        }

        this.showMessage('正在生成Hook正则...', 'info');

        try {
            // 解析AST
            const ast = this.parser.parse(code);
            this.displayAST(ast);

            // 提取路径
            this.currentPaths = this.parser.extractPaths(this.config);
            this.displayPaths(this.currentPaths);

            // 生成正则
            const regexResult = this.regexGenerator.generate(this.currentPaths, this.config);
            this.currentRegex = regexResult.regex;
            this.displayRegex(regexResult.regex, regexResult.explanation);

            this.showMessage('Hook正则生成完成', 'success');

        } catch (error) {
            console.error('生成Hook正则时出错:', error);
            this.showMessage(`代码解析失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示AST
     */
    displayAST(ast) {
        const astOutput = document.querySelector('[data-output="ast"]');
        if (!astOutput) return;

        try {
            // 生成简化的AST用于初始显示
            const simplifiedAst = this.simplifyAST(ast, 3); // 限制深度为3
            const formattedAst = JSON.stringify(simplifiedAst, null, 2);
            astOutput.innerHTML = `<code class="language-json">${this.escapeHtml(formattedAst)}</code>`;
            
            // 应用语法高亮
            if (window.Prism) {
                Prism.highlightElement(astOutput.querySelector('code'));
            }
        } catch (error) {
            console.error('显示AST时出错:', error);
            astOutput.innerHTML = `<code>显示AST时出错: ${this.escapeHtml(error.message)}</code>`;
        }
    }

    /**
     * 简化AST用于显示
     */
    simplifyAST(obj, maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
            return typeof obj === 'object' && obj !== null ? '[...]' : obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.simplifyAST(item, maxDepth, currentDepth + 1));
        }

        if (typeof obj === 'object' && obj !== null) {
            const simplified = {};
            for (const [key, value] of Object.entries(obj)) {
                // 跳过一些冗余属性
                if (key === 'parent' || key === '_parent' || key === 'range' || key === 'loc') {
                    continue;
                }
                simplified[key] = this.simplifyAST(value, maxDepth, currentDepth + 1);
            }
            return simplified;
        }

        return obj;
    }

    /**
     * 显示路径
     */
    displayPaths(paths) {
        const pathsList = document.querySelector('[data-list="paths"]');
        const pathsCounter = document.querySelector('[data-counter="paths"]');
        
        if (pathsCounter) {
            pathsCounter.textContent = `${paths.length} 个路径`;
        }
        
        if (pathsList) {
            if (paths.length === 0) {
                pathsList.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>未找到匹配的函数路径</p></div>';
                return;
            }

            const pathsHtml = paths.map((path, index) => `
                <div class="path-item">
                    <div class="path-header">
                        <div class="path-name">${this.escapeHtml(path.path)}</div>
                        <div class="path-badge path-type-${path.type}">${this.getTypeDisplayName(path.type)}</div>
                    </div>
                    <div class="path-details">
                        ${path.context ? `<span class="path-context">上下文: ${path.context}</span>` : ''}
                        ${path.parameters !== undefined ? ` • <span class="path-params">参数: ${path.parameters}</span>` : ''}
                        ${path.arguments !== undefined ? ` • <span class="path-args">实参: ${path.arguments}</span>` : ''}
                        ${path.computed ? ' • <span class="path-computed">计算属性</span>' : ''}
                    </div>
                </div>
            `).join('');

            pathsList.innerHTML = pathsHtml;
        }
    }

    /**
     * 获取类型显示名称
     */
    getTypeDisplayName(type) {
        const typeNames = {
            function: '函数',
            method: '方法',
            property: '属性'
        };
        return typeNames[type] || type;
    }

    /**
     * 显示正则表达式
     */
    displayRegex(regex, explanation) {
        const regexOutput = document.querySelector('[data-output="regex"]');
        const regexExplanation = document.querySelector('[data-output="regex-explanation"]');
        
        if (regexOutput) {
            if (regex) {
                regexOutput.innerHTML = `<code class="language-regex">${this.escapeHtml(regex)}</code>`;
                
                // 应用语法高亮
                if (window.Prism) {
                    Prism.highlightElement(regexOutput.querySelector('code'));
                }
            } else {
                regexOutput.innerHTML = '<code>生成的正则表达式将在这里显示...</code>';
            }
        }
        
        if (regexExplanation) {
            if (explanation) {
                regexExplanation.innerHTML = explanation;
            } else {
                regexExplanation.innerHTML = '<p>正则表达式的详细解释将在这里显示...</p>';
            }
        }
    }

    /**
     * 复制正则表达式
     */
    async copyRegex() {
        if (!this.currentRegex) {
            this.showMessage('没有可复制的正则表达式', 'error');
            return;
        }

        const success = await copyToClipboard(this.currentRegex);
        if (success) {
            this.showMessage('正则表达式已复制到剪贴板', 'success');
        } else {
            this.showMessage('复制失败，请手动复制', 'error');
        }
    }

    /**
     * 测试正则表达式
     */
    testRegex() {
        if (!this.currentRegex) {
            this.showMessage('没有可测试的正则表达式', 'error');
            return;
        }

        const testString = document.querySelector('[data-field="test-string"]')?.value?.trim();
        if (!testString) {
            this.showMessage('请输入测试字符串', 'error');
            return;
        }

        const result = this.regexGenerator.test(this.currentRegex, testString);
        this.displayTestResult(result);

        if (result.success && result.matches.length > 0) {
            this.showMessage(`找到 ${result.matches.length} 个匹配项`, 'success');
        } else {
            this.showMessage('没有找到匹配项', 'info');
        }
    }

    /**
     * 显示测试结果
     */
    displayTestResult(result) {
        const testOutput = document.querySelector('[data-output="test"]');
        if (!testOutput) return;

        if (!result.success) {
            testOutput.innerHTML = `<div class="empty-state"><p>${this.escapeHtml(result.error)}</p></div>`;
            return;
        }

        if (result.matches.length === 0) {
            testOutput.innerHTML = '<div class="empty-state"><p>没有找到匹配项</p></div>';
            return;
        }

        const resultsHtml = result.matches.map(match => `
            <div class="match-result">
                <div class="match-text">匹配: "${this.escapeHtml(match.text)}"</div>
                <div class="path-details">位置: ${match.position} - ${match.position + match.length - 1}</div>
            </div>
        `).join('');

        testOutput.innerHTML = resultsHtml;
    }

    /**
     * 展开AST显示
     */
    expandAST() {
        const ast = this.parser.getAST();
        if (!ast) {
            this.showMessage('请先解析JavaScript代码', 'error');
            return;
        }

        // 展开显示完整的AST
        this.displayExpandedAST(ast);
        this.switchTab('ast'); // 切换到AST标签页
        this.showMessage('AST已完全展开显示', 'success');
    }

    /**
     * 显示完全展开的AST
     */
    displayExpandedAST(ast) {
        const astOutput = document.querySelector('[data-output="ast"]');
        if (!astOutput) return;

        try {
            // 生成完整的JSON字符串，不限制深度
            const fullAstJson = JSON.stringify(ast, (key, value) => {
                // 过滤掉循环引用和一些冗余属性
                if (key === 'parent' || key === '_parent') return undefined;
                return value;
            }, 2);

            astOutput.innerHTML = `<code class="language-json">${this.escapeHtml(fullAstJson)}</code>`;
            
            // 应用语法高亮
            if (window.Prism) {
                Prism.highlightElement(astOutput.querySelector('code'));
            }
        } catch (error) {
            console.error('展开AST时出错:', error);
            astOutput.innerHTML = `<code>展开AST时出错: ${this.escapeHtml(error.message)}</code>`;
        }
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 添加CSS动画样式
     */
    addAnimationStyles() {
        // 简化版本，只添加必要样式
        const style = document.createElement('style');
        style.textContent = `
            .path-item, .match-result {
                animation: fadeInUp 0.3s ease-out;
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
        `;
        document.head.appendChild(style);
    }

    /**
     * 获取应用状态
     */
    getState() {
        return {
            config: this.config,
            paths: this.currentPaths,
            regex: this.currentRegex,
            ast: this.parser.getAST()
        };
    }
}

// 初始化应用 - 使用更可靠的方式
function initializeApp() {
    console.log('🚀 准备初始化 HookRegForge...');
    
    // 检查依赖 - 等待一段时间让脚本加载
    const checkEsprima = () => {
        if (typeof esprima === 'undefined') {
            console.warn('⏳ Esprima 库尚未加载，等待中...');
            return false;
        }
        return true;
    };

    const attemptInit = (attempt = 1) => {
        if (checkEsprima()) {
            try {
                window.hookRegForge = new HookRegForge();
                console.log('✅ HookRegForge 初始化成功');
            } catch (error) {
                console.error('❌ 初始化 HookRegForge 失败:', error);
            }
        } else if (attempt < 10) {
            // 最多尝试10次，每次间隔500ms
            setTimeout(() => attemptInit(attempt + 1), 500);
        } else {
            console.error('❌ Esprima 库加载超时，请刷新页面重试');
            // 显示错误消息给用户
            showEsprimaError();
        }
    };

    attemptInit();
}

// 显示Esprima加载错误
function showEsprimaError() {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 2rem;
            border-radius: var(--border-radius-large);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-large);
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        ">
            <i class="fas fa-exclamation-triangle" style="color: var(--accent-error); font-size: 2rem; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 1rem;">依赖库加载失败</h3>
            <p style="margin-bottom: 1rem;">Esprima库未能正确加载，这可能是网络问题或CDN问题。</p>
            <button onclick="location.reload()" style="
                background: var(--accent-primary);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: var(--border-radius);
                cursor: pointer;
            ">刷新页面</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// 多种初始化方式确保成功
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM 已经加载完成
    initializeApp();
}

// 备用初始化
setTimeout(initializeApp, 1000);

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
});

export { HookRegForge };