// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import db from '@astrojs/db';

export default defineConfig({
  site: 'https://divana.si',
  adapter: vercel(),
  integrations: [db()],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    locales: ['sl', 'en'],
    defaultLocale: 'sl',
    fallback: {
      en: 'sl',
    },
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
  },
});
