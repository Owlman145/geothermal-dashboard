module.exports = {
  chainWebpack(config) {
    config.devtool('source-map')
      .plugin('html')
      .tap(args => {
        args[0].title = "Geothermal Dashboard";
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
