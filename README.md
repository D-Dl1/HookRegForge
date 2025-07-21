# HookRegForge

**面向混淆 JavaScript 的 Hook 路径正则生成器**

自动解析 AST，构造弹性正则，精准追踪函数链调用，助你攻坚逆向第一线。

## 🌟 功能特性

- **智能AST解析**: 基于 Esprima 引擎，准确解析复杂JavaScript代码结构
- **弹性正则生成**: 支持精确匹配和弹性匹配两种模式，适应不同场景
- **路径追踪优化**: 深度可配置的函数调用链路径发现
- **混淆代码支持**: 专门针对混淆后的JavaScript代码进行优化
- **实时语法检查**: 输入时实时验证JavaScript语法
- **可视化AST**: 友好的AST结构展示和完整展开功能
- **正则测试验证**: 内置正则表达式测试工具
- **现代化UI**: 深色主题，响应式设计，优秀的用户体验

## 🚀 快速开始

### 在线使用

访问 GitHub Pages 部署的版本：`https://d-dl1.github.io/HookRegForge`

### 本地运行

1. 克隆仓库：
```bash
git clone https://github.com/D-Dl1/HookRegForge.git
cd HookRegForge
```

2. 启动本地服务器：
```bash
# 使用 Python
python3 -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 PHP
php -S localhost:8000
```

3. 在浏览器中访问 `http://localhost:8000`

## 📖 使用指南

### 基本使用流程

1. **输入JavaScript代码**: 在左侧代码编辑器中粘贴或输入要分析的JavaScript代码
2. **配置参数**: 设置目标函数名、Hook类型、搜索深度等参数
3. **生成正则**: 点击"生成Hook正则"按钮开始分析
4. **查看结果**: 在不同标签页中查看AST结构、函数路径、生成的正则表达式
5. **测试验证**: 使用测试功能验证正则表达式的有效性

### 配置参数说明

- **目标函数名**: 要匹配的特定函数名称（可选，留空表示匹配所有）
- **Hook类型**: 
  - `函数调用`: 匹配函数调用
  - `属性访问`: 匹配属性访问
  - `方法调用`: 匹配对象方法调用
  - `全部路径`: 匹配所有类型
- **搜索深度**: AST遍历的最大深度（1-10）
- **弹性匹配**: 启用后允许标识符变化和多种访问方式

### 示例代码

```javascript
// 复杂的JavaScript对象结构
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
window['MyApp']['user']['profile']['getName']();
```

## 🛠️ 技术架构

### 前端技术栈

- **HTML5**: 语义化标记，无障碍访问支持
- **CSS3**: CSS变量，Grid布局，Flexbox，响应式设计
- **ES6+ JavaScript**: 模块化架构，现代JavaScript特性
- **Esprima**: JavaScript AST解析器
- **Prism.js**: 代码语法高亮
- **Font Awesome**: 图标库

### 模块架构

```
js/
├── core/           # 核心业务逻辑
│   ├── config.js   # 应用配置
│   ├── parser.js   # AST解析器
│   └── regex-generator.js # 正则生成器
├── ui/             # 用户界面
│   └── ui-manager.js # UI管理器
├── utils/          # 工具函数
│   └── helpers.js  # 通用工具
└── app.js          # 主应用入口
```

### 设计模式

- **模块化设计**: ES6模块系统，清晰的职责分离
- **观察者模式**: 事件驱动的用户交互
- **工厂模式**: 灵活的正则表达式生成
- **单例模式**: 全局应用状态管理

## 🎯 应用场景

### 逆向工程

- **函数Hook**: 为Frida、Charles等工具生成精确的Hook正则
- **API追踪**: 快速定位关键API调用路径
- **混淆分析**: 应对复杂的JavaScript混淆技术

### 安全研究

- **代码审计**: 快速定位可疑函数调用
- **漏洞挖掘**: 追踪敏感函数的调用链
- **恶意代码分析**: 分析恶意脚本的执行路径

### 开发调试

- **性能分析**: 定位性能瓶颈函数
- **依赖分析**: 理解代码依赖关系
- **重构支持**: 安全地重构复杂代码

## 🔧 高级特性

### 弹性匹配模式

弹性匹配模式特别适用于混淆代码：

```javascript
// 原代码
obj.method.call()

// 混淆后可能变成
obj["method"]["call"]()
obj[a][b]()
_0x1234.method.call()
```

启用弹性匹配后，生成的正则可以同时匹配这些变体。

### 正则优化

- **模式合并**: 自动合并相似的匹配模式
- **性能优化**: 避免回溯，提高匹配效率
- **可读性增强**: 生成易于理解的正则表达式

## 📊 浏览器兼容性

- **Chrome**: 60+
- **Firefox**: 60+
- **Safari**: 12+
- **Edge**: 79+

*注意: 需要支持ES6模块和现代JavaScript特性*

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发环境设置

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建Pull Request

### 代码规范

- 使用ES6+语法
- 遵循JavaScript Standard Style
- 添加适当的注释和文档
- 保持模块化和可测试性

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Esprima](https://esprima.org/) - JavaScript解析器
- [Prism.js](https://prismjs.com/) - 语法高亮
- [Font Awesome](https://fontawesome.com/) - 图标库

## 📞 联系方式

- GitHub Issues: [提交问题](https://github.com/D-Dl1/HookRegForge/issues)
- 项目主页: [HookRegForge](https://github.com/D-Dl1/HookRegForge)

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！
