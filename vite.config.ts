import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visorApiDev } from './server/devPlugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), visorApiDev()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
