import webpack from "webpack";

export interface Options {
  name: string;
  hfcName: string;
  version: string;
  license: string;
  context: string;
  command: "serve" | "build";
  entry: string;
  port: number;
  assetExtRegExp: RegExp;
  outputPath: string;
  pkgOutputPath: string;
  docOutputPath: string;
  css: {
    loaderOptions?: {
      css?: any;
      postcss?: any;
      scss?: any;
      sass?: any;
      less?: any;
      stylus?: any;
    };

    [k: string]: any;
  };
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  plugins: {
    name: string;
    apply?: (opts: Partial<Options>) => {};
    configureWebpack?: (
      config: webpack.Configuration,
      opts: { mode: string; webpack: typeof webpack }
    ) => webpack.Configuration;
  }[];
  env: Record<string, string>;
}

export type HfcConfig = Options & {};

export const defaults = () => ({
  entry: "src/index.js",
  port: 7000,
  assetExtRegExp:
    /\.(png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|eot|ttf|otf|woff2?)$/i,
  css: {},
  plugins: [],
  env: {},
});
