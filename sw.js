const CACHE_NAME = 'osopardo-v1';
const urlsToCache = [
    '/OsoPardoApp/',
    '/OsoPardoApp/index.html',
    '/OsoPardoApp/css/styles.css',
    '/OsoPardoApp/js/api.js',
    '/OsoPardoApp/js/Autentificacion.js',
    '/OsoPardoApp/js/app.js',
    '/OsoPardoApp/manifest.json',
    '/OsoPardoApp/icons/logo-192.png',
    '/OsoPardoApp/icons/logo-512.png'
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

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});