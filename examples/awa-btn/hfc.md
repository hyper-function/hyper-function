The official Tailwind CSS Typography plugin provides a set of prose classes you can use to add beautiful typographic defaults to any vanilla HTML you don’t control, like HTML rendered from Markdown, or pulled from a CMS.

To see what it looks like in action, check out our [live demo](https://play.tailwindcss.com/uj1vGACRJA?layout=preview) on Tailwind Play.

<span style="color: red;">hello
sasef
asefs </span>

<pre style="color: red;">hello

sasef </pre>

<code style="color: red;">hello </code>

<p class="p-3">heheh</p>

```html render
<template
  :data="{
    a: 1,
    b: 2,
    c: 'abcdee',
    d: 'efwaae',
    e: 'asefse',
    f: 'urgwefoi',
    g: 'efhbasdfsdf',
  }"
  hfz
  import:awa-btn="dev"
  import:flex-box="1.3.2"
>
  {{ a }} - {{ b }} - {{ c }} - 13
  <span v-if="a === 2">baba</span>
  <!-- <flex-box justify="center">
    <awa-btn name="awa" :c="c" @click="hello">{{ a }} 1</awa-btn> aaaavvvvvvvzzzzzzzzeeeeeeeee
  </flex-box> -->
  <awa-btn name="awa" :c="c" @click="hello">{{ a }} 1</awa-btn>
  <div #default></div>

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
<template :a="{ a: 1, b: 2, c: '2232' }" v-if="a == 2">
  hello world !!!!
</template>
```

# Right Image

<img src="./src/jser-logo.png" width="182" align="right" />

![logo](./src/jser-logo.png)
![](./banner.png)

## Autolink literals

www.example.com, https://example.com, and contact@example.com.

## Footnote

A note[^1]

[^1]: Big note.

## Strikethrough

~one~ or ~~two~~ tildes.

## Table

| a   | b   |   c |  d  |
| --- | :-- | --: | :-: |
| 1   | 2   |   3 |  4  |
| 5   | 6   |   7 |  8  |

## Tasklist

- [ ] to do
- [x] done
