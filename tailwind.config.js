import { skeleton } from '@skeletonlabs/tw-plugin';
import type { Config } from 'tailwindcss';

/** Tailwind configuration enabling Skeleton UI components. */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: { extend: {} },
  plugins: [skeleton()]
} satisfies Config;
