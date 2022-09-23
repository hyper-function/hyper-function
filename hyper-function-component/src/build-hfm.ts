// HFC Federated Module
import EventEmitter from "events";
import fs from "fs-extra";
import path from "path";
import { build, InlineConfig } from "vite";
import { ResolvedConfig } from "./config.js";

const SHAREABLE_DEPS: Record<
  string,
  {
    subImports?: string[];
    buildScript?: string;
  }
> = {
  react: {
    buildScript: `
      import * as React from "react";
      import * as ReactDom from "react-dom";
      var shared = (window.$HFC_SHARE_DEP = window.$HFC_SHARE_DEP || {});
      if (!shared.react) shared.react = React;
      if (!shared['react-dom']) shared['react-dom'] = ReactDom;
    `,
  },
  "react-dom": {},
  vue: {
    buildScript: `
      import * as Vue from "vue";
      var shared = (window.$HFC_SHARE_DEP = window.$HFC_SHARE_DEP || {});
      if (!shared.vue) shared.vue = Vue;
    `,
  },
  preact: {
    subImports: ["preact/hooks"],
    buildScript: `
      import * as Preact from "preact";
      import * as PreactHooks from "preact/hooks";
      import * as PreactCompat from "preact/compat";
      import * as PreactJsxRuntime from "preact/jsx-runtime";
      var shared = (window.$HFC_SHARE_DEP = window.$HFC_SHARE_DEP || {});
      if (!shared.preact) shared.preact = Preact;
      if (!shared['preact/hooks']) shared['preact/hooks'] = PreactHooks;
      if (!shared['preact/compat']) shared['preact/compat'] = PreactCompat;
      if (!shared['preact/jsx-runtime']) shared['preact/jsx-runtime'] = PreactJsxRuntime;
    `,
  },
};

export class HfmBuilder extends EventEmitter {
  mode: "production" | "development";
  viteConfig!: InlineConfig;
  sharedDeps: { name: string; ver: string }[] = [];
  externals: string[] = [];
  constructor(private config: ResolvedConfig) {
    super();
    this.mode = config.command === "build" ? "production" : "development";
  }

  async resolveConfig() {
    const entry = path.join(this.config.pkgOutputPath, "index.js");

    await this.buildShareDep();
    const wrapCode = this.buildWrap();

    this.viteConfig = {
      root: this.config.pkgOutputPath,
      mode: this.mode,
      esbuild:
        this.mode === "production" ? { legalComments: "none" } : undefined,
      define: {
        "process.env.NODE_ENV": JSON.stringify(this.mode),
      },
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
          external: this.externals,
          output: {
            banner: wrapCode.start,
            footer: wrapCode.end,
            globals: this.externals.reduce((prev, curr) => {
              prev[curr] = `shared['${curr}']`;
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
        minify: this.config.command === "build",
      },
    };
  }
  async buildShareDep() {
    await Promise.all(
      Object.keys(this.config.dependencies).map(async (name) => {
        const shareableDep = SHAREABLE_DEPS[name];
        if (!shareableDep) return;
        this.externals.push(name);
        if (shareableDep.subImports) {
          this.externals.push(...shareableDep.subImports);
        }

        if (!shareableDep.buildScript) return;

        const pkgJson = await fs.readJson(
          path.resolve(
            this.config.context,
            "node_modules",
            name,
            "package.json"
          )
        );

        this.sharedDeps.push({ name: name, ver: pkgJson.version });

        const depPath = path.resolve(
          this.config.hfmOutputPath,
          "share",
          `${name}@${pkgJson.version}.js`
        );

        const hasBuild = await fs.pathExists(depPath);
        if (hasBuild) return;

        const entry = path.resolve(this.config.hfmOutputPath, name + ".js");
        await fs.writeFile(entry, shareableDep.buildScript);

        await build({
          root: this.config.context,
          mode: this.mode,
          esbuild: false,
          define: {
            "process.env.NODE_ENV": JSON.stringify(this.mode),
          },
          publicDir: false,
          clearScreen: false,
          logLevel: "silent",
          build: {
            assetsDir: "",
            reportCompressedSize: false,
            lib: {
              entry,
              name: "shareDep",
              formats: ["iife"],
              fileName: () => `${name}@${pkgJson.version}.js`,
            },
            outDir: path.resolve(this.config.hfmOutputPath, "share"),
            minify: this.mode === "production",
          },
        });

        await fs.remove(entry);
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
