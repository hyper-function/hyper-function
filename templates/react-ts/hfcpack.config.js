import react from "@vitejs/plugin-react";

export default {
  entry: "./src/index.ts",
  plugins: [
    react({
      jsxRuntime: "classic",
      fastRefresh: false,
    }),
  ],
};
