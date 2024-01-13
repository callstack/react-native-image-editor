module.exports = {
  root: true,
  extends: ['@callstack'],
  ignorePatterns: ['node_modules/', 'lib/'],
  overrides: [
    {
      files: ['**/*.config.js'], // metro.config.js & react-native.config.js
      rules: {
        'import/no-extraneous-dependencies': ['off'],
      },
    },
  ],
};
