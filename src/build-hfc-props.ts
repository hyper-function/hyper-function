import EventEmitter from "events";
import path from "path";
import chokidar from "chokidar";
import fs from "fs-extra";

import { ResolvedConfig } from "./config.js";
import { parse } from "./schema-parser.js";

export class PropsBuilder extends EventEmitter {
  propsFilePath: string;
  propTypesPath: string;

  public propTypes: {
    Attrs?: Record<string, any>;
    Events?: Record<string, any>;
    Slots?: Record<string, any>;
    [key: string]: any;
  } = {};

  public propNames: [string[], string[], string[]] = [[], [], []];

  constructor(private config: ResolvedConfig) {
    super();
    this.propsFilePath = path.join(config.context, "hfc.schema");
    this.propTypesPath = path.join(this.config.pkgOutputPath, "hfc.props.json");

    if (!fs.existsSync(this.propsFilePath)) {
      console.log("missing hfc.schema");
      process.exit(-1);
    }

    fs.ensureFileSync(this.propTypesPath);

    if (config.command === "serve") {
      chokidar.watch(this.propsFilePath).on("change", () => this.build());
    }

    this.build();
  }
  build() {
    const schema = fs.readFileSync(this.propsFilePath, "utf8");
    let res;
    try {
      res = parse(schema);
    } catch (error) {
      console.log("[hfc.schema] Parse error");
      console.log((error as any).message);
      process.exit(-1);
    }

    res.Attrs = res.Attrs || {};
    res.Events = res.Events || {};
    res.Slots = res.Slots || {};

    this.propTypes = res;

    fs.writeFileSync(this.propTypesPath, JSON.stringify(this.propTypes));

    this.propNames = [
      Object.keys(res.Attrs),
      Object.keys(res.Events),
      Object.keys(res.Slots),
    ];

    process.env.HFC_PROPS = JSON.stringify(this.propNames);

    process.nextTick(() => {
      this.emit("build-complete");
    });
  }
}
