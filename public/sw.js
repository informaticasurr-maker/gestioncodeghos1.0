// Service Worker for ORDEN DE TRABAJO IA PWA Offline Support
const CACHE_NAME = 'orden-de-trabajo-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin or static assets
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Google Drive API / OAuth network calls from cache
  if (url.origin.includes('googleapis.com') || url.origin.includes('accounts.google.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // If network is offline, serve from cache
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return cache.match('/index.html') || cache.match('/');
            }
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
        });
    })
  );
});

