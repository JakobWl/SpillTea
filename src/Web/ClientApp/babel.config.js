module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@': './src',
          'react-native-vector-icons': 'react-native-vector-icons',
        },
      }],
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": true,
        "allowUndefined": false
      }]
    ],
    env: {
      production: {
        plugins: []
      }
    }
  };
};