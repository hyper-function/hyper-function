---
title: Introduction
---

# Hyper Function Component

Hyper Function Component (HFC) 定义了 UI 组件的接口规范，灵感来自于 [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)。

实现了 HFC 接口标准的组件，可以被 React， Vue， Angular， Svelte 等前端开发框架使用，同时 HFC 也可由 React， Vue， VanillaJS 等编写。

### Features

#### 互通性

前端领域有非常多优秀的开发框架，大部分流行的框架都是基于组件化的理念，但是他们之间并不互通，比如使用 React 开发的组件，就很难在 Vue 项目中使用。最近出现的重编译型框架 [Svelte](https://svelte.dev/) 和 [SolidJS](https://www.solidjs.com/)，他们的产物非常小，而且性能很高，非常适合于开发组件，使用 HFC 可以轻易的将他们嵌入到现有项目。

#### 专注于组件的开发与分享

#### 便捷的开发和使用

我们提供了一系列工具，帮助你使用 React, Vue, Svelte, VanillaJS 等库开发 HFC 组件。还有一些适配器，让你能够在 React, Vue, Angular 等工程中使用 HFC。

### Type Definitions

```ts
declare class HyperFunctionComponent {
  static propTypes?: HfcPropTypes;
  constructor(props: HfcProps);

  connected(container: HTMLDivElement): void;
  changed?(
    type: "attr" | "event" | "slot",
    name: string,
    oldValue: any,
    newValue: any
  ): void;
  disconnected?(): void;
}

interface HfcProps {
  attrs: { [k: string]: any };
  events: { [k: string]: (args?: { [k: string]: any }) => any };
  slots: {
    [k: string]: (container: HTMLElement, args?: { [k: string]: any }) => void;
  };
}

interface HfcPropTypes {
  attrs?: { [k: string]: HfcPropTypeDef };
  events?: { [k: string]: { [k: string]: HfcPropTypeDef } };
  slots?: { [k: string]: { [k: string]: HfcPropTypeDef } };
}

type HfcPropTypeDef = any;
```
