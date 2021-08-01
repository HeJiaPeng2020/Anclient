 var path = require('path')
 var webpack = require('webpack')
 const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

 var v = 'development';
 var version = "1.0.0";

 module.exports = {
    mode: v, // "production" | "development" | "none"
    devtool: 'source-map',
    entry: { anclient: './lib/anclient.js' },
    // entry: ['./lib/view/react/jcomponents.js',
	// 		'./lib/anclient.js'],

    output: {
      filename: "[name]-" + version + ".min.js",

      path: path.resolve(__dirname, 'dist'),
      publicPath: "./dist/",

      library: 'anclient',
      libraryTarget: 'umd'
    },

	externals: {
	  'react': 'react', // Case matters here
	  'react-dom' : 'reactDOM' // Case matters here
	},

	plugins: [
		// new BundleAnalyzerPlugin()
	],

	resolve: {
		extensions: ['*', '.js', '.jsx']
	},

	module: {
	  rules: [
		// { test: /\.jsx$/,
		//   loader: 'babel-loader',
		//   exclude: /node_modules/,
		//   options: {
		//     presets: ['@babel/preset-react', '@babel/preset-env'] }
		// },
		{ test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
 		{ test: /\.css$/,
		  use: [ 'style-loader',
				'css-loader',
			  ] }
	  ],
	}, // module
}
