/* Simple PWA service worker for Barbearia Dom Pedro
   - precaches core shell
   - cache-first for static assets
   - network-first for HTML
*/
const VERSION = 'v2';
const CACHE_CORE = `core-${VERSION}`;
const CACHE_ASSETS = `assets-${VERSION}`;

const CORE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_CORE).then((cache) => cache.addAll(CORE_URLS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (![CACHE_CORE, CACHE_ASSETS].includes(k)) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const isHTML = req.headers.get('accept')?.includes('text/html');
  const isAsset = url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/icons/')
    || url.pathname.endsWith('.css')
    || url.pathname.endsWith('.js')
    || url.pathname.endsWith('.png')
    || url.pathname.endsWith('.jpg')
    || url.pathname.endsWith('.jpeg')
    || url.pathname.endsWith('.webp')
    || url.pathname.endsWith('.svg')
    || url.pathname.endsWith('.woff2');

  // Network-first for navigations/HTML (keeps content fresh)
  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_CORE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match('/index.html');
      }
    })());
    return;
  }

  // Cache-first for static assets
  if (isAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_ASSETS);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return cached;
      }
    })());
  }
});
