/**
 * 实时行号功能 - 零延迟版本
 * 使用高性能同步机制，确保滚动无延迟
 */

export class RealtimeLineNumbers {
    constructor(textareaId, lineNumbersId) {
        this.textarea = document.getElementById(textareaId);
        this.lineNumbers = document.getElementById(lineNumbersId);
        
        if (!this.textarea || !this.lineNumbers) {
            throw new Error('必要的DOM元素未找到');
        }
        
        // 缓存变量，避免重复计算
        this.lastLineCount = 0;
        this.lastScrollTop = -1;
        this.isUpdating = false;
        this.animationFrame = null;
        
        // 预计算样式
        this.computeStyles();
        
        this.init();
    }
    
    /**
     * 预计算并缓存样式
     */
    computeStyles() {
        const textareaStyles = window.getComputedStyle(this.textarea);
        this.cachedStyles = {
            lineHeight: textareaStyles.lineHeight,
            fontSize: textareaStyles.fontSize,
            fontFamily: textareaStyles.fontFamily,
            paddingTop: textareaStyles.paddingTop,
            paddingBottom: textareaStyles.paddingBottom
        };
        
        // 应用样式到行号容器
        this.applyStyles();
    }
    
    /**
     * 应用缓存的样式
     */
    applyStyles() {
        const styles = this.cachedStyles;
        this.lineNumbers.style.lineHeight = styles.lineHeight;
        this.lineNumbers.style.fontSize = styles.fontSize;
        this.lineNumbers.style.fontFamily = styles.fontFamily;
        this.lineNumbers.style.paddingTop = styles.paddingTop;
        this.lineNumbers.style.paddingBottom = styles.paddingBottom;
    }
    
    init() {
        // 使用passive事件监听器提高性能
        this.textarea.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        
        // 输入事件使用immediate更新
        this.textarea.addEventListener('input', this.handleInput.bind(this), { passive: true });
        
        // 键盘事件立即响应
        this.textarea.addEventListener('keydown', this.handleKeydown.bind(this));
        this.textarea.addEventListener('keyup', this.handleKeyup.bind(this), { passive: true });
        
        // 窗口大小变化时重新计算样式
        window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
        
        // 初始化
        this.updateLineNumbers();
        this.syncScroll();
        
        console.log('✅ 实时行号功能初始化完成');
    }
    
    /**
     * 处理滚动事件 - 立即同步，无延迟
     */
    handleScroll() {
        this.syncScroll();
    }
    
    /**
     * 处理输入事件
     */
    handleInput() {
        this.updateLineNumbers();
    }
    
    /**
     * 处理按键按下事件
     */
    handleKeydown(e) {
        // 对于会改变行数的按键，立即更新
        if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
            // 使用微任务确保DOM更新后立即执行
            Promise.resolve().then(() => {
                this.updateLineNumbers();
            });
        }
    }
    
    /**
     * 处理按键释放事件
     */
    handleKeyup() {
        // 确保所有变化都被捕获
        this.updateLineNumbers();
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        this.computeStyles();
        this.syncScroll();
    }
    
    /**
     * 立即同步滚动 - 零延迟
     */
    syncScroll() {
        const currentScrollTop = this.textarea.scrollTop;
        
        // 只在滚动位置真正改变时更新
        if (currentScrollTop !== this.lastScrollTop) {
            this.lineNumbers.scrollTop = currentScrollTop;
            this.lastScrollTop = currentScrollTop;
        }
    }
    
    /**
     * 更新行号显示
     */
    updateLineNumbers() {
        // 防止重复更新
        if (this.isUpdating) return;
        
        const lines = this.textarea.value.split('\n');
        const lineCount = lines.length;
        
        // 只在行数变化时更新
        if (lineCount === this.lastLineCount) return;
        
        this.isUpdating = true;
        this.lastLineCount = lineCount;
        
        // 使用DocumentFragment提高性能
        const fragment = document.createDocumentFragment();
        const textNode = document.createTextNode(this.generateLineNumbers(lineCount));
        fragment.appendChild(textNode);
        
        // 清空并添加新内容
        this.lineNumbers.textContent = '';
        this.lineNumbers.appendChild(fragment);
        
        // 立即同步滚动
        this.syncScroll();
        
        this.isUpdating = false;
    }
    
    /**
     * 生成行号字符串
     */
    generateLineNumbers(lineCount) {
        const numbers = [];
        for (let i = 1; i <= lineCount; i++) {
            numbers.push(i.toString());
        }
        return numbers.join('\n');
    }
    
    /**
     * 跳转到指定行
     */
    goToLine(lineNumber) {
        if (!this.textarea) return false;
        
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
    }
    
    /**
     * 滚动到指定行
     */
    scrollToLine(lineNumber) {
        const lineHeight = parseInt(this.cachedStyles.lineHeight) || 20;
        const scrollTop = Math.max(0, (lineNumber - 3) * lineHeight); // -3 for better visibility
        
        this.textarea.scrollTop = scrollTop;
        this.syncScroll();
    }
    
    /**
     * 获取当前光标所在行号
     */
    getCurrentLineNumber() {
        if (!this.textarea) return 1;
        
        const cursorPos = this.textarea.selectionStart;
        const value = this.textarea.value.substring(0, cursorPos);
        return value.split('\n').length;
    }
    
    /**
     * 获取总行数
     */
    getLineCount() {
        if (!this.textarea) return 1;
        return this.textarea.value.split('\n').length;
    }
    
    /**
     * 高亮指定行
     */
    highlightLine(lineNumber, duration = 2000) {
        if (!this.goToLine(lineNumber)) return;
        
        // 添加高亮效果
        this.textarea.style.transition = 'background-color 0.3s ease';
        this.textarea.style.backgroundColor = 'rgba(224, 108, 117, 0.1)';
        
        setTimeout(() => {
            this.textarea.style.backgroundColor = 'transparent';
            // 清除transition避免影响其他样式变化
            setTimeout(() => {
                this.textarea.style.transition = '';
            }, 300);
        }, duration);
    }
    
    /**
     * 清除高亮
     */
    clearHighlight() {
        this.textarea.style.backgroundColor = 'transparent';
        this.textarea.style.transition = '';
    }
    
    /**
     * 销毁实例
     */
    destroy() {
        // 取消动画帧
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // 清理引用
        this.textarea = null;
        this.lineNumbers = null;
        this.cachedStyles = null;
        
        console.log('✅ 实时行号功能已销毁');
    }
}