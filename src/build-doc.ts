import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import hfcMdParser from "./markdown-parser.js";

import { HfcConfig } from "./options.js";
import EventEmitter from "events";

export class DocBuilder extends EventEmitter {
  mdFilePath: string;
  envs: { re: RegExp; value: string }[] = [];
  constructor(private hfcConfig: HfcConfig) {
    super();
    this.mdFilePath = path.join(this.hfcConfig.context, "hfc.md");

    Object.keys(hfcConfig.docEnv).forEach((key) => {
      this.envs.push({
        re: new RegExp(`\\$\{${key}\}`, "g"),
        value: hfcConfig.docEnv[key],
      });
    });

    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("HFC_DOC_")) {
        this.envs.push({
          re: new RegExp(`\\$\{${key}\}`, "g"),
          value: process.env[key]!,
        });
      }
    });

    console.log(this.envs);

    if (this.hfcConfig.command === "serve") {
      chokidar.watch(this.mdFilePath).on("change", () => this.build());
    }
    this.build();
  }
  async build() {
    let content = await fs.readFile(this.mdFilePath, "utf-8");
    for (const env of this.envs) {
      content = content.replace(env.re, env.value);
    }

    content = content.replace(
      new RegExp(`import:${this.hfcConfig.hfcName}="dev`, "g"),
      `import:${this.hfcConfig.hfcName}="${this.hfcConfig.version}`
    );

    await hfcMdParser(content, {
      outputPath: this.hfcConfig.docOutputPath,
      basePath: this.hfcConfig.context,
      hash: this.hfcConfig.command === "serve" ? "filename" : "content",
    });

    this.emit("build-complete");
  }
}
