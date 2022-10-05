import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import EventEmitter from "events";
import { h } from "hastscript";
import shiki, {
  FontStyle,
  Highlighter,
  IThemedToken,
  Lang,
} from "shiki-hfcpack";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkToHast from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkStringify from "remark-stringify";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { createHash } from "crypto";
import QuickLRU from "quick-lru";

import cache from "./kv-cache.js";
import { ResolvedConfig } from "./config.js";

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
          .slice(0, 13);

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

      const code = toString(node);

      let lang = getLanguage(node);
      if (!supportLangs.includes(lang)) lang = null;

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

function getLanguage(node: any) {
  const dataLanguage = node.properties.dataLanguage;

  if (dataLanguage != null) {
    return dataLanguage;
  }

  const className = node.properties.className || [];

  for (const classListItem of className) {
    if (classListItem.slice(0, 9) === "language-") {
      return classListItem.slice(9).toLowerCase();
    }
  }

  return null;
}

// https://github.com/sachinraja/shiki-renderer-hast/blob/main/src/index.ts

type StringLiteralUnion<T extends U, U = string> = T | (U & {});

type LineOption = { line: number; classes?: string[] };

type HastRendererOptions = {
  langId?: string;
  lineOptions?: LineOption[];
};

const renderToHast = (
  lines: IThemedToken[][],
  options: HastRendererOptions = {}
) => {
  const optionsByLineNumber = groupBy(
    options.lineOptions ?? [],
    (option) => option.line
  );

  const root = h("pre", {
    class: "shiki",
  });

  const codeElement = h("code", { dataLang: options.langId });
  root.children.push(codeElement);

  for (const [lineIndex, line] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    const lineOptions = optionsByLineNumber.get(lineNumber) ?? [];
    const lineClasses = getLineClasses(lineOptions);
    const lineSpan = h("span", { className: lineClasses });

    codeElement.children.push(lineSpan);

    for (const token of line) {
      const cssDeclarations: Record<string, string> = {};
      let cls = "";

      let color = token.color;
      if (color) {
        if (color === "#000001") cls += "sk-1";
        else if (color === "#000002") cls += "sk-2";
        else if (color === "#000003") cls += "sk-3";
        else if (color === "#000004") cls += "sk-4";
        else if (color === "#000005") cls += "sk-5";
        else if (color === "#000006") cls += "sk-6";
        else if (color === "#000007") cls += "sk-7";
        else if (color === "#000008") cls += "sk-8";
        else if (color === "#000009") cls += "sk-9";
        else if (color === "#000010") cls += "sk-10";
        else if (color === "#000011") cls += "sk-11";
        else if (color === "#000012") cls += "sk-12";
        else if (color === "#000013") cls += "sk-13";
        else if (color === "#000014") cls += "sk-14";
      }

      if (token.fontStyle) {
        if (FontStyle.Italic) {
          cls += "sk-i";
        } else if (FontStyle.Bold) {
          cls += "sk-b";
        } else if (FontStyle.Underline) {
          cls += "sk-u";
        }
      }

      lineSpan.children.push(
        h("p", { className: cls.length ? cls : undefined }, token.content)
      );
    }

    codeElement.children.push({ type: "text", value: "\n" });
  }

  codeElement.children.pop();

  return root;
};

/* eslint max-params: ["error", 5] */
const codeToHast = (
  highlighter: Highlighter,
  code: string,
  lang: StringLiteralUnion<Lang> | undefined = "text",
  options?: HastRendererOptions
) => {
  const tokens = highlighter.codeToThemedTokens(code, lang, "hfcpack", {
    includeExplanation: false,
  });

  return renderToHast(tokens, options);
};

function groupBy<T, K>(
  elements: T[],
  keyGetter: (element: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();

  for (const element of elements) {
    const key = keyGetter(element);
    if (map.has(key)) {
      const group = map.get(key)!;
      group.push(element);
    } else {
      map.set(key, [element]);
    }
  }

  return map;
}

function getLineClasses(lineOptions: LineOption[]): string[] {
  const lineClasses = new Set(["line"]);

  for (const lineOption of lineOptions) {
    for (const lineClass of lineOption.classes ?? []) {
      lineClasses.add(lineClass);
    }
  }

  return Array.from(lineClasses);
}
