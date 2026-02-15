import { heroui } from '@heroui/react';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Custom theme extensions can be added here
    },
  },
  // Note: Tailwind v4 has different plugin architecture
  // @digital-go-jp/tailwind-theme-plugin は src/styles/design-tokens.css で @theme として定義
  plugins: [
    heroui(), // Needs v4 compatibility check
    require('@tailwindcss/container-queries'), // Needs v4 compatibility check
  ],
};
export default config;
