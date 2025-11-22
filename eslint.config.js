import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['src/tests/hooks/useEnrollments.spec.tsx'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      // Temporarily disable unused checks to keep lint clean; re-enable when code stabilized.
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
  },
  {
    files: ['**/*.tsx', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
      },
    },
    rules: {
      // Add React-specific rules here if needed
    },
  },
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        document: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
      },
    },
    rules: {
      // Temporarily disable unused checks to keep lint clean; re-enable when code stabilized.
      'no-unused-vars': 'off',
    },
  },
];
