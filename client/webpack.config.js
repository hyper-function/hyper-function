import path from "path";
import { dirname } from "desm";
import { createRequire } from "module";
import { VueLoaderPlugin } from "vue-loader";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";

const __dirname = dirname(import.meta.url);
const require = createRequire(import.meta.url);

const isProd = process.env.NODE_ENV === "production";

const plugins = [
  new VueLoaderPlugin(),
  new MiniCssExtractPlugin(),
  new HtmlWebpackPlugin({
    chunks: ["index"],
    template: path.resolve(__dirname, "index.html"),
  }),
  new HtmlWebpackPlugin({
    chunks: ["render"],
    template: path.resolve(__dirname, "render.html"),
    filename: "render.html",
  }),
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
    __VUE_OPTIONS_API__: JSON.stringify(true),
    __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
  }),
];

if (!isProd)
  plugins.push(
    new webpack.SourceMapDevToolPlugin({
      exclude: "vendors",
    })
  );

/** @type { import('webpack').Configuration } */
export default {
  context: __dirname,
  entry: {
    index: "./src/main.ts",
    render: "./src/render.ts",
  },
  mode: isProd ? "production" : "development",
  output: {
    clean: true,
    publicPath: "/",
    path: path.resolve(__dirname, "..", "dist", "client"),
  },

  devtool: false,
  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
    },
    extensions: ["...", ".ts", ".vue"],
  },

  optimization: {
    concatenateModules: true,
    splitChunks: {
      chunks: "all",
    },
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        use: {
          loader: require.resolve("vue-loader"),
        },
      },
      {
        test: /\.ts$/,
        loader: require.resolve("ts-loader"),
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        type: "asset",
      },
    ],
  },
  plugins,
};
