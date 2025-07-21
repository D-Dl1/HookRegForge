/**
 * 应用配置模块
 * 定义所有常量和配置项
 */

export const APP_CONFIG = {
    // 应用信息
    name: 'HookRegForge',
    version: '1.0.0',
    description: 'JavaScript Hook路径正则生成器',

    // DOM选择器
    selectors: {
        // 数据字段
        fields: {
            jsInput: '[data-field="js-input"]',
            targetFunction: '[data-field="target-function"]',
            hookType: '[data-field="hook-type"]',
            depth: '[data-field="depth"]',
            flexible: '[data-field="flexible"]',
            testString: '[data-field="test-string"]'
        },
        
        // 操作按钮
        actions: {
            clear: '[data-action="clear"]',
            loadSample: '[data-action="load-sample"]',
            generate: '[data-action="generate"]',
            copyRegex: '[data-action="copy-regex"]',
            test: '[data-action="test"]',
            expandAst: '[data-action="expand-ast"]'
        },
        
        // 输出区域
        outputs: {
            ast: '[data-output="ast"]',
            regex: '[data-output="regex"]',
            regexExplanation: '[data-output="regex-explanation"]',
            test: '[data-output="test"]'
        },
        
        // 列表和计数器
        lists: {
            paths: '[data-list="paths"]'
        },
        
        counters: {
            paths: '[data-counter="paths"]'
        },
        
        // UI组件
        ui: {
            tabs: '[data-tab]',
            tabPanels: '[data-tab-panel]',
            loadingOverlay: '[data-overlay="loading"]'
        }
    },

    // AST解析配置
    parser: {
        options: {
            range: true,
            loc: true,
            attachComments: true
        },
        maxDepth: 10,
        defaultDepth: 3
    },

    // 正则生成配置
    regex: {
        patterns: {
            identifier: '[a-zA-Z_$][a-zA-Z0-9_$]*',
            property: '(?:[a-zA-Z_$][a-zA-Z0-9_$]*|\\w+)',
            functionCall: '(?:\\(.*?\\))?',
            accessors: '[\\.\\[]'
        },
        flags: 'g'
    },

    // UI配置
    ui: {
        debounceDelay: 500,
        messageDisplayTime: 3000,
        animationDuration: 300,
        maxAstDisplayDepth: 3,
        maxListItems: 100
    },

    // 示例代码
    samples: {
        default: `// 复杂的JavaScript对象结构
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
window['MyApp']['user']['profile']['getName']();`,

        minimal: `function hello() {
    return 'Hello World';
}

hello();`,

        complex: `const obj = {
    nested: {
        deep: {
            func: () => console.log('deep')
        }
    }
};

obj.nested.deep.func();
obj['nested']['deep']['func']();`
    },

    // 消息类型
    messageTypes: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    },

    // Hook类型映射
    hookTypes: {
        function: '函数调用',
        method: '方法调用',
        property: '属性访问',
        all: '全部路径'
    }
};

// 默认配置
export const DEFAULT_CONFIG = {
    targetFunction: '',
    hookType: 'function',
    depth: 3,
    flexible: false
};

// 错误信息
export const ERROR_MESSAGES = {
    PARSE_ERROR: '代码解析失败',
    EMPTY_CODE: '请输入JavaScript代码',
    NO_REGEX: '没有可复制的正则表达式',
    NO_TEST_STRING: '请输入测试字符串',
    REGEX_ERROR: '正则表达式错误',
    NO_AST: '请先解析JavaScript代码'
};

// 成功信息
export const SUCCESS_MESSAGES = {
    SYNTAX_VALID: '语法正确',
    HOOK_GENERATED: 'Hook正则生成完成',
    REGEX_COPIED: '正则表达式已复制到剪贴板'
};