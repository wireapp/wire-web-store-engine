module.exports = {
  devtool: 'cheap-module-source-map',
  devServer: {
    stats: {
      chunks: false,
    }
  },
  entry: {
    'demo-bundle': `${__dirname}/src/demo/index.js`,
    'test-bundle': `${__dirname}/src/test/browser/index.js`,
  },
  node: {
    path: 'empty',
  },
  externals: {
    'fs-extra': '{}',
  },
  output: {
    path: `${__dirname}/dist`,
    filename: `[name].js`,
    publicPath: '/',
  }
};
