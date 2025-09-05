/**
 * 备用事件处理机制
 * 当主应用模块加载失败时提供基本功能
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 备用事件处理器启动...');
    
    // 检查主应用是否已加载
    setTimeout(() => {
        if (!window.hookRegForge) {
            console.log('⚠️ 主应用未加载，启用备用功能...');
            initializeFallbackHandlers();
        } else {
            console.log('✅ 主应用已加载，备用处理器待命');
        }
    }, 2000);
});

function initializeFallbackHandlers() {
    // 示例代码
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
        }
    },
    utils: {
        crypto: {
            encrypt: function(data) {
                return btoa(JSON.stringify(data));
            }
        }
    }
};

// 函数调用示例
function processUserData(userData) {
    const name = MyApp.user.profile.getName();
    const encrypted = MyApp.utils.crypto.encrypt(userData);
    return { name, data: encrypted };
}

// 动态属性访问
window['MyApp']['user']['profile']['getName']();`;

    // 显示消息
    function showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.style.cssText = `
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
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
    
    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 备用处理器
    const fallbackHandlers = {
        clear: function() {
            console.log('🎯 [备用] 清空按钮被点击');
            const jsInput = document.querySelector('[data-field="js-input"]');
            if (jsInput) {
                jsInput.value = '';
                showMessage('输入已清空', 'success');
            }
        },
        
        'load-sample': function() {
            console.log('🎯 [备用] 加载示例按钮被点击');
            const jsInput = document.querySelector('[data-field="js-input"]');
            const targetFunction = document.querySelector('[data-field="target-function"]');
            
            if (jsInput) {
                jsInput.value = sampleCode;
            }
            if (targetFunction) {
                targetFunction.value = 'getName';
            }
            
            showMessage('示例代码已加载', 'success');
        },
        
        generate: function() {
            console.log('🎯 [备用] 生成按钮被点击');
            const jsInput = document.querySelector('[data-field="js-input"]');
            const code = jsInput?.value?.trim();
            
            if (!code) {
                showMessage('请输入JavaScript代码', 'error');
                return;
            }
            
            if (typeof esprima === 'undefined') {
                showMessage('Esprima库未加载，无法解析代码', 'error');
                return;
            }
            
            try {
                showMessage('正在解析代码...', 'info');
                const ast = esprima.parseScript(code);
                
                // 显示简化的AST
                const astOutput = document.querySelector('[data-output="ast"]');
                if (astOutput) {
                    astOutput.innerHTML = `<code>${escapeHtml(JSON.stringify(ast, null, 2).substring(0, 1000))}...</code>`;
                }
                
                // 简单的路径提取
                const paths = extractSimplePaths(code);
                
                // 显示路径
                const pathsList = document.querySelector('[data-list="paths"]');
                const pathsCounter = document.querySelector('[data-counter="paths"]');
                
                if (pathsCounter) {
                    pathsCounter.textContent = `${paths.length} 个路径`;
                }
                
                if (pathsList) {
                    if (paths.length === 0) {
                        pathsList.innerHTML = '<div class="empty-state">未找到函数路径</div>';
                    } else {
                        const pathsHtml = paths.map(path => `
                            <div class="path-item">
                                <div class="path-name">${escapeHtml(path)}</div>
                                <div class="path-details">类型: 检测到的调用</div>
                            </div>
                        `).join('');
                        pathsList.innerHTML = pathsHtml;
                    }
                }
                
                // 生成简单正则
                const regex = generateSimpleRegex(paths);
                const regexOutput = document.querySelector('[data-output="regex"]');
                const regexExplanation = document.querySelector('[data-output="regex-explanation"]');
                
                if (regexOutput) {
                    regexOutput.innerHTML = `<code>${escapeHtml(regex)}</code>`;
                }
                if (regexExplanation) {
                    regexExplanation.innerHTML = `生成了匹配 ${paths.length} 个路径的正则表达式`;
                }
                
                showMessage('代码分析完成（简化版）', 'success');
                
            } catch (error) {
                showMessage(`代码解析失败: ${error.message}`, 'error');
            }
        },
        
        'copy-regex': function() {
            console.log('🎯 [备用] 复制正则按钮被点击');
            const regexOutput = document.querySelector('[data-output="regex"] code');
            const regex = regexOutput?.textContent;
            
            if (!regex) {
                showMessage('没有可复制的正则表达式', 'error');
                return;
            }
            
            navigator.clipboard.writeText(regex).then(() => {
                showMessage('正则表达式已复制', 'success');
            }).catch(() => {
                showMessage('复制失败', 'error');
            });
        },
        
        test: function() {
            console.log('🎯 [备用] 测试按钮被点击');
            const regexOutput = document.querySelector('[data-output="regex"] code');
            const regex = regexOutput?.textContent;
            const testString = document.querySelector('[data-field="test-string"]')?.value;
            
            if (!regex) {
                showMessage('没有可测试的正则表达式', 'error');
                return;
            }
            
            if (!testString) {
                showMessage('请输入测试字符串', 'error');
                return;
            }
            
            try {
                const regexObj = new RegExp(regex, 'g');
                const matches = [];
                let match;
                
                while ((match = regexObj.exec(testString)) !== null) {
                    matches.push({
                        text: match[0],
                        position: match.index
                    });
                }
                
                const testOutput = document.querySelector('[data-output="test"]');
                if (testOutput) {
                    if (matches.length === 0) {
                        testOutput.innerHTML = '<div>没有找到匹配项</div>';
                        showMessage('没有找到匹配项', 'info');
                    } else {
                        const matchesHtml = matches.map((match, index) => `
                            <div class="match-result">
                                <div>匹配 ${index + 1}: "${escapeHtml(match.text)}"</div>
                                <div>位置: ${match.position}</div>
                            </div>
                        `).join('');
                        testOutput.innerHTML = matchesHtml;
                        showMessage(`找到 ${matches.length} 个匹配项`, 'success');
                    }
                }
                
            } catch (error) {
                showMessage(`正则测试失败: ${error.message}`, 'error');
            }
        },
        
        'expand-ast': function() {
            console.log('🎯 [备用] 展开AST按钮被点击');
            showMessage('AST展开功能需要完整版应用', 'info');
        }
    };
    
    // 简单的路径提取
    function extractSimplePaths(code) {
        const paths = [];
        
        // 匹配常见的调用模式
        const patterns = [
            /(\w+(?:\.\w+)+)\s*\(/g,  // obj.method()
            /(\w+(?:\[\s*['"][^'"]*['"]\s*\])+)/g,  // obj["prop"]
            /(\w+(?:\.\w+)*)/g  // obj.prop
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                const path = match[1];
                if (path && path.includes('.') && !paths.includes(path)) {
                    paths.push(path);
                }
            }
        });
        
        return paths.slice(0, 20); // 限制数量
    }
    
    // 生成简单正则
    function generateSimpleRegex(paths) {
        if (paths.length === 0) return '';
        
        const escapedPaths = paths.map(path => 
            path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        
        return escapedPaths.length === 1 ? 
            escapedPaths[0] : 
            `(${escapedPaths.join('|')})`;
    }
    
    // 文件上传处理
    function handleFileUpload(file) {
        if (!file) return;
        
        showMessage(`正在读取文件: ${file.name}`, 'info');
        
        if (file.size > 10 * 1024 * 1024) {
            showMessage('文件大小超过限制', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const jsInput = document.querySelector('[data-field="js-input"]');
            if (jsInput) {
                jsInput.value = e.target.result;
                showMessage(`文件 "${file.name}" 上传成功`, 'success');
            }
        };
        
        reader.onerror = function() {
            showMessage('文件读取失败', 'error');
        };
        
        reader.readAsText(file);
    }
    
    // 绑定事件
    console.log('🔗 [备用] 绑定事件处理器...');
    
    // 按钮点击事件
    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        if (action && fallbackHandlers[action]) {
            e.preventDefault();
            e.stopPropagation();
            fallbackHandlers[action]();
        }
    });
    
    // 文件上传事件
    const fileInput = document.querySelector('[data-field="file-input"]');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
    }
    
    showMessage('备用功能已激活', 'info');
    console.log('✅ [备用] 事件绑定完成');
}

// 导出给全局使用
window.fallbackEvents = {
    initialize: initializeFallbackHandlers
};