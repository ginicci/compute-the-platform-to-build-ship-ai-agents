import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return { id: '/assistant', name: 'Ginicci', short_name: 'Ginicci', description: 'Your Ginicci AI assistant', start_url: '/assistant', scope: '/', display: 'standalone', background_color: '#0a0a0a', theme_color: '#0a0a0a', icons: [
    { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/pwa/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ] }
}
