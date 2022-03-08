import EventEmitter from "events";
import path from "path";
import readPkg from "read-pkg";
import chokidar from "chokidar";
import { Options } from "./options.js";
import { existsSync, writeFile, writeFileSync } from "fs";

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

    const homepage = `https://hyper.fun/${this.hfcConfig.hfcName}/${pkg.version}`;

    const { dependencies = {}, devDependencies = {} } = pkg;
    const deps: Record<string, string> = {};

    this.hfcConfig.shared?.forEach((item) => {
      let aliasName = this.hfcConfig.sharedAlias![item];
      if (aliasName) {
        if (aliasName.includes("/")) aliasName = aliasName.split("/")[0];

        const version = dependencies[aliasName] || devDependencies[aliasName];
        if (version) deps[aliasName] = version;
      }

      const version = dependencies[item] || devDependencies[item];
      if (version) deps[item] = version;
    });

    const newPkg = {
      name: pkg.name,
      version: pkg.version,
      main: "esm/index.js",
      module: "esm/index.js",
      homepage,
      description: pkg.description,
      keywords: pkg.keywords,
      license: pkg.license,
      repository: pkg.repository,
      dependencies: deps,
    };

    writeFileSync(
      path.join(this.hfcConfig.pkgOutputPath!, "package.json"),
      JSON.stringify(newPkg, null, 2)
    );

    writeFileSync(
      path.join(this.hfcConfig.pkgOutputPath!, "readme.md"),
      `👉 ${homepage}`
    );

    this.emit("build-complete");
  }
}
