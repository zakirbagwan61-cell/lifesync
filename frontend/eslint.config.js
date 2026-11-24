import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

// ESLint for the LifeSync frontend (flat config).
//   npm run lint        check everything
//   npm run lint:fix    apply the safe automatic fixes
export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },

  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'], // React 17+ JSX transform: no need to import React
  jsxA11y.flatConfigs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactHooks.configs.recommended.rules, // rules-of-hooks (error), exhaustive-deps (warn)
      'react/prop-types': 'off', // this project does not use PropTypes
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Tests run in Node (and jsdom) and use Vitest imports.
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  // Config files run in Node.
  {
    files: ['*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
]
