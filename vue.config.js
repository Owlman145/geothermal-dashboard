module.exports = {
  chainWebpack(config) {
    config.devtool('source-map')
  },
  configureWebpack: {
    devServer: {
      clientLogLevel: 'info',
      watchOptions: {
        //poll: true
      }
    }
  }
}
