// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import db from '@astrojs/db';

export default defineConfig({
  site: 'https://divana.si',
  adapter: node({ mode: 'standalone' }),
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
