import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 8888,
    allowedHosts: ['minigame.teqcon.uk', 'localhost', '167.179.88.55'],
  },
  preview: {
    host: true,
    port: 8888,
    allowedHosts: ['minigame.teqcon.uk', 'localhost', '167.179.88.55'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
