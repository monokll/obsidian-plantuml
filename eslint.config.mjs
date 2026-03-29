// eslint.config.mjs
import { defineConfig } from 'eslint/config' // ← new recommended helper
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default defineConfig([
  eslint.configs.recommended,

  ...tseslint.configs.strictTypeChecked, // or .recommendedTypeChecked if you prefer less strict

  // Global ignores (preferred as first item)
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.js', // skip plain JS if you want
      '**/*.d.ts',
      '**/*.config.*', // optional: most config files
    ],
  },

  // TypeScript-specific block
  {
    files: ['**/*.ts', '**/*.tsx'],

    languageOptions: {
      parserOptions: {
        project: true, // auto-discovers closest tsconfig.json
        // or explicitly: project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // Common relaxations — strictTypeChecked is quite opinionated
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Often disabled or warned in real apps
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // These are very strict — disable if too noisy
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',

      // Add more overrides here as needed
    },
  },
])
