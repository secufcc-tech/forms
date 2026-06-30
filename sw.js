/* Service Worker — Daily Attendance Sheet (PWA)
   Permite que la aplicación funcione sin conexión una vez abierta la primera vez.
   Si cambias index.html u otros archivos, sube la versión de CACHE (v1 -> v2 ...)
   para forzar la actualización en los dispositivos. */

var CACHE = 'daily-attendance-v1';

var ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png'
];

// Instalación: precachea los archivos de la app.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activación: borra cachés antiguas de versiones anteriores.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Estrategia: cache-first con respaldo de red.
// Para navegaciones offline, sirve index.html.
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        // Guarda en caché las respuestas válidas del mismo origen.
        try {
          if (res && res.status === 200 && res.type === 'basic') {
            var copy = res.clone();
            caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
          }
        } catch (e) {}
        return res;
      }).catch(function () {
        // Sin red: si es una navegación, devolver la app.
        if (req.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
