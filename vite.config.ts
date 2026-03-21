import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: false, type: 'module' },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
          runtimeCaching: [
            {
              urlPattern: /\/(citizen|track)/,
              handler: 'NetworkFirst',
              options: { cacheName: 'pscrm-pages' }
            }
          ]
        },
        manifest: {
          name: 'PS-CRM',
          short_name: 'PSCRM',
          theme_color: '#111827',
          background_color: '#111827',
          display: 'standalone',
          start_url: '/'
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': 'http://localhost:3001',
        '/socket.io': {
          target: 'ws://localhost:3001',
          ws: true
        }
      },
      allowedHosts: true
    },
    build: {
      outDir: 'public',
      emptyOutDir: true
    }
  };
});
