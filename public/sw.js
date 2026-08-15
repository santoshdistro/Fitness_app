/* Service worker: push reminders + offline app shell. Dependency-free.
   Strategy:
   - Navigations (HTML): network-first, cache the fresh shell, fall back to the
     cached shell (then the offline page) when offline — so the app opens with
     no connection and never serves a stale shell while online.
   - Same-origin build assets (/assets/*, hashed & immutable): cache-first.
   - Other same-origin files (icons, manifest): stale-while-revalidate.
   - Cross-origin (Supabase API, remote images): left to the network. */

const CACHE = 'fb-cache-v2';
const OFFLINE_URL = '/offline.html';
const SHELL_URL = '/';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([SHELL_URL, OFFLINE_URL])));
  self.skipWaiting();
});

// Drop caches from older versions and take control of open pages.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function cachePut(request, response) {
  const clone = response.clone();
  caches.open(CACHE).then(cache => cache.put(request, clone));
  return response;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // App shell / navigations: network-first → cached shell → offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => cachePut(SHELL_URL, res))
        .catch(() => caches.match(SHELL_URL).then(hit => hit || caches.match(OFFLINE_URL))),
    );
    return;
  }

  if (!sameOrigin) return; // Supabase / remote images: network handles it.

  // Hashed build assets are immutable — serve from cache, fetch once.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => cachePut(req, res))),
    );
    return;
  }

  // Other same-origin files: serve cached immediately, refresh in background.
  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => cachePut(req, res))
        .catch(() => hit);
      return hit || net;
    }),
  );
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { title: 'Fitness', body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || 'Fitness';
  const options = {
    body: payload.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.tag || 'fitness-reminder',
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    }),
  );
});
