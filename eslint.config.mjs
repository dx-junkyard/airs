import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import storybook from 'eslint-plugin-storybook';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'storybook-static/**', 'tmp/**'],
  },
  ...nextCoreWebVitals,
  ...storybook.configs['flat/recommended'],
  {
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app/globals.css',
      },
    },
    rules: {
      // React Compiler rules - downgrade from error to warn for legitimate patterns
      // These patterns are used intentionally for syncing derived state from props
      // and for syncing with external systems (window size, map state)
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      // Import rules
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                '相対パス(../)でのインポートは禁止です。絶対パス(@/)を使用してください。',
            },
          ],
        },
      ],
      // Stylistic rules (warn)
      'better-tailwindcss/enforce-consistent-class-order': 'warn',
      'better-tailwindcss/enforce-consistent-important-position': 'warn',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'warn',
      'better-tailwindcss/enforce-consistent-variable-syntax': 'warn',
      'better-tailwindcss/enforce-shorthand-classes': 'warn',
      'better-tailwindcss/no-duplicate-classes': 'warn',
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      // Correctness rules (error)
      'better-tailwindcss/no-conflicting-classes': 'error',
      // Note: no-unregistered-classes disabled because allowlist doesn't support
      // Digital Agency Design System custom classes (text-std-*, text-dns-*, text-oln-*,
      // text-mono-*, desktop:*, rounded-[0-9]+, etc.)
      'better-tailwindcss/no-unregistered-classes': 'off',
    },
  },
  // TimelineLayer uses intentional useEffect+setState patterns for syncing with external systems
  {
    files: ['src/features/map/extensions/TimelineLayer.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
