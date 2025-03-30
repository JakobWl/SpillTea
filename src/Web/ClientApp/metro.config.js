// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add vector-icons to the asset trasfer list
config.resolver.assetExts.push('ttf');

// Needed for vector-icons
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-vector-icons': path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
};

module.exports = config;