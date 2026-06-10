module.exports = {
  root: true,
  // `universe/native` carries the high-value rules (react-hooks, no-unused-vars, radix).
  // We intentionally omit `universe/shared/typescript-analysis`: its type-aware stylistic
  // rules (prefer-nullish-coalescing / prefer-optional-chain) have unsafe autofixes for a
  // codebase that intentionally relies on falsy-coalescing fallbacks (`value || default`).
  extends: ['universe/native'],
  rules: {
    // Formatting is handled by the `format` script (Prettier), not lint — keeps
    // `npm run lint` focused on real code issues rather than whitespace noise.
    'prettier/prettier': 'off',
    'import/order': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Console is stripped from production by babel; warn in dev to keep it intentional.
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['node_modules/', '.expo/', 'babel.config.js', 'app.config.js'],
};
