import path from "path";
import fs from "fs-extra";

export default async function (outputPath: string) {
  const [contentJs, contentCss] = await Promise.all([
    await fs.readFile(path.join(outputPath, "esm", "hfc.js"), "utf-8"),
    await fs.readFile(path.join(outputPath, "hfc.css"), "utf-8"),
  ]);

  const [js, css] = await Promise.all([miniJs(contentJs), miniCss(contentCss)]);

  const sizeJs = Buffer.from(js || "").byteLength;
  const sizeCss = Buffer.from(css).byteLength;

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
  const [postcss, cssnano, litePreset] = await Promise.all([
    import("postcss"),
    import("cssnano"),
    import("cssnano-preset-lite"),
  ]);

  const preset = litePreset.default({
    discardComments: { removeAll: true },
  });

  const { css } = await postcss
    .default([cssnano.default({ preset })])
    .process(content, {
      from: undefined,
    });

  return css;
}
