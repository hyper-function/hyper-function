import fs from "fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import gfm from "remark-gfm";
import raw from "rehype-raw";
import { visit } from "unist-util-visit";
import sanitize, { defaultSchema } from "rehype-sanitize";
import deepmerge from "deepmerge";
import path from "path";
import crypto from "crypto";
import b64url from "base64url";

const sanitizeSchema: any = deepmerge(defaultSchema, {
  attributes: {
    div: ["dataHfz"],
    img: ["dataSrc"],
    code: ["className"],
  },
});

const supportImgExts = [".jpg", ".jpeg", ".png", ".svg", ".webp", ".gif"];

export default (
  content: string,
  options: {
    basePath: string;
    outputPath: string;
    hash: "filename" | "content";
  }
) => {
  options.hash = options.hash || "content";
  return unified()
    .use(remarkParse)
    .use(gfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(() => {
      return async (tree) => {
        const codeNodes: any[] = [];
        const imgNodes: any[] = [];
        visit(tree, (node: any) => {
          if (node.tagName === "pre") {
            codeNodes.push(node);
          } else if (node.tagName === "img") {
            imgNodes.push(node);
          }
        });

        codeNodes.forEach((node) => {
          const codeElement = node.children[0];
          const { className } = codeElement.properties;
          if (
            ["language-html", "language-hfz"].includes(className[0]) &&
            codeElement.data?.meta.includes("render")
          ) {
            const code = codeElement.children[0].value;

            node.tagName = "div";
            node.properties.dataHfz = encodeURIComponent(code);
            node.children = [];
          }
        });

        await Promise.all(
          imgNodes.map(async (node) => {
            const src: string = node.properties.src;

            const imgDir = path.resolve(options?.outputPath!, "imgs");

            if (src.startsWith("http")) {
              node.properties.src = "";
              node.properties.alt = "Unsupport Remote Image";
              return;
            }

            const imgPath = path.resolve(options?.basePath!, src);
            if (!fs.existsSync(imgPath)) {
              node.properties.src = "";
              node.properties.alt = "Image File Not Found";
              return;
            }

            const imgExt = path.extname(src);
            if (!supportImgExts.includes(imgExt)) {
              node.properties.src = "";
              node.properties.alt = `Unsupport Image Type: ${imgExt}; support: ${supportImgExts.join(
                ", "
              )}`;
              return;
            }

            const imgStat = fs.statSync(imgPath);
            if (imgStat.size > 1024 * 1024 * 2) {
              node.properties.src = "";
              node.properties.alt = "Image File Too Large, limit 2M";
              return;
            }

            let imgBuf;
            let hashContent;
            if (options.hash === "content") {
              imgBuf = fs.readFileSync(imgPath);
              hashContent = imgBuf;
            } else {
              hashContent = `${src}_${+imgStat.mtime}`;
            }

            const imgId = b64url.encode(
              crypto.createHash("sha1").update(hashContent).digest()
            );

            const imgName = imgId + imgExt;
            if (!fs.existsSync(path.join(imgDir, imgName))) {
              if (!imgBuf) imgBuf = fs.readFileSync(imgPath);

              fs.mkdirSync(imgDir, { recursive: true });
              fs.writeFileSync(path.join(imgDir, imgName), imgBuf);
            }

            delete node.properties.src;
            node.properties.dataSrc = imgName;
          })
        );
      };
    })
    .use(raw)
    .use(sanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(content)
    .then((value) => {
      const filePath = path.join(options!.outputPath!, "index.html");
      fs.writeFileSync(filePath, value.toString());
    });
};
