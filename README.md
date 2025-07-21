# HookRegForge

HookRegForge 是面向混淆 JavaScript 代码的 Hook 路径正则生成工具。

它通过 AST 解析和访问，自动生成在多轮混淆之后仍能匹配的弹性 RegExp。

## 依赖

- Node.js (>=16)
- @babel/parser
- @babel/traverse

先使用 npm 或 yarn 安装依赖：

```bash
npm install @babel/parser @babel/traverse
```

## 使用

```bash
node gen-flex-regex.js <源代码文件> "<Hook字符串>" [保留尾段数]
```

- `源代码文件`：已压缩/混淆的 JavaScript 文件，如 `game.js`;
- `Hook字符串`：需进行 Hook 的调用链，如 `a.b.c()`;
- `保留尾段数`：保留多少个尾段不被缩短，默认 2。

运行后，将输出以下信息：

- `弹性匹配版` RegExp
- 如果 AST 能准确找到实际调用链，还会输出 `智能匹配版` RegExp 以及实例链示例。

## 示例

```bash
node gen-flex-regex.js ./game.js "a.b.c()" 2
```

将获得如下类似输出：

```
弹性匹配版: [A-Za-z$_0-9]{1,3}(?:\.[A-Za-z$_0-9]{1,6})*?\.b\.c\(\)
智能匹配版: [A-Za-z$_0-9]{1,3}\.a\.b\.c\(\)
示例链:  x.a.b.c
```

## 浏览器版本

1. 安装依赖并构建:

```bash
npm install
npm run build:web
```

2. 构建完成后，打开 `web/index.html` 即可在手机浏览器中使用。上传混淆后的源码文件，输入 Hook 字符串和保留尾段数，点击“生成”即可得到正则。
