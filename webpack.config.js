var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        'upload': ['babel-polyfill', path.resolve(__dirname, 'src/fileUpload.js')]
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
    },
    resolve: {
        root: path.resolve(__dirname, ''),
        alias: {
            'crypto': 'shims/crypto.js'
        }
    }
};