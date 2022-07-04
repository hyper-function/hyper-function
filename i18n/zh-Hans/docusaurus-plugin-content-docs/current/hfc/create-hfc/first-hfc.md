# Your First HFC

让我们来开发一个 HFC 组件，深入了解 HFC 的开发流程。

我们将会实现一个 [material ui button](https://material.io/components/buttons)，基于 VanillaJS 这个项目模板，使用 Stackblitz 进行开发。

:::tip
VanillaJS 就是原生 JS，没有任何外部依赖。

最好使用最新版 chromium 内核浏览器运行此教程。
:::

## 新建项目

首先我们克隆 VanillaJS 项目模板

<iframe width="100%" height="500px" src="https://stackblitz.com/fork/github/hyper-function/create-hfc/tree/main/templates/vanilla?embed=1&file=src/index.js,hfc.md&hideNavigation=1&ctl=1&title=Create%20Project"></iframe>

点击上方 `RUN PROJECT` 按钮，会将模板克隆到本地浏览器，等待加载，稍后在 `Terminal` 中，会提示我们输入组件名字。

HFC 的名字借鉴了 [Web Components 的命名规范](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name)，其中有一个要求是必要包含 - 字符。

这里我们输入 `mui-button` 然后按回车键确认。

在编辑器右侧，我们可以预览组件文档，这是 HFC 开发过程中最重要的一部分，我们需要面向文档来开发组件，详细介绍组件的各种使用场景。

编辑器左侧，则是 Markdown 文件的内容，你可以尝试编辑内容，右侧预览会即时更新。

你会在 Markdown 文件中，看到这个片段

````html
```html render
<template hfz import:mui-button="dev">
  <mui-button></mui-button>
</template>
```
````

我们使用这种方式，在文档中渲染我们的组件，这是 [HFZ](/hfz/intro) 框架提供的能力，我们暂时不深入讲解。

## 显示按钮

我们在编辑器上方可以看到 `index.js` 文件，这个文件位于 `src/index.js` 是我们组件的源代码，里面实现了 HFC 的接口。

```js
export default class {
  constructor(props) {}
  connected(container) {}
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
```

可以看到，接口定义非常类似 [CustomElement](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)。

- constructor: 获得 props 对象，里面包含了 attrs, events, slots 属性。
- connected: 获得 container 对象，这个对象默认是 div 实例。
- changed: 当 props 里面的值变化时，会传进来最新的值。
- disconnected: 当组件被销毁时调用。

我们修改项目中的 `src/index.js` 文件，渲染一个 `button` 按钮。

```js
import "./index.css";

export default class AwesomeHfc {
  constructor(props) {}
  connected(container) {
    // highlight-next-line
    const button = document.createElement("button");
    // highlight-next-line
    button.innerText = "BUTTON";
    // highlight-next-line
    container.appendChild(button);
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
```

<iframe width="100%" height="500px" src="https://stackblitz.com/edit/hyper-function-create-hfc-9yjydu?embed=1&file=hfc.md,src/index.css,src/index.js&hideNavigation=1&ctl=1"></iframe>

点击 `RUN PROJECT` 查看。

## 获取参数

我们可以通过外部参数(props)来控制组件，props 分为三类

- attr: 由基础数据类型(String, Int, Float, Boolean, Any)组成的对象或数组。
- event: 接收一个回调函数，在特定时机由组件调用。
- slot: 对外提供一个插槽(DOM 实例)，可由调用者渲染。

:::caution

接收参数前，必须在 `hfc.d.ts` 文件中定义数据类型。

:::

### Attrs

假设我们接收一个 text 的 attr，类型为 String，用来控制按钮内的文字。

修改 `hfc.d.ts` 文件：

```ts
interface HfcPropType {
  attrs: {
    // highlight-next-line
    text: HfcString;
  };
  events: {};
  slots: {};
}
```

这样，我们就可以在 constructor 的 props 参数中，获取这个变量

我们接着修改 `hfc.md` 传递一个 `text` 参数进去

````html
```html render
<template hfz import:mui-button="dev">
  // highlight-next-line
  <mui-button text="OK"></mui-button>
</template>
```
````

最后，我们修改 `src/index.js` 来显示我们传递进去的 text

```js
import "./index.css";

export default class AwesomeHfc {
  constructor(props) {
    this.attrs = props.attrs || {};
  }
  connected(container) {
    const button = document.createElement("button");
    // highlight-next-line
    button.innerText = this.attrs.text || "BUTTON";
    container.appendChild(button);
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
```

<iframe width="100%" height="500px" src="https://stackblitz.com/edit/hyper-function-create-hfc-bw8zmb?embed=1&file=hfc.md,hfc.d.ts,src/index.js&hideNavigation=1&ctl=1"></iframe>

点击 `RUN PROJECT` 查看。

### Events

假设我们提供一个 click 的 event， 每当用户点击按钮时，我们就触发这个事件。

修改 `hfc.d.ts` 文件：

```ts
interface HfcPropType {
  attrs: {
    text: HfcString;
  };
  events: {
    // highlight-next-line
    click: {};
  };
  slots: {};
}
```

接着修改 `hfc.md` 传递一个 `click` 回调函数进去

````html
```html render
<template hfz import:mui-button="dev" :data="{tips: 'please click button'}">
  <mui-button text="OK" @click="tips = 'Clicked!'"></mui-button>
  {{tips}}
</template>
```
````

最后修改 `src/index.js` 处理 `click` 事件

```js
import "./index.css";

export default class AwesomeHfc {
  constructor(props) {
    this.attrs = props.attrs || {};
    this.events = props.events || {};
  }
  connected(container) {
    const button = document.createElement("button");
    button.innerText = this.attrs.text || "BUTTON";
    button.onclick = () => {
      // highlight-next-line
      if (this.events.click) this.events.click();
    };

    container.appendChild(button);
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
```

<iframe width="100%" height="500px" src="https://stackblitz.com/edit/hyper-function-create-hfc-bcvr4w?embed=1&file=hfc.md,hfc.d.ts,src/index.js&hideNavigation=1&ctl=1"></iframe>

点击 `RUN PROJECT` 查看。

### Slots

通常，我们组件内的某一部分，需要由外部来控制 DOM 结构和样式，此时我们可以对外提供一个插槽，来满足这个需求。

假设我们有一个 `icon` 的插槽，显示在 `text` 的左侧。

修改 `hfc.d.ts` 文件：

```ts
interface HfcPropType {
  attrs: {
    text: HfcString;
  };
  events: {
    click: {};
  };
  slots: {
    // highlight-next-line
    icon: {};
  };
}
```

接着修改 `hfc.md` 传递一个 `icon` 插槽进去，我们使用了 `<template #icon><svg>...</svg></template>` 这种写法，将 `svg` 插入到了 `mui-button` 中的 icon 插槽中。

````html
```html render
<template hfz import:mui-button="dev">
  <mui-button text="LIKE">
    <template #icon>
      <svg
        width="16px"
        viewBox="0 0 342 342"
        fill="#FFF"
        transform="rotate(225,0 0)"
      >
        <path
          d="M0 200 v-200 h200 a100,100 90 0,1 0,200 a100,100 90 0,1 -200,0 z"
        />
      </svg>
    </template>
  </mui-button>
</template>
```
````

最后修改 `src/index.js` 渲染 `icon` 插槽

```js
import "./index.css";

export default class AwesomeHfc {
  constructor(props) {
    this.attrs = props.attrs || {};
    this.events = props.events || {};
    this.slots = props.slots || {};
  }
  connected(container) {
    const button = document.createElement("button");

    if (this.slots.icon) {
      const iconSlot = document.createElement("span");
      iconSlot.style.marginRight = "6px";
      // highlight-next-line
      this.slots.icon(iconSlot);

      button.appendChild(iconSlot);
    }

    const textSlot = document.createElement("span");
    textSlot.innerText = this.attrs.text || "BUTTON";

    button.appendChild(textSlot);

    button.onclick = () => {
      if (this.events.click) this.events.click();
    };

    container.appendChild(button);
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
```

<iframe width="100%" height="500px" src="https://stackblitz.com/edit/hyper-function-create-hfc-bxu9ji?embed=1&file=hfc.md,hfc.d.ts,src/index.js&hideNavigation=1&ctl=1"></iframe>

点击 `RUN PROJECT` 查看。

### Default Slot

我们有一个特殊的插槽叫做 `default`，当组件中有叫这个名字的插槽时，在写文档中的模板时可以忽略 `template` 标签。

假如 `mui-button` 组件接收一个 `default` 的插槽，来展示内部内容。

首先修改 `hfc.d.ts` 文件：

```ts
interface HfcPropType {
  attrs: {
    text: HfcString;
  };
  events: {
    click: {};
  };
  slots: {
    icon: {};
    // highlight-next-line
    default: {};
  };
}
```

接着修改 `hfc.md` 传递一个 `default` 插槽进去，注意这里没有使用 `template` 标签。

````html
```html render
<template hfz import:mui-button="dev">
  <mui-button text="LIKE">
    // highlight-next-line
    <em>I AM BUTTON</em>
  </mui-button>
</template>
```
````

最后修改 `src/index.js` 渲染 `default` 插槽

```js
import "./index.css";

export default class AwesomeHfc {
  constructor(props) {
    this.attrs = props.attrs || {};
    this.events = props.events || {};
    this.slots = props.slots || {};
  }
  connected(container) {
    const button = document.createElement("button");

    if (this.slots.icon) {
      const iconSlot = document.createElement("span");
      iconSlot.style.marginRight = "6px";
      this.slots.icon(iconSlot);

      button.appendChild(iconSlot);
    }

    const textSlot = document.createElement("span");
    // highlight-next-line
    if (this.slots.default) {
      // highlight-next-line
      this.slots.default(textSlot);
    } else {
      textSlot.innerText = this.attrs.text || "BUTTON";
    }

    button.appendChild(textSlot);

    button.onclick = () => {
      if (this.events.click) this.events.click();
    };

    container.appendChild(button);
  }
  changed(type, oldValue, newValue) {}
  disconnected() {}
}
```

<iframe width="100%" height="500px" src="https://stackblitz.com/edit/hyper-function-create-hfc-egsgcm?embed=1&file=hfc.md,hfc.d.ts,src/index.js&hideNavigation=1&ctl=1"></iframe>

点击 `RUN PROJECT` 查看。

## 总结

区别于传统的组件开发，HFC 更注重使用文档来表达组件，同时，对于组件接收的参数，也需要在 `hfc.d.ts` 文件中定义好。HFC 的生命周期跟其他开发框架也大致相同，相信你轻松就能掌握 HFC 的开发！
