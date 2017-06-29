const Webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("../webpack.config");
const path = require('path');

const compiler = Webpack(webpackConfig);
const devServer = new WebpackDevServer(compiler, {
  // contentBase: path.join(__dirname, "../dist"),
  publicPath: "/dist/",
  hot: true,
  stats: {
    colors: true
  }
});

devServer.listen(3001, function() {
  console.log("Starting webpack-dev-server on http://localhost:3001");
});

const static = require('node-static');
// 
// Create a node-static server instance to serve the './public' folder 
// 
let file = new static.Server('./test', {
  cache: 0
});

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    //
    // Serve files!
    //
    file.serve(request, response);
  }).resume();
}).listen(3000);