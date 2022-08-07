import EventEmitter from "events";
import path from "path";
import chokidar from "chokidar";
import { HfcConfig } from "./options.js";
import fs from "fs-extra";

const { existsSync, writeFile } = fs;
export class HfcPkgJsonBuilder extends EventEmitter {
  pkgJsonFilePath: string;
  constructor(private hfcConfig: HfcConfig) {
    super();
    this.pkgJsonFilePath = path.join(hfcConfig.context, "package.json");
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
    const pkg = await fs.readJson(this.pkgJsonFilePath);

    const hfcPage = `https://hyper.fun/c/${this.hfcConfig.hfcName}/${this.hfcConfig.version}`;

    const homepage = process.env.HFC_HOMEPAGE || pkg.homepage;
    const description = process.env.HFC_DESCRIPTION || pkg.description;
    const repository = process.env.HFC_REPOSITORY || pkg.repository;
    const license = process.env.HFC_LICENSE || pkg.license;
    let keywords = pkg.keywords || [];
    if (process.env.HFC_KEYWORDS) {
      keywords = process.env.HFC_KEYWORDS.split(",");
    }

    const newPkg = {
      hfc: {
        name: this.hfcConfig.hfcName,
      },
      name: "@hyper.fun/" + this.hfcConfig.hfcName,
      version: this.hfcConfig.version,
      main: "esm/index.js",
      module: "esm/index.js",
      type: "module",
      homepage,
      description,
      keywords: ["hyper-function-component", "hfc", ...keywords],
      license,
      repository,
      dependencies: this.hfcConfig.dependencies,
      optionalDependencies: {
        "@types/hyper-function-component": "^2.0.0",
      },
    };

    await writeFile(
      path.join(this.hfcConfig.pkgOutputPath, "package.json"),
      JSON.stringify(newPkg, null, 2)
    );

    await writeFile(
      path.join(this.hfcConfig.pkgOutputPath, "readme.md"),
      `👉  ${hfcPage}${pkg.description ? ` - ${pkg.description}` : ""}`
    );

    this.emit("build-complete");
  }
}
