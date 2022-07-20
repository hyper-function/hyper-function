// import { minify } from "terser";
// import postcss from "postcss";
// import cssnano from "cssnano";
// import litePreset from "cssnano-preset-lite";

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
