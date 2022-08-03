import EventEmitter from "events";
import path from "path";
import chokidar from "chokidar";
import { createRequire } from "module";
import fs from "fs-extra";

import { HfcConfig } from "./options.js";
import parse from "./prop-types-parser.js";

const require = createRequire(import.meta.url);

const { existsSync, writeFile } = fs;

export class HfcPropsBuilder extends EventEmitter {
  propsFilePath: string;
  propNamesPath: string;
  propTypesPath: string;

  propTypes: {
    attrs: Record<string, any>;
    events: Record<string, any>;
    slots: Record<string, any>;
    types: Record<string, any>;
    desc: Record<string, any>;
  } = {
    attrs: {},
    events: {},
    slots: {},
    types: {},
    desc: {},
  };

  propNames: [string[], string[], string[]] = [[], [], []];

  constructor(private hfcConfig: HfcConfig) {
    super();
    this.propsFilePath = path.join(hfcConfig.context, "hfc.d.ts");

    this.propNamesPath = path.join(
      this.hfcConfig.context,
      ".hfc",
      "propnames.js"
    );

    this.propTypesPath = path.join(
      this.hfcConfig.pkgOutputPath,
      "hfc.props.json"
    );

    if (!existsSync(this.propsFilePath)) {
      console.log("missing hfc.d.ts");
      process.exit(-1);
    }

    if (hfcConfig.command === "serve") {
      chokidar.watch(this.propsFilePath).on("change", () => this.build());
    }

    this.build();
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

    this.propTypes = res.result;

    await writeFile(this.propTypesPath, JSON.stringify(this.propTypes));

    // writeFileSync(
    //   path.join(this.hfcConfig.pkgOutputPath, "hfc.props.min.json"),
    //   JSON.stringify(res.minResult)
    // );

    this.propNames = [
      Object.keys(res.result.attrs),
      Object.keys(res.result.events),
      Object.keys(res.result.slots),
    ];

    await writeFile(
      this.propNamesPath,
      `export default ${JSON.stringify(this.propNames)};\n`
    );

    this.emit("build-complete");
  }
}
