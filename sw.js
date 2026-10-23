// Offline support: keeps a copy of the dashboard on the device.
// Online: always tries the newest version first (falls back to the saved copy after 4 s).
// Offline: opens the saved copy. Your data is never sent anywhere; it stays in the browser's storage.
const CACHE = 'rtw-app-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE), key = req.mode === 'navigate' ? './index.html' : req;
    try {
      const net = await Promise.race([fetch(req, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
      if (net && net.ok) cache.put(key, net.clone());
      return net;
    } catch (_) { return (await cache.match(key)) || (await cache.match(req)) || Response.error(); }
  })());
});
