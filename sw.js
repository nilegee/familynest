// sw.js

const CACHE_NAME = 'family-hub-v1';
const URLS_TO_CACHE = [
  './index.html',
  './main.js',
  './style.css',
  './icons/default-avatar.svg',
  './icons/house-192.png',
  './icons/house-512.png',
  // Add more static assets if needed
];

// INSTALL: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        URLS_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn('SW: Failed to cache', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ACTIVATE: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// FETCH: serve from cache, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// NOTIFICATIONS: show notification when called by app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(winClients => {
      // Focus if open, else open
      for (let client of winClients) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Listen for push events (OPTIONAL, only if you implement push API)
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data.json(); } catch (e) {}
  const title = data.title || 'Notification';
  const body = data.body || '';
  event.waitUntil(
    self.registration.showNotification(title, { body })
  );
});
