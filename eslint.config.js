const callstackConfigReact = require('@callstack/eslint-config/react.flat.js');

module.exports = [
  {
    ignores: ['node_modules/', 'lib/'],
  },
  ...callstackConfigReact,
  {
    files: ['eslint.config.js', 'example/**/*.{js,ts,tsx}'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
      'require-await': 'off',
    },
  },
];
