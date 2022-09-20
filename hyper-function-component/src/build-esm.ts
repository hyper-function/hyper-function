import path from "path";
import fs from "fs-extra";
import colors from "picocolors";
import EventEmitter from "events";
import { InlineConfig, build } from "vite";
import type {
  RollupWatcher,
  RollupOutput,
  OutputChunk,
  OutputAsset,
  RollupError,
} from "rollup";

type HFC = ((a: string) => {
  changed: () => void;
  disconnected: () => void;
}) & {
  tag: string;
  hfc: string;
  ver: string;
  names: [string[], string[], string[]];
};

const Ab: HFC = () => {
  const changed = () => {};
  const disconnected = () => {};

  return { changed, disconnected };
};

Ab.tag = "div";
Ab.hfc = "awa-btn";
Ab.ver = "1.2.3";
Ab.names = [[], [], []];

import { ResolvedConfig } from "./config.js";

const outputBuildError = (e: RollupError) => {
  let msg = colors.red((e.plugin ? `[${e.plugin}] ` : "") + e.message);
  if (e.id) {
    msg += `\nfile: ${colors.cyan(
      e.id + (e.loc ? `:${e.loc.line}:${e.loc.column}` : "")
    )}`;
  }
  if (e.frame) {
    msg += `\n` + colors.yellow(e.frame);
  }
  console.error(msg, { error: e });
};

export class EsmBuilder extends EventEmitter {
  distHfcJsPath: string;
  distHfcCssPath: string;
  viteConfig: InlineConfig;
  watcher?: RollupWatcher;
  constructor(private config: ResolvedConfig) {
    super();

    fs.ensureFileSync(path.join(config.pkgOutputPath, "hfc.css"));

    this.distHfcJsPath = path.join(config.pkgOutputPath, "hfc.js");
    this.distHfcCssPath = path.join(config.pkgOutputPath, "hfc.css");

    fs.writeFileSync(
      path.join(config.pkgOutputPath, "index.js"),
      [
        `import "./hfc.css";`,
        `import HFC from "./hfc.js";`,
        `export default HFC;`,
        ``,
      ].join("\n")
    );

    this.viteConfig = {
      mode: config.mode,
      plugins: config.plugins,
      resolve: config.resolve,
      css: config.css,
      json: config.json,
      esbuild: config.esbuild,
      assetsInclude: config.assetsInclude,
      publicDir: false,
      clearScreen: false,
      envPrefix: "HFC_",
      logLevel: "silent",
      build: {
        target: "esnext",
        emptyOutDir: false,
        assetsDir: "",
        lib: {
          entry: config.entry,
          formats: ["es"],
          fileName: "hfc",
        },
        reportCompressedSize: false,
        rollupOptions: config.rollupOptions!,
        minify: false,
      },
    };

    this.build();
  }
  async build() {
    if (this.watcher) await this.watcher.close();

    const hfcEnv: Record<string, any> = {};

    const env = { ...this.config.env, ...process.env };
    for (const key in env) {
      if (key.startsWith("HFC_PUBLIC_")) {
        hfcEnv[key] = env[key];
      }
    }

    hfcEnv["process.env.HFC_PROPS"] = process.env.HFC_PROPS;
    hfcEnv["process.env.HFC_NAME"] = JSON.stringify(this.config.hfcName);
    hfcEnv["process.env.HFC_VERSION"] = JSON.stringify(this.config.version);

    this.viteConfig.define = hfcEnv;
    this.viteConfig.build!.watch = { skipWrite: true };
    this.watcher = (await build(this.viteConfig)) as RollupWatcher;

    // remove vite listener
    this.watcher.removeAllListeners("event");

    this.watcher.on("event", async (event) => {
      if (event.code === "BUNDLE_START") {
        console.log(colors.cyan(`\nhfc build started...`));
      } else if (event.code === "BUNDLE_END") {
        const output = await event.result.generate({
          format: "es",
          exports: "auto",
          sourcemap: false,
          generatedCode: "es2015",
          entryFileNames: "hfc.js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
          inlineDynamicImports: true,
        });

        await this.writeOutput(output);

        this.emit("build-complete");

        if (this.config.command === "build") {
          this.watcher!.close();
        }
      } else if (event.code === "ERROR") {
        outputBuildError(event.error);
      }
    });
  }
  private async writeOutput(output: RollupOutput) {
    let jsChunk: OutputChunk | undefined;
    let cssAsset: OutputAsset | undefined;
    for (const item of output.output) {
      if (item.type === "chunk") {
        if (item.fileName === "hfc.js") jsChunk = item;
        continue;
      }

      if (item.fileName === "style.css") {
        cssAsset = item;
        continue;
      }
    }

    if (!jsChunk) {
      console.log("fail to build hfc, hfc.js not found");
      return;
    }

    const js = jsChunk.code;
    const css = cssAsset ? cssAsset.source : "";

    await Promise.all([
      fs.writeFile(this.distHfcJsPath, js),
      fs.writeFile(this.distHfcCssPath, css),
    ]);
  }
}
