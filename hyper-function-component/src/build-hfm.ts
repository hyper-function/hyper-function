// HFC Federated Module
import EventEmitter from "events";
import esbuild from "esbuild";
import fs from "fs-extra";
import path from "path";
import { build, InlineConfig } from "vite";
import { ResolvedConfig } from "./config.js";

const SHAREABLE_DEPS = ["react", "react-dom", "vue"];

export class HfmBuilder extends EventEmitter {
  viteConfig!: InlineConfig;
  sharedDeps: { name: string; ver: string }[] = [];
  constructor(private config: ResolvedConfig) {
    super();
  }
  async resolveConfig() {
    const entry = path.join(this.config.pkgOutputPath, "index.js");

    await this.buildShareDep();
    const wrapCode = this.buildWrap();

    this.viteConfig = {
      root: this.config.pkgOutputPath,
      publicDir: false,
      clearScreen: false,
      logLevel: "silent",
      build: {
        assetsDir: "",
        reportCompressedSize: false,
        lib: {
          name: "hfcExport",
          entry,
          formats: ["iife"],
          fileName: () => "hfc.js",
        },
        rollupOptions: {
          external: this.sharedDeps.map((dep) => dep.name),
          output: {
            banner: wrapCode.start,
            footer: wrapCode.end,
            globals: this.sharedDeps.reduce((prev, curr) => {
              prev[curr.name] = `shared['${curr.name}']`;
              return prev;
            }, {} as any),
            inlineDynamicImports: true,
            assetFileNames: `[name].[ext]`,
            chunkFileNames: `[name].js`,
          },
        },
        outDir: path.resolve(
          this.config.hfmOutputPath,
          this.config.hfcName,
          this.config.version
        ),
        emptyOutDir: false,
        minify: this.config.mode === "production",
      },
    };
  }
  async buildShareDep() {
    await Promise.all(
      SHAREABLE_DEPS.map(async (dep) => {
        if (!this.config.dependencies[dep]) return;

        const depPkgJson = await fs.readJson(
          path.resolve(process.cwd(), "node_modules", dep, "package.json")
        );

        this.sharedDeps.push({ name: dep, ver: depPkgJson.version });

        const depPath = path.resolve(
          this.config.hfmOutputPath,
          "share",
          `${dep}@${depPkgJson.version}.js`
        );

        const hasBuild = await fs.pathExists(depPath);
        if (hasBuild) return;

        await esbuild.build({
          entryPoints: [dep],
          outfile: depPath,
          bundle: true,
          format: "iife",
          globalName: `$HFC_SHARE_DEP['${dep}']`,
          define: {
            "process.env.NODE_ENV": JSON.stringify(this.config.mode),
          },
          minify: this.config.mode === "production",
          treeShaking: false,
          legalComments: "none",
        });
      })
    );
  }

  buildWrap() {
    return {
      start: `\
    (function () {
      const currentUrl = document.currentScript.src;
    
      $HFC_LOAD_CSS(currentUrl.replace("hfc.js", "style.css"));

      const deps = ${JSON.stringify(
        this.sharedDeps.map((dep) => ({ name: dep.name, ver: dep.ver }))
      )};
      const shared = (window.$HFC_SHARE_DEP = window.$HFC_SHARE_DEP || {});

      const hfmBaseUrl = currentUrl.split("hfm/")[0];
      function init() {
        return Promise.all(
          deps.map((dep) => {
            if (shared[dep.name]) return;
            return $HFC_LOAD_JS(
              hfmBaseUrl + "hfm/share/" + dep.name + "@" + dep.ver + ".js"
            );
          })
        ).then(initHfc);
      }

      let HFC;
      function get(name) {
        return () => Promise.resolve(name === "./hfc" ? HFC : undefined);
      }

      window.$HFC_CONTAINERS = window.$HFC_CONTAINERS || {};
      window.$HFC_CONTAINERS["${
        this.config.hfcName
      }"] = { get: get, init: init };

      function initHfc() {
    `,
      end: `
      HFC = hfcExport;
      }
    })();
      `,
    };
  }

  async build() {
    await build(this.viteConfig);
    this.emit("build-complete");
  }
}
