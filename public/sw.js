const CACHE_NAME = 'tailor-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch to prevent failure if some resources are not available yet
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => console.log('Failed to cache', url, err));
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(response => {
        // Cache dynamic responses for later offline use
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Fallback for failed requests (e.g. offline)
        return new Response('Офлайн режим. Подключитесь к сети для использования ИИ.');
      });
    })
  );
});
