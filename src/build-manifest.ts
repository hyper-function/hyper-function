import EventEmitter from "events";
import path from "path";
import chokidar from "chokidar";
import fs from "fs-extra";
import { ResolvedConfig } from "./config.js";

export interface Manifest {
  name: string;
  version: string;
  banner: string;
  homepage: string;
  description: string;
  keywords: string[];
  license: string;
  repository: string;
  dependencies: ResolvedConfig["dependencies"];
  sharedNpmImportMap: ResolvedConfig["sharedNpmImportMap"];
}

const { existsSync, writeFile } = fs;
export class ManifestBuilder extends EventEmitter {
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

    const homepage = process.env.HFC_HOMEPAGE || pkg.homepage;
    const description = process.env.HFC_DESCRIPTION || pkg.description;
    const repository = process.env.HFC_REPOSITORY || pkg.repository;
    const license = process.env.HFC_LICENSE || pkg.license;
    let keywords = pkg.keywords || [];
    if (process.env.HFC_KEYWORDS) {
      keywords = process.env.HFC_KEYWORDS.split(",");
    }

    const manifest: Manifest = {
      name: this.config.hfcName,
      version: this.config.version,
      banner: this.config.bannerFileName,
      homepage,
      description,
      keywords,
      license,
      repository,
      dependencies: this.config.dependencies,
      sharedNpmImportMap: this.config.sharedNpmImportMap,
    };

    await writeFile(
      path.join(this.config.docOutputPath, "manifest.json"),
      JSON.stringify(manifest)
    );

    this.emit("build-complete");
  }
}
