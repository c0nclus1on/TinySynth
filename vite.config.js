import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5191, strictPort: false, open: false },
  preview: { port: 5191 },
});
