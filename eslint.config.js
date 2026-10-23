const js = require('@eslint/js');
const globals = require('globals');
module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.venv/**',
      '.runtime/**',
      'gen/**',
      'presentations/**',
      'ml/model/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser, sap: 'readonly', d3: 'readonly' },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
