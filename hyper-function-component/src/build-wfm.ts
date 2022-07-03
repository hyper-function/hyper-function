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
  wfmPath: string;
  constructor(private hfcConfig: HfcConfig) {
    super();
    const wfmEntry = path.join(this.hfcConfig.context, ".hfc", "wfm-entry.js");

    fs.writeFileSync(
      wfmEntry,
      [
        `import HFC from "${path.resolve(
          this.hfcConfig.pkgOutputPath,
          "esm",
          "index.js"
        )}";`,
        `export default HFC;`,
      ].join("\n")
    );

    this.wfmPath = path.resolve(this.hfcConfig.pkgOutputPath, "wfm");

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
          {
            test: /\.css$/,
            use: [
              { loader: require.resolve("style-loader") },
              { loader: require.resolve("css-loader") },
            ],
          },
        ],
      },
      plugins: [
        new webpack.container.ModuleFederationPlugin({
          name: "@hyper.fun/" + this.hfcConfig.hfcName,
          filename: "entry.js",
          library: {
            name: `$HFC_WFM_CONTAINERS["@hyper.fun/${this.hfcConfig.hfcName}"]`,
            type: "assign",
          },
          shared: this.hfcConfig.dependencies,
          exposes: {
            "./hfc": wfmEntry,
          },
        }),
        new webpack.ids.DeterministicChunkIdsPlugin({
          maxLength: 8,
        }),
        new webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify(
            this.hfcConfig.command === "serve" ? "development" : "production"
          ),
        }),
      ],
    });
  }
  build() {
    if (this.hfcConfig.command === "build") {
      this.compiler.run((err, stats) => {
        if (err) {
          console.error(err);
          process.exit(-1);
        }

        if (stats?.hasErrors()) {
          console.error(stats.compilation.errors);
        }

        const unusedHfcJsPath = path.join(this.wfmPath, "__hfc.js");
        if (fs.existsSync(unusedHfcJsPath)) fs.rmSync(unusedHfcJsPath);

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

      const unusedHfcJsPath = path.join(this.wfmPath, "__hfc.js");
      if (fs.existsSync(unusedHfcJsPath)) fs.rmSync(unusedHfcJsPath);

      if (isFirstCompile) {
        this.emit("build-complete", stats);
      } else {
        this.emit("rebuild-complete", stats);
      }

      isFirstCompile = false;
    });
  }
}
