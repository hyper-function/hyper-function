import path from "path";
import fs from "fs-extra";
import webpack from "webpack";
import EventEmitter from "events";
import TerserPlugin from "terser-webpack-plugin";

import { Options } from "./options.js";

export class WfmBuilder extends EventEmitter {
  compiler: webpack.Compiler;
  wfmPath: string;
  constructor(private hfcConfig: Partial<Options> = {}) {
    super();
    const wfmEntry = path.join(this.hfcConfig.context!, ".hfc", "wfm-entry.js");

    fs.writeFileSync(
      wfmEntry,
      [
        `import HFC from "${path.resolve(
          this.hfcConfig.pkgOutputPath!,
          "esm",
          "index.js"
        )}";`,
        `export default HFC;`,
      ].join("\n")
    );

    this.wfmPath = path.resolve(this.hfcConfig.pkgOutputPath!, "wfm");

    const shared: string[] = [];
    this.hfcConfig.shared?.forEach((item) => {
      shared.push(item);
      if (this.hfcConfig.sharedAlias?.[item]) {
        shared.push(this.hfcConfig.sharedAlias[item]);
      }
    });

    this.compiler = webpack({
      context: this.wfmPath,
      mode: this.hfcConfig.command === "serve" ? "development" : "production",
      entry: wfmEntry,
      devtool: false,
      output: {
        path: this.wfmPath,
        filename: "__hfc.js",
        chunkFilename:
          this.hfcConfig.command === "serve" ? undefined : "[chunkhash].js",
      },
      resolve: {
        alias: {
          [path.resolve(this.hfcConfig.pkgOutputPath!, "hfc.css")]: false,
        },
      },
      optimization:
        this.hfcConfig.command === "serve"
          ? undefined
          : {
              chunkIds: false,
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
            },
      module: {
        generator: {
          asset: {
            emit: false,
            filename: "../assets/[hash:16][ext]",
          },
        },
        rules: [
          {
            test: this.hfcConfig.assetExtRegExp,
            type: "asset/resource",
          },
        ],
      },
      plugins: [
        new webpack.container.ModuleFederationPlugin({
          name: this.hfcConfig.name,
          filename: "entry.js",
          library: {
            name: `$HFC_WFM_CONTAINERS["${this.hfcConfig.name}"]`,
            type: "assign",
          },
          shared,
          exposes: {
            "./hfc": wfmEntry,
          },
        }),
        new webpack.ids.DeterministicChunkIdsPlugin({
          maxLength: 8,
        }),
      ],
    });
  }
  build() {
    if (this.hfcConfig.command === "build") {
      this.compiler.run((err, result) => {
        if (err) {
          console.error(err);
          process.exit(-1);
        }

        if (result?.hasErrors()) {
          console.error(result.compilation.errors);
        }

        const unusedHfcJsPath = path.join(this.wfmPath, "__hfc.js");
        if (fs.existsSync(unusedHfcJsPath)) fs.rmSync(unusedHfcJsPath);

        this.emit("build-complete");
      });

      return;
    }

    let isFirstCompile = true;
    this.compiler.watch({}, (err, result) => {
      if (err) {
        console.error(err);
        process.exit(-1);
      }

      if (result?.hasErrors()) {
        console.error(result.compilation.errors);
      }

      if (result?.hasWarnings()) {
        console.warn(result.compilation.warnings);
      }

      const unusedHfcJsPath = path.join(this.wfmPath, "__hfc.js");
      if (fs.existsSync(unusedHfcJsPath)) fs.rmSync(unusedHfcJsPath);

      if (isFirstCompile) {
        this.emit("build-complete");
      } else {
        this.emit("rebuild-complete");
      }

      isFirstCompile = false;
    });
  }
}
