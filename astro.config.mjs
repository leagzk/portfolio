import { defineConfig } from 'astro/config';

export default defineConfig({
  // Sortie statique : Vercel sert directement le dossier dist/
  output: 'static',
  build: { format: 'directory' },
});
