// @ts-check
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import { flatConfigs as importXFlatConfigs } from 'eslint-plugin-import-x';

export default tseslint.config(
  // Ignore generated/vendor output
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      'tests/fixtures/**',
    ],
  },

  // Global settings (react version for all files using react plugin)
  {
    settings: {
      react: { version: 'detect' },
    },
  },

  // JS/MJS/CJS config and script files — syntax check only, no type info
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [tseslint.configs.base],
  },

  // TypeScript source files — type-aware rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: {
          // Allow test fixtures to be linted without a dedicated tsconfig
          allowDefaultProject: ['tests/fixtures/*.ts'],
          defaultProject: 'tsconfig.base.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  },

  // packages/markmd override: switch to explicit project so test files are included.
  // packages/markmd/tsconfig.json excludes tests/ (correct for publishing), so we
  // use tsconfig.eslint.json which re-includes tests for type-aware linting.
  {
    files: ['packages/markmd/**/*.ts', 'packages/markmd/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './packages/markmd/tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React rules for all TS/TSX/JSX files
  reactPlugin.configs.flat.recommended,
  reactHooksPlugin.configs['recommended-latest'],
  jsxA11yPlugin.flatConfigs.recommended,
  importXFlatConfigs.recommended,

  // packages/* overrides (placeholder — filled by task_04+)
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    rules: {},
  },

  // apps/playground override: use explicit tsconfig so tests/ are included
  {
    files: ['apps/playground/**/*.ts', 'apps/playground/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './apps/playground/tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Final overrides — applied last so they win over plugin defaults
  {
    rules: {
      // React 17+ JSX transform does not require React to be in scope
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // TypeScript's own resolver handles TS/TSX imports; import-x misfires on .tsx paths
      'import-x/no-unresolved': 'off',
    },
  },
);
