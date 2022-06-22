import EventEmitter from "events";
import path from "path";
import readPkg from "read-pkg";
import chokidar from "chokidar";
import { Options } from "./options.js";
import { existsSync, writeFileSync } from "fs";

export class HfcPkgJsonBuilder extends EventEmitter {
  pkgJsonFilePath: string;
  constructor(private hfcConfig: Partial<Options> = {}) {
    super();
    this.pkgJsonFilePath = path.join(hfcConfig.context!, "package.json");
    if (!existsSync(this.pkgJsonFilePath)) {
      console.error("can not find package.json!");
      process.exit(-1);
    }

    if (hfcConfig.command === "serve") {
      chokidar.watch(this.pkgJsonFilePath).on("change", () => this.build());
    }
    this.build();
  }
  async build() {
    const pkg = await readPkg({ cwd: this.hfcConfig.context });

    const hfcPage = `https://hyper.fun/${this.hfcConfig.hfcName}/${pkg.version}`;

    const newPkg = {
      name: "@hyper.fun/" + pkg.name,
      version: pkg.version,
      main: "esm/index.js",
      module: "esm/index.js",
      homepage: pkg.homepage,
      description: pkg.description,
      keywords: ["hyper-function-component", "hfc", ...(pkg.keywords || [])],
      license: pkg.license,
      repository: pkg.repository,
      dependencies: pkg.dependencies,
    };

    writeFileSync(
      path.join(this.hfcConfig.pkgOutputPath!, "package.json"),
      JSON.stringify(newPkg, null, 2)
    );

    writeFileSync(
      path.join(this.hfcConfig.pkgOutputPath!, "readme.md"),
      `👉 ${hfcPage}${pkg.description ? ` - ${pkg.description}` : ""}`
    );

    this.emit("build-complete");
  }
}
