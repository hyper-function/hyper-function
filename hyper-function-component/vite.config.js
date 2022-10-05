import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const root = path.resolve(__dirname, "client");

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    root,
    plugins: [vue()],
    resolve: {
      alias: {
        vue: "vue/dist/vue.esm-browser.prod.js",
      },
    },
    build: {
      watch: isDev ? {} : undefined,
      outDir: path.resolve("dist", "client"),
      minify: !isDev,
      emptyOutDir: !isDev,
      rollupOptions: {
        input: {
          index: path.resolve(root, "index.html"),
          preview: path.resolve(root, "preview.html"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
      },
    },
  };
});
