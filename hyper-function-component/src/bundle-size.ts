import path from "path";
import fs from "fs-extra";
import esbuild from "esbuild";
import { gzipSync } from "zlib";

export default async function (outputPath: string) {
  const [contentJs, contentCss] = await Promise.all([
    await fs.readFile(path.join(outputPath, "hfc.js"), "utf-8"),
    await fs.readFile(path.join(outputPath, "hfc.css"), "utf-8"),
  ]);

  const [js, css] = await Promise.all([miniJs(contentJs), miniCss(contentCss)]);

  const sizeJs = js === "" ? 0 : gzipSync(Buffer.from(js), { level: 9 }).length;
  const sizeCss =
    css === "" ? 0 : gzipSync(Buffer.from(css), { level: 9 }).length;

  return { sizeJs, sizeCss };
}

export async function miniJs(content: string) {
  const output = await esbuild.transform(content, { minify: true });
  return output.code;
}

export async function miniCss(content: string) {
  const output = await esbuild.transform(content, {
    loader: "css",
    minify: true,
  });
  return output.code;
}
