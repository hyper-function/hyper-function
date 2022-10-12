import fs from "fs-extra";
import path from "path";
import { UserConfig, BuildOptions } from "vite";

export interface ConfigEnv {
  command: "build" | "serve";
  mode: string;
}

export type HfcConfig = Pick<
  UserConfig,
  "plugins" | "resolve" | "css" | "json" | "esbuild" | "assetsInclude"
> & {
  entry: string;
  port?: number;
  env?: Record<string, any>;
  rollupOptions?: BuildOptions["rollupOptions"];
  sharedNpmImports?: string[];
};

export type UserConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn;

export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config;
}

export interface CssVar {
  name: string;
  value: string;
  comment?: string;
}

export type ResolvedConfig = HfcConfig & {
  name: string;
  version: string;
  license: string;
  keywords: string[];
  description: string;
  hfcName: string;
  context: string;
  command: "serve" | "build";
  cssVars: CssVar[];
  bannerFileName: string;
  outputPath: string;
  hfcMdFilePath: string;
  pkgOutputPath: string;
  hfmOutputPath: string;
  docOutputPath: string;
  dependencies: Record<string, { v: string; rv: string }>;
  devDependencies: Record<string, string>;
  sharedNpmImportMap: Record<string, { imports: string[] }>;
};

const SHARED_NPM_IMPORTS = [
  "react",
  "react-dom",
  "vue",
  "preact",
  "jquery",
  "d3",
  "chart.js",
  "apexcharts",
  "echarts",
];

export async function resolveConfig(
  context: string,
  command: "serve" | "build",
  defaultMode = "development"
): Promise<ResolvedConfig> {
  if (command === "build") defaultMode = "production";
  const configEnv = {
    command,
    mode: defaultMode,
  };

  let config: HfcConfig;
  let { default: userConfig } = await import(
    path.resolve(context, "hfcpack.config.js")
  );

  config =
    typeof userConfig === "function" ? await userConfig(configEnv) : userConfig;

  const hfcMdFilePath = path.join(context, "hfc.md");
  if (!fs.existsSync(hfcMdFilePath)) {
    console.log("can not find hfc.md");
    process.exit(1);
  }

  // const mode = config.mode || defaultMode;
  const env = config.env || {};

  const outputPath = path.resolve(context, ".hfc", command);

  if (command === "build") {
    await fs.remove(outputPath);
  }

  fs.ensureDirSync(outputPath);

  const pkgOutputPath = path.resolve(outputPath, "pkg");
  fs.ensureDirSync(pkgOutputPath);

  const hfmOutputPath = path.resolve(outputPath, "hfm");
  fs.ensureDirSync(hfmOutputPath);

  const docOutputPath = path.resolve(outputPath, "doc");
  fs.ensureDirSync(docOutputPath);

  const rollupOptions: BuildOptions["rollupOptions"] =
    config.rollupOptions || {};

  rollupOptions!.external = (source, importer, isResolved) => {
    if (isResolved) return false;

    const firstChar = source[0];
    if (firstChar === "." || firstChar === "/") {
      return false;
    }

    const parts = source.split("/");
    const npmName = firstChar === "@" ? parts[0] + "/" + parts[1] : parts[0];

    if (dependencies[npmName]) return true;

    return false;
  };

  const packageJson = await fs.readJson(path.resolve(context, "package.json"));

  const keywords = packageJson.keywords || [];
  const description = packageJson.description;
  const devDependencies = packageJson.devDependencies || {};

  const dependencies: ResolvedConfig["dependencies"] = {};
  await Promise.all(
    Object.entries<string>(packageJson.dependencies || {}).map(
      async ([name, requiredVersion]) => {
        const pkgJsonPath = path.resolve(
          context,
          "node_modules",
          name,
          "package.json"
        );

        const pkgJson = await fs.readJson(pkgJsonPath);
        dependencies[name] = { rv: requiredVersion, v: pkgJson.version };
      }
    )
  );

  const sharedNpmImportMap: ResolvedConfig["sharedNpmImportMap"] = {};

  for (const importItem of new Set([
    ...SHARED_NPM_IMPORTS,
    ...(config.sharedNpmImports || []),
  ])) {
    const arr = importItem.split("/");
    let npmName = arr[0];
    if (npmName[0] === "@") npmName += "/" + arr[1];

    if (!dependencies[npmName]) continue;
    // special case for react-dom, which must bundle with react
    if (npmName === "react-dom") continue;

    sharedNpmImportMap[npmName] = sharedNpmImportMap[npmName] || {
      imports: [],
    };
    sharedNpmImportMap[npmName].imports.push(importItem);
  }

  config.css = config.css || {};
  if (!config.css.postcss) {
    config.css.postcss = {};
  }

  let bannerFileName = "";
  for (const ext of [".jpg", ".jpeg", ".png", ".svg", ".webp"]) {
    const bannerPath = path.join(context, "banner" + ext);
    if (await fs.pathExists(bannerPath)) {
      bannerFileName = "banner" + ext;
      await fs.copyFile(bannerPath, path.join(docOutputPath, bannerFileName));
      break;
    }
  }

  const resolvedConfig: ResolvedConfig = {
    ...config,
    env,
    // mode,
    context,
    command,
    keywords,
    description,
    rollupOptions,
    name: packageJson.name,
    port: Number(process.env.PORT) || Number(config.port) || 7000,
    hfcName: process.env.HFC_NAME || packageJson.hfc.name,
    version: process.env.HFC_VERSION || packageJson.version,
    license: process.env.HFC_LICENSE || packageJson.license || "",
    outputPath,
    hfcMdFilePath,
    pkgOutputPath,
    hfmOutputPath,
    docOutputPath,
    dependencies,
    devDependencies,
    cssVars: [],
    bannerFileName,
    sharedNpmImportMap,
  };

  return resolvedConfig;
}
