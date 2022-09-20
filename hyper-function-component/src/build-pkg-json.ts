import EventEmitter from "events";
import path from "path";
import chokidar from "chokidar";
import fs from "fs-extra";
import { ResolvedConfig } from "./config.js";

const { existsSync, writeFile } = fs;
export class PkgJsonBuilder extends EventEmitter {
  pkgJsonFilePath: string;
  constructor(private config: ResolvedConfig) {
    super();
    this.pkgJsonFilePath = path.join(config.context, "package.json");
    if (!existsSync(this.pkgJsonFilePath)) {
      console.error("can not find package.json!");
      process.exit(-1);
    }

    if (config.command === "serve") {
      chokidar.watch(this.pkgJsonFilePath).on("change", () => this.build());
    }

    this.build();
  }
  async build() {
    const pkg = await fs.readJson(this.pkgJsonFilePath);

    const hfcPage = `https://hyper.fun/c/${this.config.hfcName}/${this.config.version}`;

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
        name: this.config.hfcName,
      },
      name: this.config.hfcName,
      version: this.config.version,
      main: "index.js",
      module: "index.js",
      type: "module",
      homepage,
      description,
      keywords: ["hyper-function-component", "hfc", ...keywords],
      license,
      repository,
      dependencies: this.config.dependencies,
      // optionalDependencies: {
      //   "@types/hyper-function-component": "^2.0.0",
      // },
    };

    await writeFile(
      path.join(this.config.pkgOutputPath, "package.json"),
      JSON.stringify(newPkg, null, 2)
    );

    await writeFile(
      path.join(this.config.pkgOutputPath, "readme.md"),
      `👉  ${hfcPage}${pkg.description ? ` - ${pkg.description}` : ""}`
    );

    this.emit("build-complete");
  }
}
