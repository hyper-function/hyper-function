import webpack from "webpack";

import {
  compareModulesByPreOrderIndexOrIdentifier,
  compareChunksNatural,
  // @ts-ignore
} from "webpack/lib/util/comparators.js";

import {
  getUsedModuleIdsAndModules,
  getFullModuleName,
  // @ts-ignore
} from "webpack/lib/ids/IdHelpers.js";
import { ulid } from "ulidx";

export class UniqueModuleIdsPlugin {
  constructor() {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap("UniqueModuleIdsPlugin", (compilation) => {
      compilation.hooks.moduleIds.tap("UniqueModuleIdsPlugin", () => {
        const chunkGraph = compilation.chunkGraph;
        const context = compiler.context;

        const [usedIds, modules] = getUsedModuleIdsAndModules(compilation);
        const modulesInNaturalOrder = modules.sort(
          compareModulesByPreOrderIndexOrIdentifier(compilation.moduleGraph)
        );
        for (const module of modulesInNaturalOrder) {
          // const ident = getFullModuleName(module, context, compiler.root);

          const moduleId = "M" + ulid();
          chunkGraph.setModuleId(module, moduleId);
          usedIds.add(moduleId);
        }
      });
    });
  }
}

export class UniqueChunkIdsPlugin {
  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap("UniqueChunkIdsPlugin", (compilation) => {
      compilation.hooks.chunkIds.tap("UniqueChunkIdsPlugin", (chunks) => {
        const chunkGraph = compilation.chunkGraph;
        const compareNatural = compareChunksNatural(chunkGraph);
        const chunksInNaturalOrder = Array.from(chunks).sort(compareNatural);
        for (const chunk of chunksInNaturalOrder) {
          const id = "C" + ulid();
          chunk.id = id;
          chunk.ids = [id];
        }
      });
    });
  }
}
