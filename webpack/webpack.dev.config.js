const webpack = require('webpack');

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
	mode: 'development',
	entry: {
		serviceworker: path.resolve(__dirname, '..', 'src', 'ServiceWorker.ts'),
		settings: path.resolve(__dirname, '..', 'src', 'Chart.ts'),
	},
	output: {
		path: path.join(__dirname, '../dist'),
		filename: '[name].js',
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [{from: '.', to: '.', context: 'public'}]
		}),
		new webpack.ProvidePlugin({
			browser: "webextension-polyfill"
		})
	],
};