import path from "path";
import fs from "fs-extra";
import webpack from "webpack";
import EventEmitter from "events";
import TerserPlugin from "terser-webpack-plugin";
import { createRequire } from "module";

import { HfcConfig } from "./options.js";

const require = createRequire(import.meta.url);
export class WfmBuilder extends EventEmitter {
  compiler: webpack.Compiler;
  wfmContextPath: string;
  constructor(private hfcConfig: HfcConfig) {
    super();

    const wfmEntry = path.join(hfcConfig.pkgOutputPath, "esm", "index.js");
    const emptyEntry = path.join(hfcConfig.context, ".hfc", "empty.js");

    fs.writeFileSync(emptyEntry, "");

    this.wfmContextPath = path.resolve(this.hfcConfig.pkgOutputPath, "wfm");

    const shared: Record<string, any> = {};
    Object.keys(this.hfcConfig.dependencies).forEach((key) => {
      shared[key] = {
        requiredVersion: this.hfcConfig.dependencies[key],
        singleton: true,
      };
    });

    const plugins = [
      new webpack.container.ModuleFederationPlugin({
        name: "@hyper.fun/" + this.hfcConfig.hfcName,
        filename: "entry.js",
        library: {
          name: `$HFC_WFM_CONTAINERS["@hyper.fun/${this.hfcConfig.hfcName}"]`,
          type: "assign",
        },
        shared,
        exposes: {
          "./hfc": wfmEntry,
        },
      }),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          this.hfcConfig.command === "serve" ? "development" : "production"
        ),
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      }),
    ];

    if (this.hfcConfig.command === "build") {
    }

    this.compiler = webpack({
      context: this.wfmContextPath,
      mode: this.hfcConfig.command === "serve" ? "development" : "production",
      entry: emptyEntry,
      devtool: false,
      output: {
        path: this.wfmContextPath,
        filename: "empty.js",
        chunkFilename: (pathData) => {
          return "[id].js";
        },
        chunkLoadingGlobal: `$HCK-${this.hfcConfig.hfcName}-${this.hfcConfig.version}`,
      },
      optimization: {
        concatenateModules: true,
        usedExports: true,
        ...(this.hfcConfig.command === "serve"
          ? {}
          : {
              minimize: true,
              minimizer: [
                new TerserPlugin({
                  extractComments: false,
                  terserOptions: {
                    format: {
                      comments: false,
                    },
                  },
                }),
              ],
            }),
      },
      module: {
        generator: {
          asset: {
            emit: false,
            filename: "../assets/[hash:12][ext]",
          },
        },
        rules: [
          {
            test: this.hfcConfig.assetExtRegExp,
            type: "asset/resource",
          },
          {
            test: /\.css$/,
            use: [
              { loader: require.resolve("style-loader") },
              { loader: require.resolve("css-loader") },
            ],
          },
        ],
      },
      plugins,
    });
  }
  build() {
    const emptyOutputJsPath = path.join(this.wfmContextPath, "empty.js");

    if (this.hfcConfig.command === "build") {
      this.compiler.run((err, stats) => {
        if (err) {
          console.error(err);
          process.exit(-1);
        }

        if (stats?.hasErrors()) {
          console.error(stats.compilation.errors);
        }

        fs.rm(emptyOutputJsPath);

        this.emit("build-complete", stats);
      });

      return;
    }

    let isFirstCompile = true;
    this.compiler.watch({}, (err, stats) => {
      if (err) {
        console.error(err);
        process.exit(-1);
      }

      if (stats?.hasErrors()) {
        console.error(stats.compilation.errors);
      }

      if (stats?.hasWarnings()) {
        console.warn(stats.compilation.warnings);
      }

      if (isFirstCompile) {
        this.emit("build-complete", stats);
      } else {
        this.emit("rebuild-complete", stats);
      }

      isFirstCompile = false;
    });
  }
}
