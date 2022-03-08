import webpack from "webpack";

export interface Options {
  name: string;
  hfcName: string;
  version: string;
  context: string;
  command: "serve" | "build";
  entry: string;
  port: number;
  shared: string[];
  sharedAlias: Record<string, string>;
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
  swc: {
    js?: any;
    ts?: any;
  };
  dependencies: string[];
  plugins: {
    name: string;
    apply?: (opts: Partial<Options>) => {};
    configureWebpack?: (
      config: webpack.Configuration,
      opts: { mode: string; webpack: typeof webpack }
    ) => webpack.Configuration;
  }[];
}

export const defaults = () => ({
  entry: "hfc.js",
  port: 7000,
  shared: [],
  sharedAlias: {},
  assetExtRegExp:
    /\.(png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|eot|ttf|otf|woff2?)$/i,
  css: {},
  swc: {},
  plugins: [],
});
