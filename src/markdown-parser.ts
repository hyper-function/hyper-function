import fs from "fs/promises";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import gfm from "remark-gfm";
import emoji from "remark-emoji";
import raw from "rehype-raw";
import { visit } from "unist-util-visit";
import sanitize, { defaultSchema } from "rehype-sanitize";
import deepmerge from "deepmerge";
import path from "path";
import crypto from "crypto";
import { Stats } from "fs";
import kvCache from "./kv-cache.js";

const sanitizeSchema: any = deepmerge(defaultSchema, {
  attributes: {
    div: ["dataHfz", "dataHfzId"],
    img: ["dataSrc"],
    code: ["className"],
  },
});

const supportImgExts = [".jpg", ".jpeg", ".png", ".gif", ".svg"];

const imgCache: Record<
  string,
  {
    stat: Stats;
    distImgName: string;
  }
> = {};

export default async (
  content: string,
  options: {
    basePath: string;
    outputPath: string;
    hash: "filename" | "content";
  }
) => {
  options.hash = options.hash || "content";
  const imgDir = path.resolve(options?.outputPath!, "imgs");

  try {
    await fs.stat(imgDir);
  } catch (error) {
    await fs.mkdir(imgDir);
  }

  return unified()
    .use(remarkParse)
    .use(gfm)
    .use(emoji)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(() => {
      let hfzId = 0;
      return async (tree) => {
        visit(tree, (node: any) => {
          if (node.tagName === "pre") {
            const codeElement = node.children[0];
            const { className } = codeElement.properties;
            if (
              ["language-hfz", "language-html", "language-vue"].includes(
                className[0]
              ) &&
              codeElement.data?.meta.includes("render")
            ) {
              const code = codeElement.children[0].value;

              node.tagName = "div";
              node.properties.dataHfz = encodeURIComponent(code);
              const id = hfzId++;
              node.properties.dataHfzId = id;

              kvCache.set("HFZ_TEMPLATE_" + id, code);
              node.children = [];
            }
          }
        });
      };
    })
    .use(raw)
    .use(() => {
      return async (tree) => {
        const imgs: any[] = [];
        visit(tree, (node: any) => {
          if (node.tagName === "img") {
            imgs.push(node);
          }
        });

        await Promise.all(
          imgs.map(async (node) => {
            const src: string = node.properties.src;

            const cached = imgCache[src];
            if (cached) {
              delete node.properties.src;
              node.properties.dataSrc = cached.distImgName;
              return;
            }

            if (src.startsWith("http")) {
              node.properties.src = "";
              node.properties.alt = "Not Support Remote Image";
              return;
            }

            const imgPath = path.resolve(options?.basePath!, src);
            let imgStat: Stats;

            try {
              imgStat = await fs.stat(imgPath);
            } catch (error) {
              delete imgCache[src];
              node.properties.src = "";
              node.properties.alt = "Image File Not Found";
              return;
            }

            const imgExt = path.extname(src);
            if (!supportImgExts.includes(imgExt)) {
              node.properties.src = "";
              node.properties.alt = `Not Support Image Type: ${imgExt}; support: ${supportImgExts.join(
                ", "
              )}`;
              return;
            }

            if (imgStat.size > 1024 * 1024 * 2) {
              node.properties.src = "";
              node.properties.alt = "Image File Too Large, max 2M";
              return;
            }

            const imgBuf = await fs.readFile(imgPath);

            const imgId = crypto
              .createHash("md5")
              .update(imgBuf)
              .digest("base64url");

            const distImgName = imgId + imgExt;
            const distImgPath = path.join(imgDir, distImgName);
            await fs.writeFile(distImgPath, imgBuf);

            delete node.properties.src;
            node.properties.dataSrc = distImgName;

            imgCache[src] = {
              stat: imgStat,
              distImgName,
            };
          })
        );
      };
    })
    .use(sanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(content)
    .then(async (value) => {
      const content = value.toString();

      const filePath = path.join(options!.outputPath!, "index.html");
      await fs.writeFile(filePath, content);
    });
};
