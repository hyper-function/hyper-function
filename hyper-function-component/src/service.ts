import path from "path";
import rm from "rimraf";
import fs from "fs-extra";
import webpack from "webpack";
import EventEmitter from "events";
import { dirname } from "desm";
// import { createRequire } from "module";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
// @ts-ignore
import defaultsDeep from "lodash.defaultsdeep";

import { defaults, HfcConfig } from "./options.js";
import AssetsPlugin from "./assets-plugin.js";

import { DocBuilder } from "./build-doc.js";
import { EsmBuilder } from "./build-esm.js";
import { WfmBuilder } from "./build-wfm.js";
import { HfcPropsBuilder } from "./build-hfc-props.js";
import { HfcPkgJsonBuilder } from "./build-pkg-json.js";

import resolveCssRules from "./resolve-css-rules.js";
import { DevServer } from "./dev-server.js";

// const require = createRequire(import.meta.url);
const __dirname = dirname(import.meta.url);

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

    const packageJson = await fs.readJson(
      path.join(this.context, "package.json")
    );

    const options = await this.loadUserOptions();
    this.hfcConfig = defaultsDeep(options, defaults(), {
      externalObject: {},
    });

    this.hfcConfig.command = this.command;
    this.hfcConfig.context = this.context;
    this.hfcConfig.name = packageJson.name;
    this.hfcConfig.hfcName = process.env.HFC_NAME || packageJson.hfc.name;
    this.hfcConfig.version = process.env.HFC_VERSION || packageJson.version;
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

    const env: Record<string, any> = {};
    Object.keys(this.hfcConfig.env).forEach((key) => {
      env["process.env." + key] = this.hfcConfig.env[key];
    });

    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("HFC_PUBLIC_")) {
        env["process.env." + key] = process.env[key];
      }
    });

    this.configureWebpack((webpackConfig: webpack.Configuration) => {
      const config: webpack.Configuration = {
        mode: this.hfcConfig.command === "serve" ? "development" : "production",
        context: this.context,
        entry: {
          main: this.hfcConfig.entry,
        },
        output: {
          path: this.hfcConfig.pkgOutputPath,
          filename: `esm/hfc.js`,
          hashDigest: "base64url",
          hashDigestLength: 13,
          hashFunction: "xxhash64",
          library: {
            type: "module",
          },
          environment: { module: true },
        },
        devtool: false,
        resolve: {
          alias: {
            "hfc-prop-names": path.resolve(
              this.hfcConfig.context,
              ".hfc",
              "propnames.js"
            ),
          },
          extensions: ["..."],
        },
        module: {
          generator: {
            asset: {
              outputPath: "assets",
              publicPath: "##HFC_ASSETS_MARK##",
              filename: "[contenthash][ext]",
            },
          },
          rules: [
            {
              test: this.hfcConfig.assetExtRegExp,
              type: "asset/resource",
            },
            {
              test: /\.js$/,
              resolve: {
                fullySpecified: false,
              },
            },
            // {
            //   test: path.resolve(this.hfcConfig.context, "hfc.d.ts"),
            //   use: {
            //     loader: path.join(__dirname, "prop-types-loader.cjs"),
            //   },
            // },
          ],
        },
        optimization: {
          usedExports: true,
          concatenateModules: true,
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

        plugins: [
          new MiniCssExtractPlugin({
            filename: "./hfc.css",
          }),
          // new webpack.ProgressPlugin(),
          new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
          }),
          new AssetsPlugin(),
          new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(
              this.hfcConfig.command === "serve" ? "development" : "production"
            ),
            ...env,
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

    let docBuildrReady = false;
    let hfcPropsBuildrReady = false;
    let pkgJsonBuildrReady = false;
    let pkgBuildrReady = false;

    const isReady = () =>
      docBuildrReady &&
      hfcPropsBuildrReady &&
      pkgJsonBuildrReady &&
      pkgBuildrReady;

    const runAfterReady = () => {
      if (!isReady()) return;

      this.emit("ready");
      if (this.command === "serve") {
        devServer.listen();
      }
    };

    const hfcPropsBuilder = new HfcPropsBuilder(this.hfcConfig);
    hfcPropsBuilder.on("build-complete", () => {
      if (!hfcPropsBuildrReady) {
        hfcPropsBuildrReady = true;
        runAfterReady();
      }

      this.emit("hfc-props-build-complete");

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-props" });
      }
    });

    const docBuilder = new DocBuilder(this.hfcConfig);
    docBuilder.on("build-complete", () => {
      console.log("doc build complete");

      if (!docBuildrReady) {
        docBuildrReady = true;
        runAfterReady();
      }

      this.emit("doc-build-complete");

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-markdown" });
      }
    });

    const hfcPkgJsonBuilder = new HfcPkgJsonBuilder(this.hfcConfig);
    hfcPkgJsonBuilder.on("build-complete", () => {
      if (!pkgJsonBuildrReady) {
        pkgJsonBuildrReady = true;
        runAfterReady();
      }

      this.emit("pkg-json-build-complete");

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-pkg-json" });
      }
    });

    const wfmBuilder = new WfmBuilder(this.hfcConfig);
    wfmBuilder.on("build-complete", async () => {
      console.log("hfc build complete");

      if (!pkgBuildrReady) {
        pkgBuildrReady = true;
        runAfterReady();
      }

      this.emit("pkg-build-complete");
    });

    wfmBuilder.on("rebuild-complete", async () => {
      console.log("hfc rebuild complete");

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "rebuild-complete" });
      }
    });

    const webpackConfig = this.resolveWebpackConfig();
    // console.log(JSON.stringify(webpackConfig, null, 2));

    const esmBuilder = new EsmBuilder(this.hfcConfig, webpackConfig);
    esmBuilder.on("build-complete", () => {
      wfmBuilder.build();
    });

    esmBuilder.on("rebuild-complete", (stats: webpack.Stats) => {
      // if (this.command === "serve") {
      //   if (stats.compilation.emittedAssets.has("./hfc.css")) {
      //     devServer.sendMessage({ action: "rebuild-complete" });
      //   }
      // }
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
