const webpack = require('webpack'),
    path = require('path'),
    CopyWebpackPlugin = require('copy-webpack-plugin');
 
module.exports = {
  entry: './src/index.js',
  output: {
    publicPath: '/dist',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.js$/, use: 'babel-loader' },
      { test: /\.glsl$/, use: 'webpack-glsl-loader'}
    ]
  },
};