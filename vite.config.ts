import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/icon.svg'],
      manifest: {
        name: 'VÁRZEA PRO', short_name: 'VÁRZEA PRO', lang: 'pt-BR',
        description: 'Treino de explosão e agilidade para o jogador de várzea.',
        start_url: '/app', scope: '/', display: 'standalone', orientation: 'portrait',
        background_color: '#0a0a0a', theme_color: '#0a0a0a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/functions\//],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          // Animações 3D (GLB), imagens e vídeos curtos próprios: cache-first para funcionar offline.
          { urlPattern: ({ url }) => /\.(glb|gltf|png|jpg|jpeg|webp|mp4|webm|pdf)$/i.test(url.pathname) || url.pathname.includes('/storage/v1/object/'),
            handler: 'CacheFirst',
            options: { cacheName: 'media', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 }, cacheableResponse: { statuses: [0, 200] } } },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1200 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
