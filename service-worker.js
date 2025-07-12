const CACHE_NAME = 'sleep-monitor-v1';
const urlsToCache = [
  './',
  './index.html',
  './monitor.html',
  './history.html',
  './settings.html',
  './register.html',
  './assets/index.css',
  './assets/monitor.css',
  './assets/history.css',
  './assets/settings.css',
  './assets/register.css',
  './script.js',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
