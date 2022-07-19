import path from "path";
import fs from "fs-extra";
import webpack from "webpack";
import EventEmitter from "events";
// import TerserPlugin from "terser-webpack-plugin";

import { HfcConfig } from "./options.js";

export class EsmBuilder extends EventEmitter {
  compiler: webpack.Compiler;
  constructor(
    private hfcConfig: HfcConfig,
    private webpackConfig: webpack.Configuration
  ) {
    super();

    fs.ensureFileSync(path.join(this.hfcConfig.pkgOutputPath, "hfc.css"));

    const esmOutputPath = path.resolve(this.hfcConfig.pkgOutputPath, "esm");
    fs.ensureDirSync(esmOutputPath);

    fs.writeFileSync(
      path.join(esmOutputPath, "index.js"),
      [
        `import "../hfc.css";`,
        `import HFC from "./hfc";`,
        `export default HFC;`,
        ``,
      ].join("\n")
    );

    Object.assign(this.webpackConfig, {
      externals: [
        function ({ request }: { request: string }, callback: any) {
          const firstChar = request[0];
          if (firstChar === "." || firstChar === "/") {
            return callback();
          }

          const parts = request.split("/");
          const npmName =
            firstChar === "@" ? parts[0] + "/" + parts[1] : parts[0];

          if (hfcConfig.dependencies[npmName]) {
            return callback(null, request);
          }

          callback();
        },
      ],
      externalsType: "module",
    });

    this.webpackConfig!.optimization!.minimize = false;
    // if (this.hfcConfig.command === "build") {
    //   this.webpackConfig!.optimization!.minimize = true;
    //   this.webpackConfig!.optimization!.minimizer = [
    //     new TerserPlugin({
    //       extractComments: false,
    //       terserOptions: {
    //         format: {
    //           comments: false,
    //         },
    //       },
    //     }),
    //   ];
    // }

    this.compiler = webpack(this.webpackConfig);
    this.build();
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

        this.emit("build-complete", stats);
      });

      return;
    }

    let isFirstCompile = true;
    this.compiler.watch({}, async (err, stats) => {
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
