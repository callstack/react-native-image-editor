const path = require('path');
const pack = require('../package.json');

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          [pack.name]: path.join(__dirname, '../lib/ImageEditor'),
        },
      },
    ],
  ],
};
