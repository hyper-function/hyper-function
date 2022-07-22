# :package: awa-btn

```html render
<template hfz import:awa-btn="dev">
  {{a}} - {{b}} - {{c}}
  <span v-if="a === 2">baba</span>
  <awa-btn name="awa" :c="c" @click="hello"> {{a}} </awa-btn>

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
