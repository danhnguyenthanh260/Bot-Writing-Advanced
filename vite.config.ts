import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      ssr: {
        noExternal: [],
        external: ['pg', 'pg-native'],
      },
      build: {
        rollupOptions: {
          external: (id) => {
            // Exclude Node.js built-in modules and pg from client bundle
            const nodeModules = [
              'pg', 'pg-native', 'events', 'util', 'crypto', 'stream', 
              'buffer', 'path', 'fs', 'os', 'net', 'tls', 'dns', 
              'http', 'https', 'url', 'zlib', 'querystring'
            ];
            return nodeModules.some(mod => id === mod || id.startsWith(`${mod}/`));
          },
        },
      },
      optimizeDeps: {
        exclude: ['pg', 'pg-native'],
      },
    };
});
