import webpack from "webpack";
const { Compilation, sources } = webpack;

const pluginName = "HfcAssetsPlugin";

export default class HfcAssetsPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        () => {
          const file = compilation.getAsset("esm/hfc.js");
          let code = file!.source.source().toString();
          code = code.replace(
            /"##HFC_ASSETS_MARK##(\S+)"/g,
            'new URL("../assets/$1", import.meta.url)'
          );

          compilation.updateAsset("esm/hfc.js", new sources.RawSource(code));
        }
      );
    });
  }
}

// export default class HfcAssetsPlugin {
//   apply(compiler: webpack.Compiler) {
//     compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
//       compilation.hooks.afterCodeGeneration.tap(pluginName, () => {
//         for (const m of compilation.modules) {
//           if (m.type === "asset/resource") {
//             const code = compilation.codeGenerationResults.get(m, "main");

//             code.runtimeRequirements = new Set(["module"]);
//             const filename = code.data?.get("filename");
//             code.sources.set(
//               "javascript",
//               new webpack.sources.RawSource(
//                 `module.exports = new URL(".${filename}", import.meta.url);`
//               )
//             );
//           }
//         }
//       });
//     });
//   }
// }
