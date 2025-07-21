/**
 * 通用工具函数模块
 */

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
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

/**
 * HTML转义
 * @param {string} text 要转义的文本
 * @returns {string} 转义后的文本
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise<boolean>} 是否成功复制
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            return true;
        } catch (err) {
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

/**
 * 格式化AST用于显示
 * @param {Object} node AST节点
 * @param {number} depth 当前深度
 * @param {number} maxDepth 最大深度
 * @returns {string} 格式化后的字符串
 */
export function formatAstForDisplay(node, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return '...';
    
    if (typeof node !== 'object' || node === null) {
        return JSON.stringify(node);
    }

    const indent = '  '.repeat(depth);
    const nextIndent = '  '.repeat(depth + 1);
    
    if (Array.isArray(node)) {
        if (node.length === 0) return '[]';
        const items = node.slice(0, 10).map(item => 
            nextIndent + formatAstForDisplay(item, depth + 1, maxDepth)
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
        const value = formatAstForDisplay(node[key], depth + 1, maxDepth);
        return `${nextIndent}"${key}": ${value}`;
    });
    
    return '{\n' + pairs.join(',\n') + 
           (keys.length > 8 ? ',\n' + nextIndent + '...' : '') + 
           '\n' + indent + '}';
}

/**
 * 获取DOM元素
 * @param {string} selector CSS选择器
 * @returns {Element|null} DOM元素
 */
export function getElement(selector) {
    return document.querySelector(selector);
}

/**
 * 获取DOM元素列表
 * @param {string} selector CSS选择器
 * @returns {NodeList} DOM元素列表
 */
export function getElements(selector) {
    return document.querySelectorAll(selector);
}

/**
 * 创建DOM元素
 * @param {string} tag 标签名
 * @param {Object} attributes 属性对象
 * @param {string} content 内容
 * @returns {Element} 创建的元素
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    if (content) {
        element.textContent = content;
    }
    
    return element;
}

/**
 * 检查是否为有效的JavaScript语法
 * @param {string} code JavaScript代码
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateJavaScript(code) {
    try {
        if (typeof esprima !== 'undefined') {
            esprima.parseScript(code);
        } else {
            // 如果esprima不可用，使用简单的语法检查
            new Function(code);
        }
        return { valid: true };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 生成唯一ID
 * @param {string} prefix 前缀
 * @returns {string} 唯一ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 安全地解析JSON
 * @param {string} jsonString JSON字符串
 * @param {any} defaultValue 默认值
 * @returns {any} 解析结果
 */
export function safeJsonParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return defaultValue;
    }
}

/**
 * 检查对象是否为空
 * @param {Object} obj 要检查的对象
 * @returns {boolean} 是否为空
 */
export function isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}