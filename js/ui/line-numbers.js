/**
 * 行号显示和同步滚动功能 - 鲁棒性版本
 */

export class LineNumbers {
    constructor(textareaId, lineNumbersId) {
        this.textarea = document.getElementById(textareaId);
        this.lineNumbers = document.getElementById(lineNumbersId);
        
        if (!this.textarea || !this.lineNumbers) {
            console.error('行号组件初始化失败：找不到必要的DOM元素');
            throw new Error('LineNumbers initialization failed: missing DOM elements');
        }
        
        // 防抖延迟
        this.debounceDelay = 100;
        this.updateTimeout = null;
        this.scrollTimeout = null;
        
        // 缓存计算结果
        this.cachedLineCount = 0;
        this.cachedScrollTop = -1;
        
        this.init();
    }
    
    /**
     * 初始化行号功能
     */
    init() {
        try {
            // 绑定事件 - 使用防抖
            this.textarea.addEventListener('input', () => this.debouncedUpdateLineNumbers());
            this.textarea.addEventListener('scroll', () => this.debouncedSyncScroll());
            this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
            
            // 窗口大小变化时重新计算
            window.addEventListener('resize', () => this.debouncedUpdateLineNumbers());
            
            // 初始化行号
            this.updateLineNumbers();
            
            console.log('✅ 行号功能初始化完成');
        } catch (error) {
            console.error('❌ 行号功能初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 防抖更新行号
     */
    debouncedUpdateLineNumbers() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            this.updateLineNumbers();
        }, this.debounceDelay);
    }

    /**
     * 防抖同步滚动
     */
    debouncedSyncScroll() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
            this.syncScroll();
        }, 16); // 60fps
    }

    /**
     * 更新行号显示
     */
    updateLineNumbers() {
        try {
            if (!this.textarea || !this.lineNumbers) {
                console.warn('DOM元素已被销毁，跳过行号更新');
                return;
            }

            const content = this.textarea.value || '';
            const lines = content.split('\n');
            const lineCount = lines.length;
            
            // 如果行数没有变化，跳过更新
            if (lineCount === this.cachedLineCount) {
                return;
            }
            
            this.cachedLineCount = lineCount;
            
            // 生成行号 - 确保至少有一行
            const numbers = [];
            for (let i = 1; i <= Math.max(1, lineCount); i++) {
                numbers.push(i.toString());
            }
            
            // 更新行号显示
            this.lineNumbers.textContent = numbers.join('\n');
            
            // 确保行号容器的样式正确
            this.ensureCorrectStyling();
            
            // 同步滚动位置
            this.syncScroll();
            
        } catch (error) {
            console.error('更新行号时出错:', error);
        }
    }
    
    /**
     * 确保正确的样式设置
     */
    ensureCorrectStyling() {
        try {
            // 确保行号和文本区域有相同的行高和字体
            const textareaStyles = window.getComputedStyle(this.textarea);
            const lineHeight = textareaStyles.lineHeight;
            const fontSize = textareaStyles.fontSize;
            const fontFamily = textareaStyles.fontFamily;
            
            this.lineNumbers.style.lineHeight = lineHeight;
            this.lineNumbers.style.fontSize = fontSize;
            this.lineNumbers.style.fontFamily = fontFamily;
            
        } catch (error) {
            console.warn('设置行号样式时出错:', error);
        }
    }

    /**
     * 同步滚动位置
     */
    syncScroll() {
        try {
            if (!this.textarea || !this.lineNumbers) {
                return;
            }
            
            const scrollTop = this.textarea.scrollTop;
            
            // 如果滚动位置没有变化，跳过更新
            if (scrollTop === this.cachedScrollTop) {
                return;
            }
            
            this.cachedScrollTop = scrollTop;
            this.lineNumbers.scrollTop = scrollTop;
            
        } catch (error) {
            console.error('同步滚动时出错:', error);
        }
    }
    
    /**
     * 处理键盘事件
     */
    handleKeyDown(e) {
        try {
            // Tab键缩进
            if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabIndent(e.shiftKey);
            }
            
            // 延迟更新行号（因为内容可能会变化）
            if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
                setTimeout(() => this.debouncedUpdateLineNumbers(), 0);
            }
        } catch (error) {
            console.error('处理键盘事件时出错:', error);
        }
    }
    
    /**
     * 处理Tab缩进
     */
    handleTabIndent(isShift) {
        try {
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            const value = this.textarea.value;
            
            if (isShift) {
                // Shift+Tab: 减少缩进
                this.removeIndent(start, end, value);
            } else {
                // Tab: 增加缩进
                this.addIndent(start, end, value);
            }
            
            // 更新行号
            this.debouncedUpdateLineNumbers();
        } catch (error) {
            console.error('处理Tab缩进时出错:', error);
        }
    }

    /**
     * 增加缩进
     */
    addIndent(start, end, value) {
        const indent = '    '; // 4个空格
        
        if (start === end) {
            // 单行缩进
            this.textarea.value = value.substring(0, start) + indent + value.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + indent.length;
        } else {
            // 多行缩进
            const beforeSelection = value.substring(0, start);
            const selection = value.substring(start, end);
            const afterSelection = value.substring(end);
            
            const lines = selection.split('\n');
            const indentedLines = lines.map(line => indent + line);
            const newSelection = indentedLines.join('\n');
            
            this.textarea.value = beforeSelection + newSelection + afterSelection;
            this.textarea.selectionStart = start;
            this.textarea.selectionEnd = start + newSelection.length;
        }
    }
    
    /**
     * 减少缩进
     */
    removeIndent(start, end, value) {
        const indent = '    '; // 4个空格
        
        if (start === end) {
            // 单行取消缩进
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineEnd = value.indexOf('\n', start);
            const lineContent = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
            
            if (lineContent.startsWith(indent)) {
                const newLine = lineContent.substring(indent.length);
                this.textarea.value = value.substring(0, lineStart) + newLine + 
                                   value.substring(lineEnd === -1 ? value.length : lineEnd);
                this.textarea.selectionStart = this.textarea.selectionEnd = Math.max(lineStart, start - indent.length);
            }
        } else {
            // 多行取消缩进
            const beforeSelection = value.substring(0, start);
            const selection = value.substring(start, end);
            const afterSelection = value.substring(end);
            
            const lines = selection.split('\n');
            const unindentedLines = lines.map(line => 
                line.startsWith(indent) ? line.substring(indent.length) : line
            );
            const newSelection = unindentedLines.join('\n');
            
            this.textarea.value = beforeSelection + newSelection + afterSelection;
            this.textarea.selectionStart = start;
            this.textarea.selectionEnd = start + newSelection.length;
        }
    }
    
    /**
     * 跳转到指定行
     */
    goToLine(lineNumber) {
        try {
            if (!this.textarea) {
                throw new Error('Textarea not available');
            }

            const lines = this.textarea.value.split('\n');
            const totalLines = lines.length;
            
            if (lineNumber < 1 || lineNumber > totalLines) {
                console.warn(`行号 ${lineNumber} 超出范围 (1-${totalLines})`);
                return false;
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
            
            return true;
        } catch (error) {
            console.error('跳转到行时出错:', error);
            return false;
        }
    }
    
    /**
     * 滚动到指定行
     */
    scrollToLine(lineNumber) {
        try {
            const textareaStyles = window.getComputedStyle(this.textarea);
            const lineHeight = parseInt(textareaStyles.lineHeight) || 20;
            const scrollTop = Math.max(0, (lineNumber - 1) * lineHeight);
            
            this.textarea.scrollTop = scrollTop;
            this.syncScroll();
        } catch (error) {
            console.error('滚动到行时出错:', error);
        }
    }
    
    /**
     * 获取当前光标所在行号
     */
    getCurrentLineNumber() {
        try {
            if (!this.textarea) {
                return 1;
            }
            
            const cursorPos = this.textarea.selectionStart;
            const value = this.textarea.value.substring(0, cursorPos);
            return value.split('\n').length;
        } catch (error) {
            console.error('获取当前行号时出错:', error);
            return 1;
        }
    }
    
    /**
     * 高亮指定行（用于错误定位）
     */
    highlightLine(lineNumber, duration = 2000) {
        try {
            if (!this.goToLine(lineNumber)) {
                return;
            }
            
            // 添加临时的视觉反馈
            this.textarea.style.background = 'rgba(224, 108, 117, 0.1)';
            this.textarea.style.transition = 'background-color 0.3s ease';
            
            setTimeout(() => {
                this.textarea.style.background = 'transparent';
            }, duration);
            
        } catch (error) {
            console.error('高亮行时出错:', error);
        }
    }
    
    /**
     * 清除行高亮
     */
    clearHighlight() {
        try {
            if (this.textarea) {
                this.textarea.style.background = 'transparent';
            }
        } catch (error) {
            console.error('清除高亮时出错:', error);
        }
    }
    
    /**
     * 获取总行数
     */
    getLineCount() {
        try {
            if (!this.textarea) {
                return 0;
            }
            return Math.max(1, this.textarea.value.split('\n').length);
        } catch (error) {
            console.error('获取行数时出错:', error);
            return 1;
        }
    }
    
    /**
     * 销毁行号功能
     */
    destroy() {
        try {
            // 清理定时器
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
                this.updateTimeout = null;
            }
            
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = null;
            }
            
            // 清理引用
            this.textarea = null;
            this.lineNumbers = null;
            
            console.log('✅ 行号功能已销毁');
        } catch (error) {
            console.error('销毁行号功能时出错:', error);
        }
    }
}