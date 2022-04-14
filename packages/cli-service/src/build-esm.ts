import path from "path";
import fs from "fs-extra";
import webpack from "webpack";
import EventEmitter from "events";
import TerserPlugin from "terser-webpack-plugin";

import { Options } from "./options.js";

export class EsmBuilder extends EventEmitter {
  compiler: webpack.Compiler;
  constructor(
    private hfcConfig: Partial<Options> = {},
    private webpackConfig: webpack.Configuration
  ) {
    super();

    fs.ensureFileSync(path.join(this.hfcConfig.pkgOutputPath!, "hfc.css"));

    const esmOutputPath = path.resolve(this.hfcConfig.pkgOutputPath!, "esm");
    fs.ensureDirSync(esmOutputPath);
    fs.writeFileSync(
      path.join(esmOutputPath, "index.js"),
      [
        `import "../hfc.css";`,
        `import HFC from "./${this.hfcConfig.hfcName}";`,
        `import propTypes from "../hfc.props.min.json";`,
        `HFC.propTypes = propTypes;`,
        `export default HFC;`,
        ``,
      ].join("\n")
    );
    fs.writeFileSync(
      path.join(esmOutputPath, "hfc.js"),
      [
        `import HFC from "./${this.hfcConfig.hfcName}";`,
        `export default HFC;`,
        ``,
      ].join("\n")
    );

    const externals = this.hfcConfig.shared?.map((item) => {
      if (this.hfcConfig.sharedAlias?.[item]) {
        return { [item]: this.hfcConfig.sharedAlias[item] };
      }

      return item;
    });

    if (this.hfcConfig.command === "build") {
      Object.assign(this.webpackConfig, {
        externals,
        externalsType: "module",
      });
      this.webpackConfig!.optimization!.minimize = true;
      this.webpackConfig!.optimization!.minimizer = [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
          },
        }),
      ];
    } else {
      this.webpackConfig.resolve!.alias = this.hfcConfig.sharedAlias;
    }

    this.compiler = webpack(this.webpackConfig);
    this.build();
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

        this.emit("build-complete");
      });

      return;
    }

    let isFirstCompile = true;
    this.compiler.watch({}, async (err, result) => {
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

      if (isFirstCompile) {
        this.emit("build-complete");
      } else {
        this.emit("rebuild-complete");
      }

      isFirstCompile = false;
    });
  }
}
