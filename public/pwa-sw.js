// Never cache navigation, authenticated responses, APIs or conversations.
const CACHE = 'ginicci-public-shell-v1';
const STATIC = ['/pwa/offline.html', '/pwa/icon-192.png', '/pwa/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC))));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  if (STATIC.includes(url.pathname)) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  else if (e.request.mode === 'navigate' && url.pathname === '/assistant') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/pwa/offline.html')));
  }
});
