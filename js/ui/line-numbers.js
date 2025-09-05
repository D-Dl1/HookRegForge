/**
 * 行号显示和同步滚动功能
 */

export class LineNumbers {
    constructor(textareaId, lineNumbersId) {
        this.textarea = document.getElementById(textareaId);
        this.lineNumbers = document.getElementById(lineNumbersId);
        
        if (!this.textarea || !this.lineNumbers) {
            console.error('行号组件初始化失败：找不到必要的DOM元素');
            return;
        }
        
        this.init();
    }
    
    /**
     * 初始化行号功能
     */
    init() {
        // 绑定事件
        this.textarea.addEventListener('input', () => this.updateLineNumbers());
        this.textarea.addEventListener('scroll', () => this.syncScroll());
        this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 初始化行号
        this.updateLineNumbers();
        
        console.log('✅ 行号功能初始化完成');
    }
    
    /**
     * 更新行号显示
     */
    updateLineNumbers() {
        const lines = this.textarea.value.split('\n');
        const lineCount = lines.length;
        
        // 生成行号
        let lineNumbersHtml = '';
        for (let i = 1; i <= lineCount; i++) {
            lineNumbersHtml += i + '\n';
        }
        
        this.lineNumbers.textContent = lineNumbersHtml;
        
        // 同步滚动位置
        this.syncScroll();
    }
    
    /**
     * 同步滚动位置
     */
    syncScroll() {
        this.lineNumbers.scrollTop = this.textarea.scrollTop;
    }
    
    /**
     * 处理键盘事件
     */
    handleKeyDown(e) {
        // Tab键缩进
        if (e.key === 'Tab') {
            e.preventDefault();
            
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            const value = this.textarea.value;
            
            if (e.shiftKey) {
                // Shift+Tab 减少缩进
                this.handleUnindent(start, end, value);
            } else {
                // Tab 增加缩进
                this.handleIndent(start, end, value);
            }
        }
        
        // Enter键自动缩进
        if (e.key === 'Enter') {
            setTimeout(() => this.handleAutoIndent(), 0);
        }
    }
    
    /**
     * 处理缩进
     */
    handleIndent(start, end, value) {
        if (start === end) {
            // 单行缩进
            this.textarea.value = value.substring(0, start) + '    ' + value.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
        } else {
            // 多行缩进
            const beforeSelection = value.substring(0, start);
            const selection = value.substring(start, end);
            const afterSelection = value.substring(end);
            
            const lines = selection.split('\n');
            const indentedLines = lines.map(line => '    ' + line);
            const newSelection = indentedLines.join('\n');
            
            this.textarea.value = beforeSelection + newSelection + afterSelection;
            this.textarea.selectionStart = start;
            this.textarea.selectionEnd = start + newSelection.length;
        }
        
        this.updateLineNumbers();
    }
    
    /**
     * 处理取消缩进
     */
    handleUnindent(start, end, value) {
        if (start === end) {
            // 单行取消缩进
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineEnd = value.indexOf('\n', start);
            const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
            
            if (line.startsWith('    ')) {
                const newLine = line.substring(4);
                this.textarea.value = value.substring(0, lineStart) + newLine + value.substring(lineEnd === -1 ? value.length : lineEnd);
                this.textarea.selectionStart = this.textarea.selectionEnd = Math.max(lineStart, start - 4);
            }
        } else {
            // 多行取消缩进
            const beforeSelection = value.substring(0, start);
            const selection = value.substring(start, end);
            const afterSelection = value.substring(end);
            
            const lines = selection.split('\n');
            const unindentedLines = lines.map(line => line.startsWith('    ') ? line.substring(4) : line);
            const newSelection = unindentedLines.join('\n');
            
            this.textarea.value = beforeSelection + newSelection + afterSelection;
            this.textarea.selectionStart = start;
            this.textarea.selectionEnd = start + newSelection.length;
        }
        
        this.updateLineNumbers();
    }
    
    /**
     * 自动缩进
     */
    handleAutoIndent() {
        const cursorPos = this.textarea.selectionStart;
        const value = this.textarea.value;
        
        // 找到当前行的开始位置
        const lineStart = value.lastIndexOf('\n', cursorPos - 2) + 1;
        const prevLine = value.substring(lineStart, cursorPos - 1);
        
        // 计算前一行的缩进
        const indent = prevLine.match(/^(\s*)/)[1];
        
        // 如果前一行以 { 结尾，增加一级缩进
        let newIndent = indent;
        if (prevLine.trim().endsWith('{')) {
            newIndent += '    ';
        }
        
        if (newIndent) {
            const before = value.substring(0, cursorPos);
            const after = value.substring(cursorPos);
            
            this.textarea.value = before + newIndent + after;
            this.textarea.selectionStart = this.textarea.selectionEnd = cursorPos + newIndent.length;
        }
        
        this.updateLineNumbers();
    }
    
    /**
     * 跳转到指定行
     */
    goToLine(lineNumber) {
        const lines = this.textarea.value.split('\n');
        if (lineNumber < 1 || lineNumber > lines.length) {
            console.warn(`行号 ${lineNumber} 超出范围 (1-${lines.length})`);
            return;
        }
        
        // 计算字符位置
        let charPosition = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            charPosition += lines[i].length + 1; // +1 for newline
        }
        
        // 设置光标位置
        this.textarea.focus();
        this.textarea.selectionStart = this.textarea.selectionEnd = charPosition;
        
        // 滚动到可视区域
        this.scrollToLine(lineNumber);
    }
    
    /**
     * 滚动到指定行
     */
    scrollToLine(lineNumber) {
        const lineHeight = parseInt(getComputedStyle(this.textarea).lineHeight);
        const scrollTop = (lineNumber - 1) * lineHeight;
        
        this.textarea.scrollTop = scrollTop;
        this.syncScroll();
    }
    
    /**
     * 获取当前光标所在行号
     */
    getCurrentLineNumber() {
        const cursorPos = this.textarea.selectionStart;
        const value = this.textarea.value.substring(0, cursorPos);
        return value.split('\n').length;
    }
    
    /**
     * 高亮指定行（用于错误定位）
     */
    highlightLine(lineNumber, className = 'error-line') {
        // 移除之前的高亮
        this.clearHighlight();
        
        // 添加新的高亮
        const lines = this.lineNumbers.textContent.split('\n');
        if (lineNumber > 0 && lineNumber <= lines.length) {
            // 这里可以扩展为更复杂的高亮逻辑
            this.goToLine(lineNumber);
            
            // 添加临时的视觉反馈
            this.textarea.style.background = 'rgba(224, 108, 117, 0.1)';
            setTimeout(() => {
                this.textarea.style.background = 'transparent';
            }, 2000);
        }
    }
    
    /**
     * 清除行高亮
     */
    clearHighlight() {
        this.textarea.style.background = 'transparent';
    }
    
    /**
     * 获取总行数
     */
    getLineCount() {
        return this.textarea.value.split('\n').length;
    }
}