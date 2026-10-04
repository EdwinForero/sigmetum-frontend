import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Las reglas de accesibilidad y de calidad se dejan como avisos (warn) para no bloquear el código
// existente, pero el número de avisos no puede crecer: ver `--max-warnings` en el script `lint`
// de package.json. Al corregir deuda, se baja ese número. Ver docs/guias/buenas-practicas-frontend.md.
const warnAll = (rules) => Object.fromEntries(Object.keys(rules).map((name) => [name, 'warn']));

export default [
  { ignores: ['dist/**', 'node_modules/**', '.playwright-mcp/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'scripts/**/*.mjs', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...warnAll(jsxA11y.flatConfigs.recommended.rules),
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(_|React$)' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'react/no-danger': 'error',
      'react/jsx-no-target-blank': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['src/**/*.test.js', 'src/setupTests.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
];
