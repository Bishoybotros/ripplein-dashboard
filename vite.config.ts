import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base = './' so the build works on any GitHub Pages path
// (user.github.io/repo-name/) without extra configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
});
