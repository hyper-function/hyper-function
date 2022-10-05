import EventEmitter from "events";
import path from "path";
import chokidar from "chokidar";
import fs from "fs-extra";

import { ResolvedConfig } from "./config.js";
import { parse } from "./schema-parser.js";

export class PropsBuilder extends EventEmitter {
  propsSrc: string;
  propsDist: string;

  public propTypes: {
    Attrs?: Record<string, any>;
    Events?: Record<string, any>;
    Slots?: Record<string, any>;
    [key: string]: any;
  } = {};

  public propNames: [string[], string[], string[]] = [[], [], []];

  constructor(private config: ResolvedConfig) {
    super();
    this.propsSrc = path.join(config.context, "props.hfc");
    this.propsDist = path.join(this.config.docOutputPath, "prop-types.json");

    if (!fs.existsSync(this.propsSrc)) {
      console.log("missing props.hfc");
      process.exit(-1);
    }

    fs.ensureFileSync(this.propsDist);

    if (config.command === "serve") {
      chokidar.watch(this.propsSrc).on("change", () => this.build());
    }

    this.build();
  }
  build() {
    const schema = fs.readFileSync(this.propsSrc, "utf8");
    let res;
    try {
      res = parse(schema);
    } catch (error) {
      console.log("[props.hfc] Parse error");
      console.log((error as any).message);
      process.exit(-1);
    }

    res.Attrs = res.Attrs || {};
    res.Events = res.Events || {};
    res.Slots = res.Slots || {};

    this.propTypes = res;

    fs.writeJsonSync(this.propsDist, this.propTypes);

    this.propNames = [
      Object.keys(res.Attrs),
      Object.keys(res.Events),
      Object.keys(res.Slots),
    ];

    process.env.HFC_PROP_NAMES = JSON.stringify(this.propNames);

    process.nextTick(() => {
      this.emit("build-complete");
    });
  }
}
