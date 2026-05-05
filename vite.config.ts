import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**'],
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
