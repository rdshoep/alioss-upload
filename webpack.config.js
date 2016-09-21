var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        'upload': [path.resolve(__dirname, 'src/fileUpload.js')]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/dist/",
        filename: '[name].js'
    },
    node: {
        fs: "empty",
        child_process: "empty"
    },
    devtool: "#source-map",
    module: {
        loaders: [{
                test: /\.(js)$/,
                loader: 'babel-loader?presets[]=es2015'
            },
            {
                test: /\.(json)$/,
                loader: 'json-loader'
            }
        ]
    }
};