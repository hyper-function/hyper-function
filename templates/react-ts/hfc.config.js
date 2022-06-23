const ts = require("hfc-plugin-typescript");

module.exports = {
  entry: "./src/index.ts",
  plugins: [ts()],
};
