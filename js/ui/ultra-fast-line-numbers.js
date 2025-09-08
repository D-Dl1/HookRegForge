/**
 * 超快行号功能 - 终极优化版本
 * 使用最少的DOM操作和最高效的同步机制
 */

export class UltraFastLineNumbers {
    constructor(textareaId, lineNumbersId) {
        this.textarea = document.getElementById(textareaId);
        this.lineNumbers = document.getElementById(lineNumbersId);
        
        if (!this.textarea || !this.lineNumbers) {
            throw new Error('必要的DOM元素未找到');
        }
        
        // 缓存
        this.lastLineCount = 0;
        this.lineNumbersCache = '';
        
        // 使用WeakMap避免内存泄漏
        this.eventCache = new WeakMap();
        
        this.init();
    }
    
    init() {
        // 预设样式匹配
        this.matchStyles();
        
        // 使用最少的事件监听器
        this.bindEvents();
        
        // 初始化
        this.updateLineNumbers();
        
        console.log('✅ 超快行号功能初始化完成');
    }
    
    matchStyles() {
        // 一次性设置所有样式
        const textareaComputedStyle = getComputedStyle(this.textarea);
        const style = this.lineNumbers.style;
        
        style.lineHeight = textareaComputedStyle.lineHeight;
        style.fontSize = textareaComputedStyle.fontSize;
        style.fontFamily = textareaComputedStyle.fontFamily;
        style.paddingTop = textareaComputedStyle.paddingTop;
        style.paddingBottom = textareaComputedStyle.paddingBottom;
    }
    
    bindEvents() {
        // 使用事件委托和passive监听器
        const scrollHandler = () => {
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
        };
        
        const updateHandler = () => {
            this.updateLineNumbers();
        };
        
        // 滚动事件 - 最高优先级，无延迟
        this.textarea.addEventListener('scroll', scrollHandler, { 
            passive: true,
            capture: false 
        });
        
        // 输入事件 - 使用防抖但保持响应性
        let updateTimer;
        const debouncedUpdate = () => {
            if (updateTimer) clearTimeout(updateTimer);
            updateTimer = setTimeout(updateHandler, 16); // ~60fps
        };
        
        this.textarea.addEventListener('input', debouncedUpdate, { passive: true });
        
        // 键盘事件 - 只监听关键按键
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
                // 使用微任务确保DOM更新后执行
                queueMicrotask(updateHandler);
            }
        });
        
        // 窗口大小变化
        let resizeTimer;
        window.addEventListener('resize', () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.matchStyles();
                scrollHandler();
            }, 100);
        }, { passive: true });
    }
    
    updateLineNumbers() {
        const value = this.textarea.value;
        const lineCount = (value.match(/\n/g) || []).length + 1;
        
        // 只在行数真正变化时更新
        if (lineCount === this.lastLineCount) return;
        
        this.lastLineCount = lineCount;
        
        // 使用更高效的字符串构建
        if (lineCount <= 1000) {
            // 小文件：直接构建
            this.lineNumbersCache = Array.from(
                { length: lineCount }, 
                (_, i) => i + 1
            ).join('\n');
        } else {
            // 大文件：分块构建
            const chunks = [];
            const chunkSize = 100;
            
            for (let i = 0; i < lineCount; i += chunkSize) {
                const chunk = [];
                const end = Math.min(i + chunkSize, lineCount);
                
                for (let j = i; j < end; j++) {
                    chunk.push(j + 1);
                }
                
                chunks.push(chunk.join('\n'));
            }
            
            this.lineNumbersCache = chunks.join('\n');
        }
        
        // 使用textContent而不是innerHTML提高性能
        this.lineNumbers.textContent = this.lineNumbersCache;
        
        // 立即同步滚动
        this.lineNumbers.scrollTop = this.textarea.scrollTop;
    }
    
    // 公共API方法
    goToLine(lineNumber) {
        if (!this.textarea) return false;
        
        const lines = this.textarea.value.split('\n');
        if (lineNumber < 1 || lineNumber > lines.length) return false;
        
        // 计算位置
        let pos = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            pos += lines[i].length + 1;
        }
        
        // 设置光标并滚动
        this.textarea.focus();
        this.textarea.setSelectionRange(pos, pos);
        
        // 计算滚动位置
        const lineHeight = parseFloat(getComputedStyle(this.textarea).lineHeight) || 20;
        const scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
        
        this.textarea.scrollTop = scrollTop;
        this.lineNumbers.scrollTop = scrollTop;
        
        return true;
    }
    
    getCurrentLineNumber() {
        if (!this.textarea) return 1;
        
        const pos = this.textarea.selectionStart;
        const text = this.textarea.value.substring(0, pos);
        return (text.match(/\n/g) || []).length + 1;
    }
    
    getLineCount() {
        if (!this.textarea) return 1;
        return (this.textarea.value.match(/\n/g) || []).length + 1;
    }
    
    highlightLine(lineNumber, duration = 2000) {
        if (!this.goToLine(lineNumber)) return;
        
        // 使用CSS变量实现高亮
        this.textarea.style.setProperty('--highlight-color', 'rgba(224, 108, 117, 0.1)');
        this.textarea.style.backgroundColor = 'var(--highlight-color)';
        this.textarea.style.transition = 'background-color 0.3s ease';
        
        setTimeout(() => {
            this.textarea.style.backgroundColor = 'transparent';
            setTimeout(() => {
                this.textarea.style.removeProperty('--highlight-color');
                this.textarea.style.transition = '';
            }, 300);
        }, duration);
    }
    
    clearHighlight() {
        this.textarea.style.backgroundColor = 'transparent';
        this.textarea.style.removeProperty('--highlight-color');
        this.textarea.style.transition = '';
    }
    
    destroy() {
        // 清理缓存
        this.eventCache = null;
        this.lineNumbersCache = '';
        
        // 清理引用
        this.textarea = null;
        this.lineNumbers = null;
        
        console.log('✅ 超快行号功能已销毁');
    }
}