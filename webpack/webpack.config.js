const webpack = require('webpack');

const fs = require('fs');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

let version = null;
fs.readFile('package.json', (err, data) => {
	if (err) {
		throw err;
	}
	const packageData = JSON.parse(data);
	version = packageData.version;
});

function replace(/*Buffer*/ data, /*string*/ pattern, /*string*/ replace) {
	let str = data.toString();
	return Buffer.from(str.replace(pattern, replace));
}

module.exports = {
	mode: 'production',
	entry: {
		ContentScript: path.resolve(__dirname, '..', 'src', 'ContentScript.ts'),
		Hooker: path.resolve(__dirname, '..', 'src', 'Hooker.ts'),
		ServiceWorker: path.resolve(__dirname, '..', 'src', 'ServiceWorker.ts'),
		Settings: path.resolve(__dirname, '..', 'src', 'Chart.ts'),
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
			patterns: [
				{
					from: '.',
					to: '.',
					context: 'public'
				}
			]
		}),
		new CopyPlugin({
			patterns: [
				{
					from: '.',
					to: '.',
					context: 'manifest',
					transform: {
						transformer: function (content, _) {
							return replace(content, '!!!VERSION!!!', version);
						}
					}
				}
			]
		}),
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery'
		})
	],
};