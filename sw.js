// A progressive web app (PWA) service worker for the Family Nest app.
// This version adjusts the list of URLs to cache based on the service worker's
// current location. When hosted in a subfolder (e.g. /familynest/ on GitHub Pages),
// using absolute paths (like '/index.html') would break caching. Instead, we
// derive the scope from self.location and prefix each asset with that path.

const CACHE_NAME = 'family-nest-cache-v2';

// Determine the scope (the directory where the service worker lives). This ensures
// cached URLs are correctly prefixed even when the app is hosted in a subfolder.
const scope = self.location.pathname.replace(/[^\/]+$/, '');

// Files we want to cache for offline access. All paths are relative to the scope.
const urlsToCache = [
  scope,
  `${scope}index.html`,
  `${scope}style.css`,
  `${scope}script.js`,
  `${scope}manifest.json`,
  `${scope}icons/house-192.png`,
  `${scope}icons/house-512.png`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Remove old caches on activation
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
