const fs = require("fs");
const path = require("path");
// const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  mode: "production",
  context: __dirname, // to automatically find tsconfig.json
  plugins: [/*new CleanWebpackPlugin()*/],
  devtool: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {loader: "ts-loader", options: {transpileOnly: true, configFile: "tsconfig.json"}},
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      "path": path.resolve(__dirname, "platform", "browser", "path"),
      "fs": path.resolve(__dirname, "platform", "browser", "fs"),
      "perf_hooks": path.resolve(__dirname, "platform", "browser", "perf_hooks"),
      "crypto": false,
    },
    alias: {
      "clvm_rs": false,
    },
  },
  target: ["es5"],
  optimization: {
    minimizer: [
      new TerserPlugin(),
    ]
  },
  entry: "./index.ts",
  output: {
    chunkFormat: "array-push",
    path: path.resolve(__dirname, ".dist", "npm", "browser"),
    filename: "index.js",
    library: ["clvm_tools"],
    libraryTarget: "umd",
    globalObject: "this",
  },
};