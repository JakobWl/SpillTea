const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // Get the default Expo webpack config
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: []
    }
  }, argv);

  // Fix punycode deprecation by providing the userland alternative
  if (!config.resolve.fallback) {
    config.resolve.fallback = {};
  }
  
  config.resolve.fallback.punycode = path.resolve(__dirname, 'node_modules/punycode');
  
  // Fix webpack-dev-server deprecation by using the latest configuration format
  if (config.devServer) {
    const { devServer } = config;
    // Use the modern-style webpack-dev-server configuration
    config.devServer = {
      ...devServer,
      // Remove deprecated options
      inline: undefined,
      hot: true,
      hotOnly: undefined,
      // Use proper https options if needed
      https: devServer.https ? {
        key: devServer.key,
        cert: devServer.cert,
        ca: devServer.ca
      } : undefined,
    };
  }

  return config;
};