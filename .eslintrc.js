module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'warn'
  },
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js']
};