// @ts-check
import { defineConfig } from 'astro/config';

import pdf from 'astro-pdf'
import tailwindcss from '@tailwindcss/vite';
import { pdfOptions } from './src/lib/pdf.js';

// https://astro.build/config
export default defineConfig({
  site: "https://tolacika.dev/",
  output: "static",
  build: {
    format: 'file',
  },
  vite: {
    build: {
      cssCodeSplit: true,
    },
    plugins: [tailwindcss()]
  },
  server: ({command}) => ({
    port: 3000,
    host: command === "dev" ? true : "localhost",
  }),
  integrations: [
    pdf(pdfOptions),
  ],
});