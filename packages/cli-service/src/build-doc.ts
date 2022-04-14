import path from "path";
import fs, { ensureDirSync } from "fs-extra";
import chokidar from "chokidar";
import hfcMdParser from "./markdown-parser.js";

import { Options } from "./options.js";
import EventEmitter from "events";

export class DocBuilder extends EventEmitter {
  mdFilePath: string;
  constructor(private hfcConfig: Partial<Options> = {}) {
    super();
    this.mdFilePath = path.join(this.hfcConfig.context!, "hfc.md");
    if (this.hfcConfig.command === "serve") {
      chokidar.watch(this.mdFilePath).on("change", () => this.build());
    }
    this.build();
  }
  async build() {
    let content = fs.readFileSync(this.mdFilePath, "utf-8");
    content = content.replace(
      new RegExp(`import:${this.hfcConfig.hfcName}="dev`, "g"),
      `import:${this.hfcConfig.hfcName}="${this.hfcConfig.version}`
    );

    await hfcMdParser(content, {
      outputPath: this.hfcConfig.docOutputPath!,
      basePath: this.hfcConfig.context!,
      hash: this.hfcConfig.command === "serve" ? "filename" : "content",
    });

    this.emit("build-complete");
  }
}
