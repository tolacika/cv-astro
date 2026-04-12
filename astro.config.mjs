// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { llmContextIntegration } from './src/lib/llm-integration.js';

// https://astro.build/config
export default defineConfig({
  site: "https://tolacika.github.io",
  output: "static",
  build: {
    format: 'file',
  },
  vite: {
    plugins: [tailwindcss()]
  },
  server: {
    port: 3000,
    host: true,
  },
  integrations: [
    llmContextIntegration(),
  ],
});