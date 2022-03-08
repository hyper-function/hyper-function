import fs from "fs";
import path from "path";
import { loadModule } from "./module.js";

export async function loadFileConfig(context: string) {
  let fileConfig;
  let fileConfigPath: string = "";

  const possibleConfigPaths = [
    process.env.HFC_CONFIG_PATH,
    "./hfc.config.js",
    "./hfc.config.cjs",
  ];
  for (const p of possibleConfigPaths) {
    const resolvedPath = p && path.resolve(context, p);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      fileConfigPath = resolvedPath;
      break;
    }
  }

  if (fileConfigPath) {
    fileConfig = loadModule(fileConfigPath, context);
  }

  return { fileConfig, fileConfigPath };
}
