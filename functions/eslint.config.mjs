import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Node globals for Cloud Functions
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
    },
  },

  // ✅ Fast unblock for deploy: allow existing patterns in TS for now
  {
    files: ['src/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-useless-escape': 'off',
    },
  },

  // ✅ Scripts may use require(), process, etc.
  {
    files: ['scripts/**/*.{js,ts}'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Ignore build output
  { ignores: ['lib/**', 'node_modules/**'] },
];
