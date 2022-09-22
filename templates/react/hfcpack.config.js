import react from "@vitejs/plugin-react";

export default {
  entry: "./src/index.js",
  plugins: [
    react({
      jsxRuntime: "classic",
    }),
  ],
};
