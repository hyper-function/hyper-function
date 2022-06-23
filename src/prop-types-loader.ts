import path from "path";
import parser from "./prop-types-parser.js";

module.exports = function (source: string) {
  if (!this.resourcePath.endsWith("hfc.d.ts")) return source;

  const context = process.env.HFC_CLI_CONTEXT || process.cwd();
  const location = path.resolve(context, "hfc.d.ts");
  const res = parser(location);

  const value = JSON.stringify(res.minResult)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return `module.exports = ${value}`;
};
