import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import EventEmitter from "events";
import shiki, { Highlighter } from "shiki-hfcpack";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkToHast from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkStringify from "remark-stringify";
import { toString as hastToString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { createHash } from "crypto";
import QuickLRU from "quick-lru";

import cache from "./kv-cache.js";
import { ResolvedConfig } from "./config.js";
import { codeToHast } from "./code-to-hast.js";

const supportImgExts = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];

const imgCache: Record<
  string,
  {
    distImgSrc: string;
  }
> = {};
const highlightedCodeCache = new QuickLRU<string, any>({ maxSize: 200 });

export class DocBuilder extends EventEmitter {
  entry: string;
  imgOutputPath: string;
  codeHighlighter!: Highlighter;
  supportLangs!: string[];
  envs: { re: RegExp; value: string }[] = [];
  constructor(private config: ResolvedConfig) {
    super();
    this.entry = path.join(this.config.context, "hfc.md");
    this.imgOutputPath = path.resolve(this.config.docOutputPath, "imgs");
    fs.ensureDirSync(this.imgOutputPath);

    const docEnv: Record<string, any> = {};
    const env = { ...this.config.env, ...process.env };
    for (const key in env) {
      if (key.startsWith("HFC_DOC_")) {
        docEnv[key] = env[key];
      }
    }

    Object.keys(docEnv).forEach((key) => {
      this.envs.push({
        re: new RegExp(`\\$\{${key}\}`, "g"),
        value: docEnv[key],
      });
    });

    if (this.config.command === "serve") {
      chokidar.watch(this.entry).on("change", () => this.build());
    }
    this.build();
  }
  async build() {
    const content = await fs.readFile(this.entry, "utf-8");

    await this.parse(content);

    this.emit("build-complete");
  }

  async parse(content: string) {
    if (!this.codeHighlighter) {
      this.codeHighlighter = await shiki.getHighlighter({});
      this.supportLangs = this.codeHighlighter.getLoadedLanguages();
    }

    for (const env of this.envs) {
      content = content.replace(env.re, env.value);
    }

    content = content.replace(
      new RegExp(`import:${this.config.hfcName}="dev`, "g"),
      `import:${this.config.hfcName}="${this.config.version}`
    );

    const isBuild = this.config.command === "build";
    let result: string;
    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkEmoji)
        .use(processImgs as any, {
          context: this.config.context,
          imgOutputPath: this.imgOutputPath,
        });

      if (isBuild) {
        processor.use(remarkStringify);
      } else {
        processor
          .use(remarkToHast)
          .use(processCodeBlocks as any, {
            supportLangs: this.supportLangs,
            codeHighlighter: this.codeHighlighter,
          })
          .use(rehypeStringify);
      }

      result = await processor.process(content).then((val) => val.toString());
    } catch (error) {
      console.error("fail to parse hfc.md");
      return;
    }

    const outputFile = isBuild ? "index.md" : "index.html";
    await fs.writeFile(
      path.resolve(this.config.docOutputPath, outputFile),
      result
    );
  }
}

function processImgs({
  context,
  imgOutputPath,
}: {
  context: string;
  imgOutputPath: string;
}) {
  // @ts-ignore
  return async (tree) => {
    const imgNodes: any[] = [];
    visit(tree, "image", (node: any) => {
      imgNodes.push(node);
    });

    await Promise.all(
      imgNodes.map(async (imgNode) => {
        const src: string = imgNode.url;

        const cached = imgCache[src];
        if (cached) {
          imgNode.url = cached.distImgSrc;
          return;
        }

        if (src[0] !== ".") {
          imgNode.url = "";
          imgNode.alt = "Current only support local image";
          return;
        }

        const imgPath = path.resolve(context, src);

        const exists = await fs.pathExists(imgPath);
        if (!exists) {
          imgNode.url = "";
          imgNode.alt = "Image not found";
          return;
        }

        const ext = path.extname(src);
        if (!supportImgExts.includes(ext)) {
          imgNode.url = "";
          imgNode.alt = "Unsupported ext: " + ext;
          return;
        }

        const buf = await fs.readFile(imgPath);
        if (buf.byteLength > 1024 * 1024) {
          imgNode.url = "";
          imgNode.alt = "Image file too large, max 1024k";
          return;
        }

        const imgId = createHash("sha256")
          .update(buf)
          .digest("base64url")
          .slice(0, 8);

        const distImgName = imgId + ext;
        await fs.writeFile(path.resolve(imgOutputPath, distImgName), buf);

        const distImgSrc = "/doc/imgs/" + distImgName;
        imgNode.url = distImgSrc;

        imgCache[src] = {
          distImgSrc,
        };
      })
    );
  };
}

function processCodeBlocks({
  supportLangs,
  codeHighlighter,
}: {
  supportLangs: string[];
  codeHighlighter: Highlighter;
}) {
  // @ts-ignore
  return (tree) => {
    let hfzId = 1;
    visit(tree, "element", (node: any, _index, parent) => {
      if (!parent || parent.tagName !== "pre" || node.tagName !== "code") {
        return;
      }

      const code = hastToString(node);

      let lang: string | undefined;
      const className = node.properties.className || [];

      for (const classListItem of className) {
        if (classListItem.startsWith("language-")) {
          lang = classListItem.slice(9).toLowerCase();
        }
      }

      if (lang && !supportLangs.includes(lang)) lang = undefined;

      const meta: string[] =
        node.data != null ? (node.data.meta || "").split(" ") : [];

      const shouldRender = meta.includes("render");
      if (shouldRender) lang = "html";

      const cached = highlightedCodeCache.get(code);
      if (cached) {
        parent.properties = cached.properties;
        parent.children = cached.children;
      } else {
        const codeNode = codeToHast(
          codeHighlighter,
          code,
          lang === "html" ? "vue-html" : lang,
          { langId: lang }
        );

        parent.properties = codeNode.properties;
        parent.children = codeNode.children;
      }

      if (shouldRender) {
        const id = hfzId++;
        cache.set("HFZ_TEMPLATE_" + id, code);

        parent.properties!.dataHfzId = id;
        parent.properties!.dataHfz = encodeURIComponent(code);
      }

      if (!cached) {
        highlightedCodeCache.set(code, {
          properties: parent.properties,
          children: parent.children,
        });
      }
    });
  };
}
