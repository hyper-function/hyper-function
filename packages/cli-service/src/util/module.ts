import Module from "module";
import path from "path";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

export function resolveModule(request: string, context: string) {
  let resolvedPath;
  try {
    resolvedPath = Module.createRequire(
      path.resolve(context, "package.json")
    ).resolve(request);
  } catch (e) {
    resolvedPath = require.resolve(request, { paths: [context] });
  }
  return resolvedPath;
}

export function loadModule(request: string, context: string, force?: boolean) {
  try {
    return Module.createRequire(path.resolve(context, "package.json"))(request);
  } catch (error) {
    const resolvedPath = resolveModule(request, context);
    if (resolvedPath) {
      if (force) {
        clearRequireCache(resolvedPath);
      }
      return require(resolvedPath);
    }
  }
}

function clearRequireCache(id: string, map = new Map()) {
  const module = require.cache[id];
  if (module) {
    map.set(id, true);
    // Clear children modules
    module.children.forEach((child) => {
      if (!map.get(child.id)) clearRequireCache(child.id, map);
    });
    delete require.cache[id];
  }
}
