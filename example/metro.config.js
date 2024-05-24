const path = require('path');
const { makeMetroConfig } = require('@rnx-kit/metro-config');
module.exports = makeMetroConfig({
  watchFolders: [path.resolve(__dirname, '../')],
  transformer: {
    // eslint-disable-next-line require-await
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
});
