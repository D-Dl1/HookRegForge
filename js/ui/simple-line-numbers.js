/**
 * 简单行号功能 - 最小可用版本
 */

export class SimpleLineNumbers {
    constructor(textareaId, lineNumbersId) {
        this.textarea = document.getElementById(textareaId);
        this.lineNumbers = document.getElementById(lineNumbersId);
        
        if (this.textarea && this.lineNumbers) {
            this.init();
        }
    }
    
    init() {
        // 简单绑定事件
        this.textarea.addEventListener('input', () => this.update());
        this.textarea.addEventListener('scroll', () => this.sync());
        this.textarea.addEventListener('keydown', () => {
            // 延迟更新以确保内容变化后更新行号
            setTimeout(() => this.update(), 0);
        });
        
        // 窗口大小变化时重新同步
        window.addEventListener('resize', () => this.sync());
        
        // 初始更新
        this.update();
        
        console.log('✅ 简单行号功能初始化完成');
    }
    
    update() {
        if (!this.textarea || !this.lineNumbers) return;
        
        const lines = this.textarea.value.split('\n');
        const lineCount = lines.length;
        
        let numbers = '';
        for (let i = 1; i <= lineCount; i++) {
            numbers += i + '\n';
        }
        
        this.lineNumbers.textContent = numbers;
        this.sync();
    }
    
    sync() {
        if (this.textarea && this.lineNumbers) {
            // 确保滚动同步
            this.lineNumbers.scrollTop = this.textarea.scrollTop;
            
            // 确保样式匹配
            const textareaStyles = window.getComputedStyle(this.textarea);
            this.lineNumbers.style.lineHeight = textareaStyles.lineHeight;
            this.lineNumbers.style.fontSize = textareaStyles.fontSize;
            this.lineNumbers.style.fontFamily = textareaStyles.fontFamily;
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
}