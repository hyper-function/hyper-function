import colors from "picocolors";
import EventEmitter from "events";
import { dirname } from "desm";
import { DocBuilder } from "./build-doc.js";
import { EsmBuilder } from "./build-esm.js";
import { HfmBuilder } from "./build-hfm.js";
import { PropsBuilder } from "./build-hfc-props.js";
import { PkgJsonBuilder } from "./build-pkg-json.js";

import { DevServer } from "./dev-server.js";
import { resolveConfig, ResolvedConfig } from "./config.js";
import { CssVarBuilder } from "./build-css-variable.js";

// const require = createRequire(import.meta.url);
const __dirname = dirname(import.meta.url);

export class Service extends EventEmitter {
  config!: ResolvedConfig;

  constructor(public context: string, public command: "serve" | "build") {
    super();
  }

  async run() {
    this.config = await resolveConfig(this.context, this.command);

    const devServer = new DevServer(this.config);

    let docBuildrReady = false;
    let hfcPropsBuildrReady = false;
    let cssVarBuildReady = false;
    let pkgJsonBuildrReady = false;
    let pkgBuildrReady = false;

    const isReady = () =>
      docBuildrReady &&
      hfcPropsBuildrReady &&
      cssVarBuildReady &&
      pkgJsonBuildrReady &&
      pkgBuildrReady;

    const runAfterReady = () => {
      if (!isReady()) return;

      this.emit("ready");
      if (this.command === "serve") {
        devServer.listen();
      }
    };

    const propsBuilder = new PropsBuilder(this.config);
    propsBuilder.on("build-complete", () => {
      if (!hfcPropsBuildrReady) {
        hfcPropsBuildrReady = true;
        runAfterReady();
      }

      this.emit("hfc-props-build-complete");

      if (isReady() && this.command === "serve") {
        esmBuilder.build();
        devServer.sendMessage({ action: "update-hfc-props" });
      }
    });

    const cssVarBuilder = new CssVarBuilder(this.config);
    cssVarBuilder.on("build-complete", () => {
      if (!cssVarBuildReady) {
        cssVarBuildReady = true;
        runAfterReady();
      }

      this.emit("css-var-build-complete");

      if (isReady() && this.command === "serve") {
        esmBuilder.build();
        devServer.sendMessage({ action: "update-css-var" });
      }
    });

    const docBuilder = new DocBuilder(this.config);
    docBuilder.on("build-complete", () => {
      console.log("doc build complete");

      if (!docBuildrReady) {
        docBuildrReady = true;
        runAfterReady();
      }

      this.emit("doc-build-complete");

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-markdown" });
      }
    });

    const pkgJsonBuilder = new PkgJsonBuilder(this.config);
    pkgJsonBuilder.on("build-complete", () => {
      if (!pkgJsonBuildrReady) {
        pkgJsonBuildrReady = true;
        runAfterReady();
      }

      this.emit("pkg-json-build-complete");

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-pkg-json" });
      }
    });

    const hfmBuilder = new HfmBuilder(this.config);
    await hfmBuilder.resolveConfig();

    let isFirstBuild = true;
    hfmBuilder.on("build-complete", async () => {
      console.log(colors.green("hfc build complete"));

      if (isFirstBuild) {
        isFirstBuild = false;

        if (!pkgBuildrReady) {
          pkgBuildrReady = true;
          runAfterReady();
        }

        this.emit("pkg-build-complete");
      }

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "rebuild-complete" });
      }
    });

    const esmBuilder = new EsmBuilder(this.config);
    esmBuilder.on("build-complete", () => {
      hfmBuilder.build();
    });
  }
}
