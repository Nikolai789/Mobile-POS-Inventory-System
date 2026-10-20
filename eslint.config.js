// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', '.expo/**', 'coverage/**', '.refactor/**'],
  },
  {
    files: ['backend/**/*.js', '*.config.js', 'tests/**/*.cjs', 'tests/setup-env.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { __dirname: 'readonly', Buffer: 'readonly' },
    },
  },
]);
