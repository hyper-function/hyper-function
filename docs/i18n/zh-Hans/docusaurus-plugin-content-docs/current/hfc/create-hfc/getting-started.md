# Getting Started

开发 HFC 十分简单，我们提供了 `StackBlitz Boilerplate` 和 `create-hfc` 来帮助你快速生成 HFC 项目。

:::note

本教程假设你了解 React 或 Vue 的组件开发。

:::

### stackblitz

Stackblitz 使用 [WebContainer](https://blog.stackblitz.com/posts/introducing-webcontainers/) 来直接在你的浏览器中运行 HFC 开发工具，十分便捷，我们推荐使用 Stackblitz 来开发 HFC。

- [VanillaJS](https://stackblitz.com/fork/github/hyper-function/create-hfc/tree/main/templates/vanilla?file=hfc.md&title=HFC%20-%20VanillaJS)

- [VanillaJS - TypeScript](https://stackblitz.com/fork/github/hyper-function/create-hfc/tree/main/templates/vanilla?file=hfc.md&title=HFC%20-%20VanillaJS)

- [React](https://stackblitz.com/fork/github/hyper-function/create-hfc/tree/main/templates/react?file=hfc.md&title=HFC%20-%20React)

- [React - TypeScript](https://stackblitz.com/fork/github/hyper-function/create-hfc/tree/main/templates/react-ts?file=hfc.md&title=HFC%20-%20React)

- [Svelte](https://stackblitz.com/fork/github/hyper-function/create-hfc/tree/main/templates/svelte?file=hfc.md&title=HFC%20-%20Svelte)

### create-hfc

`create-hfc` 是一个命令行工具，运行 `npx create-hfc` 来根据引导创建 HFC 项目。

:::note

Nodejs Version >= 14

:::

## 项目结构

```
awesome-hfc
├── src/
├── hfc.md
├── hfc.js
├── hfc.d.ts
├── package.json
```

### 项目结构简介

- `/src/` - 包含组件的源文件
- `hfc.md` - 组件的文档，应该包含组件的介绍，用例，接口描述等等信息
- `hfc.js` - 组件的配置文件，控制开发工具的行为
- `hfc.d.ts` - 组件的接口声明文件，使用 TypeScript 来定义
- `package.json` - 组件的 npm 依赖，你可以使用任何 npm 包

## 发布

运行 `npm run publish-hfc` 即可将组件发布到 [hyper.fun](https://hyper.fun)
