// .eslintrc.cjs – root config for the React app (src/**)
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // Use the TS config you showed for linting
    project: './tsconfig.eslint.json',
  },
  plugins: [
    '@typescript-eslint',
    'react-hooks',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // This loads the react-hooks rules (including exhaustive-deps)
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // You can tweak this if you want stricter or looser behaviour:
    // 'react-hooks/exhaustive-deps': 'warn',
  },
};
