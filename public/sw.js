/* Service worker for push reminders + an offline fallback. Dependency-free. */

const OFFLINE_CACHE = 'fb-offline-v1';
const OFFLINE_URL = '/offline.html';

// Precache the offline fallback page on install.
self.addEventListener('install', event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

// Drop any stale offline caches and take control of open pages.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== OFFLINE_CACHE).map(k => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Network-first for page navigations; if the network is unavailable, show the
// cached offline screen instead of the browser's error page. Other requests
// (assets, API calls) are left untouched.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode !== 'navigate') return;
  event.respondWith(
    fetch(req).catch(() => caches.open(OFFLINE_CACHE).then(cache => cache.match(OFFLINE_URL))),
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
