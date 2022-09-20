import type { Element } from "hast";
import fs from "fs-extra";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import gfm from "remark-gfm";
import emoji from "remark-emoji";
import raw from "rehype-raw";
import { visit } from "unist-util-visit";
import sanitize, { defaultSchema } from "rehype-sanitize";
import path from "path";
import { Stats } from "fs";
import { createHash } from "crypto";

import cache from "./kv-cache.js";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...defaultSchema.attributes!.div, "dataHfz", "dataHfzId"],
    img: [...defaultSchema.attributes!.img, "dataSrc"],
    code: ["className"],
  },
};

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
  const imgDir = path.resolve(options.outputPath!, "imgs");

  try {
    await fs.stat(imgDir);
  } catch (error) {
    await fs.mkdirp(imgDir);
  }

  return unified()
    .use(remarkParse)
    .use(gfm)
    .use(emoji)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(() => {
      let hfzId = 1;
      return (tree: any) => {
        visit(tree, (node) => {
          if (node.tagName === "pre") {
            const codeElement = node.children[0];
            if (!codeElement || codeElement.type !== "element") return;

            const classNames = codeElement.properties?.className as string[];
            const meta = codeElement.data?.meta as string;

            if (classNames && meta) {
              const className = classNames[0];
              if (
                ["language-hfz", "language-html", "language-vue"].includes(
                  className
                ) &&
                meta.includes("render")
              ) {
                const code = (codeElement as any).children[0].value;

                node.tagName = "div";
                node.properties!.dataHfz = encodeURIComponent(code);
                const id = hfzId++;
                node.properties!.dataHfzId = id;

                cache.set("HFZ_TEMPLATE_" + id, code);
                node.children = [];
              }
            }
          }
        });
      };
    })
    .use(raw as any)
    .use(() => {
      return async (tree: any) => {
        const imgs: Element[] = [];
        visit(tree, (node) => {
          if (node.tagName === "img") {
            imgs.push(node);
          }
        });

        await Promise.all(
          imgs.map(async (node) => {
            const src = node.properties!.src as string;

            const cached = imgCache[src];
            if (cached) {
              delete node.properties!.src;
              node.properties!.dataSrc = cached.distImgName;
              return;
            }

            if (src.startsWith("http")) {
              node.properties!.src = "";
              node.properties!.alt = "Not Support Remote Image";
              return;
            }

            const imgPath = path.resolve(options.basePath, src);
            let imgStat: Stats;

            try {
              imgStat = await fs.stat(imgPath);
            } catch (error) {
              delete imgCache[src];
              node.properties!.src = "";
              node.properties!.alt = "Image File Not Found";
              return;
            }

            const imgExt = path.extname(src);
            if (!supportImgExts.includes(imgExt)) {
              node.properties!.src = "";
              node.properties!.alt = `Not Support Image Type: ${imgExt}; support: ${supportImgExts.join(
                ", "
              )}`;
              return;
            }

            if (imgStat.size > 1024 * 1024 * 2) {
              node.properties!.src = "";
              node.properties!.alt = "Image File Too Large, max 2M";
              return;
            }

            const imgBuf = await fs.readFile(imgPath);

            const imgId = createHash("sha256")
              .update(imgBuf)
              .digest("base64url")
              .slice(0, 13);

            const distImgName = imgId + imgExt;
            const distImgPath = path.join(imgDir, distImgName);
            await fs.writeFile(distImgPath, imgBuf);

            delete node.properties!.src;
            node.properties!.dataSrc = distImgName;

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
