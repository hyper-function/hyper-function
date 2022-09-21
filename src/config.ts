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
};

export type UserConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn;

export function defineConfig(config: UserConfigExport): UserConfigExport {
  return config;
}

export type ResolvedConfig = Readonly<
  HfcConfig & {
    name: string;
    hfcName: string;
    version: string;
    license: string;
    context: string;
    command: "serve" | "build";
    outputPath: string;
    hfcMdFilePath: string;
    pkgOutputPath: string;
    hfmOutputPath: string;
    docOutputPath: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  }
>;

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
  let { default: userConfig } = await import(path.resolve(context, "hfc.js"));
  config =
    typeof userConfig === "function" ? await userConfig(configEnv) : userConfig;

  const hfcMdFilePath = path.join(context, "hfc.md");
  if (!fs.existsSync(hfcMdFilePath)) {
    console.log("can not find hfc.md");
    process.exit(1);
  }

  // const mode = config.mode || defaultMode;
  const env = config.env || {};

  const packageJson = await fs.readJson(path.resolve(context, "package.json"));

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

  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  const resolvedConfig: ResolvedConfig = {
    ...config,
    env,
    // mode,
    context,
    command,
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
  };

  return resolvedConfig;
}
