import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { commentsPlugin } from './src/plugins/comments-plugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), commentsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 5173 },
});
