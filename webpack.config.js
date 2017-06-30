var path = require('path');
var webpack = require('webpack');
var package = require('./package.json');

module.exports = {
  entry: {
    'upload.plupload': path.resolve(__dirname, 'package/upload.plupload.js'),
    'upload.alioss': path.resolve(__dirname, 'package/upload.alioss.js'),
    'upload.alioss.compress': path.resolve(__dirname, 'package/upload.alioss.compress.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: "/dist/",
    filename: '[name].js'
  },
  node: {
    fs: "empty",
    child_process: "empty",
    zlib: "empty",
    "iconv-lite": "empty"
  },
  devtool: "#source-map",
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    port: 3001
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['es2015', 'stage-0']
        }
      }
    }]
  },
  plugins: [
    // new  webpack.optimize.CommonsChunkPlugin('common.js', ['upload', 'upload.full']),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      comments: false
    }),
    new webpack.DefinePlugin({
      //set default plupload resource folder
      PLUPLOAD_RESOURCE_PATH: JSON.stringify("/plupload/")
    })
  ]
};