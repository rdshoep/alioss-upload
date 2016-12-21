var path = require('path');
var webpack = require('webpack');
var package = require('./package.json');

module.exports = {
    entry: {
        'upload': path.resolve(__dirname, 'package/upload.js'),
        'upload.full': ['babel-polyfill', path.resolve(__dirname, 'package/upload.full.js')]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/dist/",
        filename: package.version + '/[name].js'
    },
    node: {
        fs: "empty",
        child_process: "empty",
        zlib: "empty",
        "iconv-lite": "empty"
    },
    devtool: "#source-map",
    module: {
        loaders: [{
            test: /\.(js)$/,
            loader: ["babel-loader"]
            , query: {
                presets: ['es2015', 'stage-0']
            }
        },
            {
                test: /\.(json)$/,
                loader: 'json-loader'
            }
        ]
    },
    // resolve: {
    //     root: path.resolve(__dirname, ''),
    //     alias: {
    //         'crypto': 'shims/crypto.js'
    //     }
    // },
    plugins: [
        // new  webpack.optimize.CommonsChunkPlugin('common.js', ['upload', 'upload.full']),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            comments: false
        })
    ]
};