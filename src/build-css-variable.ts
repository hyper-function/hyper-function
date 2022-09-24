import EventEmitter from "events";
import path from "path";
import fs from "fs-extra";
import chokidar from "chokidar";
import postcss, { Rule } from "postcss";
import { CssVar, ResolvedConfig } from "./config";

export class CssVarBuilder extends EventEmitter {
  cssVarSrc: string;
  cssVarDist: string;

  constructor(private config: ResolvedConfig) {
    super();

    this.cssVarSrc = path.join(config.context, "variables.css");
    this.cssVarDist = path.join(
      this.config.hfmOutputPath,
      this.config.hfcName,
      this.config.version,
      "hfc.cssvar.json"
    );

    if (!fs.existsSync(this.cssVarSrc)) {
      console.log("missing variables.css");
      process.exit(-1);
    }

    fs.ensureFileSync(this.cssVarDist);

    if (config.command === "serve") {
      chokidar.watch(this.cssVarSrc).on("change", () => this.build());
    }

    this.build();
  }
  build() {
    const css = fs.readFileSync(this.cssVarSrc);

    const parsed = postcss.parse(css);

    const root = parsed.nodes.find(
      (item) => (item as Rule).selector === ":root"
    ) as Rule | undefined;

    if (!root) {
      console.error("miss :root selector in variables.css");
      process.exit(-1);
    }

    const cssVars: CssVar[] = [];
    root.nodes.forEach((node, i) => {
      if (node.type === "decl") {
        if (node.prop.startsWith("--")) {
          const cssVar: CssVar = {
            name: node.prop,
            value: node.value,
          };

          const prevNode = root.nodes[i - 1];
          if (prevNode && prevNode.type === "comment") {
            cssVar.comment = prevNode.text;
          }

          cssVars.push(cssVar);
        }
      }
    });

    this.config.cssVars = cssVars;
    fs.writeJsonSync(this.cssVarDist, cssVars);

    process.nextTick(() => {
      this.emit("build-complete");
    });
  }
}
