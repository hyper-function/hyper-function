import webpack from "webpack";

const pluginName = "HfcAssetsPlugin";
export default class HfcAssetsPlugin {
  constructor(options: any) {}
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.afterCodeGeneration.tap(pluginName, () => {
        for (const m of compilation.modules) {
          if (m.type === "asset/resource") {
            for (const r of compilation.chunkGraph.getModuleRuntimes(m)) {
              const code = compilation.codeGenerationResults.get(m, r);
              code.runtimeRequirements = new Set(["module"]);
              const filename = code.data?.get("filename");
              code.sources.set(
                "javascript",
                new webpack.sources.RawSource(
                  `module.exports = new URL(".${filename}", import.meta.url);`
                )
              );
            }
          }
        }
      });
    });
  }
}
