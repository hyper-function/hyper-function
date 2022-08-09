import path from "path";
import fs from "fs-extra";
import { brotliCompressSync } from "zlib";

export default async function (outputPath: string) {
  const [contentJs, contentCss] = await Promise.all([
    await fs.readFile(path.join(outputPath, "esm", "hfc.js"), "utf-8"),
    await fs.readFile(path.join(outputPath, "hfc.css"), "utf-8"),
  ]);

  const [js, css] = await Promise.all([miniJs(contentJs), miniCss(contentCss)]);

  const sizeJs =
    js === "" ? 0 : brotliCompressSync(Buffer.from(js || "")).byteLength;
  const sizeCss =
    css === "" ? 0 : brotliCompressSync(Buffer.from(css)).byteLength;

  return { sizeJs, sizeCss };
}

export async function miniJs(content: string) {
  const { minify } = await import("terser");
  const { code } = await minify(content, {
    module: true,
    ecma: 2015,
    format: { comments: false },
  });
  return code;
}

export async function miniCss(content: string) {
  const { default: CleanCss } = await import("clean-css");

  const css = new CleanCss({
    level: { 1: { specialComments: undefined } },
  }).minify(content).styles;

  return css;
}
