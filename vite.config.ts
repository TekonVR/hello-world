import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so a build works from any path on any static host.
  base: './',
  server: { port: 5173, host: true },
  build: { outDir: 'dist', sourcemap: true },
});
