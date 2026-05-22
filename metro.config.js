const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    blockList: [
      /android\/app\/\.cxx\/.*/,
      /android\/build\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
