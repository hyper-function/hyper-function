# :package: awa-btn

```html render
<template hfz import:awa-btn="dev" import:flex-box="1.3.2">
  {{a}} - {{b}} - {{c}} - 1
  <span v-if="a === 2">baba</span>
  <flex-box justify="center">
    <awa-btn name="awa" :c="c" @click="hello"> {{a}} 1 </awa-btn>
  </flex-box>

  <script>
    export default {
      data() {
        return { a: 1, b: 2, c: "cc" };
      },
      created() {
        setInterval(() => {
          this.a += 1;
        }, 1000);
      },
      methods: {
        hello() {
          this.a += 1;
          console.log("hello");
        },
      },
    };
  </script>
</template>
```

```html
<template>hello world !</template>
```

# Right Image

<img src="./src/jser-logo.png" width="182" align="right" />

![logo](./src/jser-logo.png)
