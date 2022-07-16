import vue from "hfc-plugin-vue";

export default {
  entry: "./src/index.ts",
  plugins: [vue({ ts: true })],
};
