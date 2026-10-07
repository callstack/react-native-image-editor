const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '../');
const escape = (p) => p.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The library is linked from the repo root (`link:..`), so Metro has to watch
 * it. The root has its own `react` / `react-native` dev dependencies, which
 * are blocked so the library resolves the example's copies instead.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],
  resolver: {
    blockList: [
      new RegExp(`^${escape(path.join(root, 'node_modules'))}\\/.*$`),
    ],
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
