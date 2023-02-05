module.exports = {
  chainWebpack(config) {
    config.devtool('source-map')
      .plugin('html')
      .tap(args => {
        args[0].title = "Greenhouse App";
        return args;
      })
  },
  configureWebpack: {
    devServer: {
      clientLogLevel: 'info',
      watchOptions: {
        poll: true
      }
    }
  }
}
