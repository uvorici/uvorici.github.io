const CACHE_NAME = 'raspored-profesora-v21';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/App.jsx',
  '/src/main.jsx',
  '/src/index.css',
  '/src/App.css',
  '/src/raspored_profesora.json',
  '/src/raspored_odjeljenja.json',
  '/src/components/Breadcrumbs.jsx',
];

self.addEventListener('install', (event) => {
  console.debug('[SW] init');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.debug('[SW] cache:init');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] err:init', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.debug('[SW] active');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.debug('[SW] cache:purge', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.debug('[SW] cache:hit', event.request.url);
          return response;
        }
        
        console.debug('[SW] cache:miss', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.debug('[SW] cache:store', event.request.url);
              });
            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] err:fetch', event.request.url, error);
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
}); 