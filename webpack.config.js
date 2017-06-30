module.exports = {
  devtool: 'cheap-module-source-map',
  devServer: {
    stats: {
      chunks: false,
    }
  },
  entry: {
    'engine-bundle': `${__dirname}/dist/commonjs/index.js`,
    'test-bundle': `${__dirname}/src/test/index.js`,
  },
  output: {
    path: `${__dirname}/dist`,
    filename: `[name].js`,
    publicPath: '/',
  }
};
