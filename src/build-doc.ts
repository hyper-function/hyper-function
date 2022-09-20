import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import hfcMdParser from "./markdown-parser.js";

import EventEmitter from "events";
import { ResolvedConfig } from "./config.js";

export class DocBuilder extends EventEmitter {
  mdFilePath: string;
  envs: { re: RegExp; value: string }[] = [];
  constructor(private config: ResolvedConfig) {
    super();
    this.mdFilePath = path.join(this.config.context, "hfc.md");

    const docEnv: Record<string, any> = {};
    const env = { ...this.config.env, ...process.env };
    for (const key in env) {
      if (key.startsWith("HFC_DOC_")) {
        docEnv[key] = env[key];
      }
    }

    Object.keys(docEnv).forEach((key) => {
      this.envs.push({
        re: new RegExp(`\\$\{${key}\}`, "g"),
        value: docEnv[key],
      });
    });

    if (this.config.command === "serve") {
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
      new RegExp(`import:${this.config.hfcName}="dev`, "g"),
      `import:${this.config.hfcName}="${this.config.version}`
    );

    await hfcMdParser(content, {
      outputPath: this.config.docOutputPath,
      basePath: this.config.context,
      hash: this.config.command === "serve" ? "filename" : "content",
    });

    this.emit("build-complete");
  }
}
