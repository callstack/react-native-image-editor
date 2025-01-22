import callstackConfigReact from '@callstack/eslint-config/react.flat.js';

export default [
  {
    ignores: ['node_modules/', 'lib/'],
  },
  ...callstackConfigReact,
  {
    files: [
      'eslint.config.js',
      'example/**/*.{js,ts,tsx}',
      'example/*.{js,ts,tsx}',
    ],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
      'require-await': 'off',
    },
  },
];
