import fs from "fs-extra";
import path from "path";
import webpack from "webpack";

import rm from "rimraf";
import readPkg from "read-pkg";

import { defaults, HfcConfig } from "./options.js";
import AssetsPlugin from "./assets-plugin.js";

import { DocBuilder } from "./build-doc.js";
import { EsmBuilder } from "./build-esm.js";
import { WfmBuilder } from "./build-wfm.js";
import { HfcPropsBuilder } from "./build-hfc-props.js";
import { HfcPkgJsonBuilder } from "./build-pkg-json.js";

import resolveCssRules from "./resolve-css-rules.js";
import { DevServer } from "./dev-server.js";
import EventEmitter from "events";
import * as desm from "desm";
import { createRequire } from "module";

// @ts-ignore
import defaultsDeep from "lodash.defaultsdeep";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const require = createRequire(import.meta.url);

export class Service extends EventEmitter {
  initialized: boolean = false;
  webpackRawConfigFns: ((
    config: webpack.Configuration,
    opts: { mode: string; webpack: typeof webpack }
  ) => void)[] = [];
  hfcConfig!: HfcConfig;

  constructor(public context: string, public command: "serve" | "build") {
    super();
  }
  async loadUserOptions() {
    const config = await import(path.resolve(this.context, "hfc.js"));
    return config.default;
  }
  async run() {
    this.initialized = true;

    const hfcMdFile = path.join(this.context, "hfc.md");
    if (!fs.existsSync(hfcMdFile)) {
      console.log("can not find hfc.md");
      process.exit(1);
    }

    if (this.command === "build") {
      await new Promise((resolve, reject) => {
        rm(path.resolve(this.context, ".hfc", "build"), (err) => {
          if (err) reject(err);
          resolve(null);
        });
      });
    }

    const packageJson = await readPkg({ cwd: this.context });

    const options = await this.loadUserOptions();
    this.hfcConfig = defaultsDeep(options, defaults(), {
      externalObject: {},
    });

    this.hfcConfig.command = this.command;
    this.hfcConfig.context = this.context;
    this.hfcConfig.name = packageJson.name;
    this.hfcConfig.hfcName = packageJson.hfcName;
    this.hfcConfig.version = packageJson.version;
    this.hfcConfig.license = packageJson.license || "";
    this.hfcConfig.dependencies = packageJson.dependencies || {};
    this.hfcConfig.devDependencies = packageJson.devDependencies || {};
    this.hfcConfig.outputPath = path.resolve(
      this.context,
      ".hfc",
      this.hfcConfig.command
    );

    fs.ensureDirSync(this.hfcConfig.outputPath);

    this.hfcConfig.pkgOutputPath = path.resolve(
      this.hfcConfig.outputPath,
      "pkg"
    );
    fs.ensureDirSync(this.hfcConfig.pkgOutputPath);

    this.hfcConfig.docOutputPath = path.resolve(
      this.hfcConfig.outputPath,
      "doc"
    );
    fs.ensureDirSync(this.hfcConfig.docOutputPath);

    this.configureWebpack((webpackConfig: webpack.Configuration) => {
      const hfcPropsFilePath = path.resolve(this.hfcConfig.context, "hfc.d.ts");

      const config: webpack.Configuration = {
        mode: this.hfcConfig.command === "serve" ? "development" : "production",
        context: this.context,
        entry: this.hfcConfig.entry,
        devtool: false,
        resolve: {
          extensions: ["..."],
        },
        module: {
          generator: {
            asset: {
              filename: "./assets/[hash:16][ext]",
            },
          },
          rules: [
            {
              test: hfcPropsFilePath,
              exclude: /(node_modules)/,
              use: desm.join(import.meta.url, "..", "prop-types-loader"),
            },
            {
              test: this.hfcConfig.assetExtRegExp,
              exclude: /(node_modules)/,
              type: "asset/resource",
            },
            {
              test: /\.js$/,
              resolve: {
                fullySpecified: false,
              },
            },
            // {
            //   test: /\.jsx?$/,
            //   exclude: /(node_modules)/,
            //   use: {
            //     loader: require.resolve("swc-loader"),
            //     options: {
            //       jsc: Object.assign(
            //         {
            //           parser: {
            //             syntax: "ecmascript",
            //             jsx: true,
            //             dynamicImport: false,
            //             privateMethod: false,
            //             functionBind: false,
            //             exportDefaultFrom: false,
            //             exportNamespaceFrom: false,
            //             decorators: false,
            //             decoratorsBeforeExport: false,
            //             topLevelAwait: false,
            //             importMeta: false,
            //             preserveAllComments: false,
            //           },
            //           target: "es2022",
            //           experimental: {
            //             cacheRoot: path.resolve(this.context, ".hfc", "swc"),
            //           },
            //         },
            //         this.hfcConfig.swc?.js
            //       ),
            //     },
            //   },
            // },
            // {
            //   test: /\.tsx?$/,
            //   exclude: /(node_modules)/,
            //   use: {
            //     loader: require.resolve("swc-loader"),
            //     options: {
            //       jsc: Object.assign(
            //         {
            //           parser: {
            //             syntax: "typescript",
            //             tsx: true,
            //             decorators: false,
            //             dynamicImport: false,
            //           },
            //           target: "es2022",
            //           experimental: {
            //             cacheRoot: path.resolve(this.context, ".hfc", "swc"),
            //           },
            //         },
            //         this.hfcConfig.swc?.ts
            //       ),
            //     },
            //   },
            // },
          ],
        },
        optimization: {
          splitChunks: {
            cacheGroups: {
              styles: {
                name: "styles",
                type: "css/mini-extract",
                chunks: "all",
                enforce: true,
              },
            },
          },
        },
        experiments: {
          outputModule: true,
        },
        output: {
          path: this.hfcConfig.pkgOutputPath,
          filename: `esm/${this.hfcConfig.hfcName}.js`,
          library: {
            type: "module",
          },
          environment: { module: true },
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: "./hfc.css",
          }),
          // new webpack.ProgressPlugin(),
          new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
          }),
          new AssetsPlugin({}),
          new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(
              this.hfcConfig.command === "serve" ? "development" : "production"
            ),
          }),
        ],
      };
      webpackConfig = Object.assign(webpackConfig, config);

      const cssRules = resolveCssRules(this.hfcConfig);
      webpackConfig.module!.rules = [
        ...webpackConfig.module!.rules!,
        ...cssRules,
      ];

      return webpackConfig;
    });

    this.hfcConfig.plugins?.forEach((plugin) => {
      plugin.apply?.(this.hfcConfig);
      if (plugin.configureWebpack) {
        this.configureWebpack(plugin.configureWebpack);
      }
    });

    const devServer = new DevServer(this.hfcConfig);

    const docBuilder = new DocBuilder(this.hfcConfig);
    docBuilder.on("build-complete", () => {
      console.log("doc build complete");
      this.emit("doc-build-complete");
      if (this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-markdown" });
      }
    });

    const hfcPropsBuilder = new HfcPropsBuilder(this.hfcConfig);
    hfcPropsBuilder.on("build-complete", () => {
      this.emit("hfc-props-build-complete");
      if (this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-props" });
      }
    });

    const hfcPkgJsonBuilder = new HfcPkgJsonBuilder(this.hfcConfig);
    hfcPkgJsonBuilder.on("build-complete", () => {
      this.emit("pkg-json-build-complete");
      if (this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-pkg-json" });
      }
    });

    const webpackConfig = this.resolveWebpackConfig();
    // console.log(JSON.stringify(webpackConfig, null, 2));

    const wfmBuilder = new WfmBuilder(this.hfcConfig);
    wfmBuilder.on("build-complete", async () => {
      console.log("hfc build complete");
      this.emit("pkg-build-complete");
      if (this.command === "serve") {
        devServer.listen();
      }
    });

    wfmBuilder.on("rebuild-complete", async () => {
      console.log("hfc rebuild complete");

      if (this.command === "serve") {
        devServer.sendMessage({ action: "rebuild-complete" });
      }
    });

    const esmBuilder = new EsmBuilder(this.hfcConfig, webpackConfig);
    esmBuilder.on("build-complete", () => {
      wfmBuilder.build();
    });

    esmBuilder.on("rebuild-complete", (stats: webpack.Stats) => {
      if (this.command === "serve") {
        if (stats.compilation.emittedAssets.has("./hfc.css")) {
          devServer.sendMessage({ action: "rebuild-complete" });
        }
      }
    });
  }
  configureWebpack(
    fn: (
      config: webpack.Configuration,
      opts: { mode: string; webpack: typeof webpack }
    ) => void
  ) {
    this.webpackRawConfigFns.push(fn);
  }
  resolveWebpackConfig() {
    if (!this.initialized) {
      throw new Error(
        "Service must call init() before calling resolveWebpackConfig()."
      );
    }

    let config = {};
    this.webpackRawConfigFns.forEach((fn) => {
      fn(config, {
        mode: this.hfcConfig.command === "serve" ? "development" : "production",
        webpack,
      });
    });

    return config;
  }
}
