import colors from "picocolors";
import EventEmitter from "events";
import { DocBuilder } from "./build-doc.js";
import { EsmBuilder } from "./build-esm.js";
import { HfmBuilder } from "./build-hfm.js";
import { PropsBuilder } from "./build-hfc-props.js";
import { ManifestBuilder } from "./build-manifest.js";

import { DevServer } from "./dev-server.js";
import { resolveConfig, ResolvedConfig } from "./config.js";
import { CssVarBuilder } from "./build-css-variable.js";

export class Service extends EventEmitter {
  config!: ResolvedConfig;

  constructor(public context: string, public command: "serve" | "build") {
    super();
  }

  async run() {
    this.config = await resolveConfig(this.context, this.command);

    const devServer = new DevServer(this.config);

    let docBuildDone = false;
    let propsBuildDone = false;
    let cssVarsBuildDone = false;
    let manifestBuildDone = false;
    let pkgBuildDone = false;

    const isReady = () =>
      docBuildDone &&
      propsBuildDone &&
      cssVarsBuildDone &&
      manifestBuildDone &&
      pkgBuildDone;

    const runAfterReady = () => {
      if (!isReady()) return;

      this.emit("ready");
      if (this.command === "serve") {
        devServer.listen();
      }
    };

    const propsBuilder = new PropsBuilder(this.config);
    propsBuilder.on("build-complete", () => {
      if (!propsBuildDone) {
        propsBuildDone = true;
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
      if (!cssVarsBuildDone) {
        cssVarsBuildDone = true;
        runAfterReady();
      }

      this.emit("css-var-build-complete");

      if (isReady() && this.command === "serve") {
        esmBuilder.build();
        devServer.sendMessage({ action: "update-hfc-cssvars" });
      }
    });

    const docBuilder = new DocBuilder(this.config);
    docBuilder.on("build-complete", () => {
      console.log("doc build complete");

      if (!docBuildDone) {
        docBuildDone = true;
        runAfterReady();
      }

      this.emit("doc-build-complete");

      if (isReady() && this.command === "serve") {
        devServer.sendMessage({ action: "update-hfc-markdown" });
      }
    });

    const manifestBuilder = new ManifestBuilder(this.config);
    manifestBuilder.on("build-complete", () => {
      if (!manifestBuildDone) {
        manifestBuildDone = true;
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

        if (!pkgBuildDone) {
          pkgBuildDone = true;
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
