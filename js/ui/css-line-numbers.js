/**
 * CSS行号功能 - 纯CSS方案备用
 * 使用CSS计数器和背景同步，最小JavaScript干预
 */

export class CSSLineNumbers {
    constructor(textareaId, containerId) {
        this.textarea = document.getElementById(textareaId);
        this.container = document.getElementById(containerId);
        
        if (!this.textarea || !this.container) {
            throw new Error('必要的DOM元素未找到');
        }
        
        this.init();
    }
    
    init() {
        // 创建CSS行号容器
        this.createCSSLineNumbers();
        
        // 只监听必要的事件
        this.textarea.addEventListener('input', this.updateLineNumbers.bind(this));
        this.textarea.addEventListener('scroll', this.syncScroll.bind(this), { passive: true });
        
        // 初始更新
        this.updateLineNumbers();
        
        console.log('✅ CSS行号功能初始化完成');
    }
    
    createCSSLineNumbers() {
        // 创建行号背景层
        const lineNumbersBg = document.createElement('div');
        lineNumbersBg.className = 'line-numbers-bg';
        lineNumbersBg.id = 'line-numbers-bg';
        
        // 设置容器为相对定位
        this.container.style.position = 'relative';
        this.container.insertBefore(lineNumbersBg, this.textarea);
        
        // 添加CSS样式
        this.addCSSRules();
    }
    
    addCSSRules() {
        const styleId = 'css-line-numbers-style';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .line-numbers-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 60px;
                height: 100%;
                background: var(--bg-tertiary);
                border-right: 1px solid var(--border-color);
                pointer-events: none;
                z-index: 1;
                overflow: hidden;
            }
            
            .line-numbers-content {
                color: var(--text-muted);
                font-family: var(--font-mono);
                font-size: 14px;
                line-height: 1.5;
                padding: 1rem 0.75rem 1rem 0.5rem;
                text-align: right;
                white-space: pre;
                user-select: none;
                counter-reset: line-counter;
            }
            
            .line-numbers-content::before {
                counter-increment: line-counter;
                content: counter(line-counter);
                display: block;
            }
            
            /* 确保textarea在行号之上 */
            .code-input {
                position: relative;
                z-index: 2;
                padding-left: calc(60px + 1rem) !important;
                background: transparent !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    updateLineNumbers() {
        const lineNumbersBg = document.getElementById('line-numbers-bg');
        if (!lineNumbersBg) return;
        
        const lines = this.textarea.value.split('\n');
        const lineCount = lines.length;
        
        // 生成行号内容
        let content = '';
        for (let i = 1; i <= lineCount; i++) {
            content += i + '\n';
        }
        
        lineNumbersBg.innerHTML = `<div class="line-numbers-content">${content}</div>`;
        
        // 同步滚动
        this.syncScroll();
    }
    
    syncScroll() {
        const lineNumbersBg = document.getElementById('line-numbers-bg');
        const lineNumbersContent = lineNumbersBg?.querySelector('.line-numbers-content');
        
        if (lineNumbersContent) {
            lineNumbersContent.style.transform = `translateY(-${this.textarea.scrollTop}px)`;
        }
    }
    
    goToLine(lineNumber) {
        if (!this.textarea) return false;
        
        const lines = this.textarea.value.split('\n');
        if (lineNumber < 1 || lineNumber > lines.length) return false;
        
        let pos = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            pos += lines[i].length + 1;
        }
        
        this.textarea.focus();
        this.textarea.selectionStart = this.textarea.selectionEnd = pos;
        return true;
    }
    
    getCurrentLineNumber() {
        if (!this.textarea) return 1;
        
        const pos = this.textarea.selectionStart;
        const text = this.textarea.value.substring(0, pos);
        return text.split('\n').length;
    }
    
    getLineCount() {
        if (!this.textarea) return 1;
        return this.textarea.value.split('\n').length;
    }
    
    highlightLine(lineNumber) {
        if (this.goToLine(lineNumber)) {
            this.textarea.style.background = 'rgba(224, 108, 117, 0.1)';
            setTimeout(() => {
                this.textarea.style.background = 'transparent';
            }, 2000);
        }
    }
    
    destroy() {
        // 移除添加的样式
        const style = document.getElementById('css-line-numbers-style');
        if (style) {
            style.remove();
        }
        
        // 移除行号背景
        const lineNumbersBg = document.getElementById('line-numbers-bg');
        if (lineNumbersBg) {
            lineNumbersBg.remove();
        }
        
        // 恢复textarea样式
        this.textarea.style.paddingLeft = '';
        
        console.log('✅ CSS行号功能已销毁');
    }
}