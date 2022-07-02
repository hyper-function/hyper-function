import EventEmitter from "events";
import path from "path";
import chokidar from "chokidar";
import { existsSync, writeFileSync } from "fs";

import { HfcConfig, Options } from "./options.js";
import parse from "./prop-types-parser.js";

export class HfcPropsBuilder extends EventEmitter {
  propsFilePath: string;
  constructor(private hfcConfig: HfcConfig) {
    super();
    this.propsFilePath = path.join(hfcConfig.context, "hfc.d.ts");
    if (!existsSync(this.propsFilePath)) {
      console.log("missing hfc.d.ts");
      process.exit(-1);
    }

    if (hfcConfig.command === "serve") {
      chokidar.watch(this.propsFilePath).on("change", () => this.build());
    }

    process.nextTick(() => {
      this.build();
    });
  }
  async build() {
    let res;
    try {
      res = parse(this.propsFilePath);
    } catch (error) {
      console.log("[hfc.d.ts] Parse error");
      console.log((error as any).message);
      process.exit(-1);
    }

    writeFileSync(
      path.join(this.hfcConfig.pkgOutputPath, "hfc.props.json"),
      JSON.stringify(res.result)
    );

    writeFileSync(
      path.join(this.hfcConfig.pkgOutputPath, "hfc.props.min.json"),
      JSON.stringify(res.minResult)
    );

    this.emit("build-complete");
  }
}
