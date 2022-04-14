import { existsSync } from "fs";
import path from "path/posix";
import webpack from "webpack";
import { createRequire } from "module";

import { Options } from "./options.js";
import { resolveModule } from "./util/module.js";

import MiniCssExtractPlugin from "mini-css-extract-plugin";

const require = createRequire(import.meta.url);

export default (hfcConfig: Partial<Options>) => {
  const loaderOptions = hfcConfig.css?.loaderOptions || {};

  const hasPostCSSConfig =
    !!loaderOptions?.postcss ||
    existsSync(path.resolve(hfcConfig.context!, "postcss.config.js"));

  const rules: webpack.RuleSetRule[] = [];
  function createCSSRule(
    lang: string,
    test: RegExp,
    loader?: string,
    options?: any
  ) {
    const cssLoaderOptions = Object.assign(
      {
        importLoaders: lang === "css" ? 0 : 1,
        modules: {
          auto: true,
          localIdentName: `${hfcConfig.hfcName}-[local]-[hash:5]`,
        },
      },
      loaderOptions.css
    );

    const rule: webpack.RuleSetRule = {
      test,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {},
        },
        {
          loader: require.resolve("css-loader"),
          options: cssLoaderOptions,
        },
      ],
    };

    if (hasPostCSSConfig) {
      cssLoaderOptions.importLoaders += 1;
      (rule.use as any).push({
        loader: require.resolve("postcss-loader"),
        options: Object.assign({}, loaderOptions.postcss),
      });
    }

    if (loader) {
      (rule.use as any).push({
        loader: resolveModule(loader, hfcConfig.context!),
        options: Object.assign({}, options),
      });
    }

    rules.push(rule);
  }

  createCSSRule("css", /\.css$/);
  createCSSRule("postcss", /\.p(ost)?css$/);

  if (hfcConfig.dependencyKeys?.includes("sass-loader")) {
    createCSSRule(
      "scss",
      /\.scss$/,
      "sass-loader",
      Object.assign({}, loaderOptions.scss || loaderOptions.sass)
    );

    createCSSRule(
      "sass",
      /\.sass$/,
      "sass-loader",
      Object.assign({}, loaderOptions.sass, {
        sassOptions: Object.assign(
          {},
          loaderOptions.sass && loaderOptions.sass.sassOptions,
          {
            indentedSyntax: true,
          }
        ),
      })
    );
  }

  if (hfcConfig.dependencyKeys?.includes("less-loader")) {
    createCSSRule("less", /\.less$/, "less-loader", loaderOptions.less);
  }

  if (hfcConfig.dependencyKeys?.includes("stylus-loader")) {
    createCSSRule(
      "stylus",
      /\.styl(us)?$/,
      "stylus-loader",
      loaderOptions.stylus
    );
  }

  return rules;
};
