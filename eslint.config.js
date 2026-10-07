const callstackConfigReact = require('@callstack/eslint-config/react.flat.js');

module.exports = [
  {
    ignores: ['node_modules/', 'lib/'],
  },
  ...callstackConfigReact,
  {
    files: ['**/*.web.{js,ts,tsx}'],
    rules: {
      'promise/prefer-await-to-then': 'off',
    },
  },
  {
    files: ['eslint.config.js', 'example/**/*.{js,ts,tsx}'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
      'require-await': 'off',
    },
  },
];
