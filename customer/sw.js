// ============================================================
// AIO DIGITAL MALL
// CUSTOMER SERVICE WORKER
// ============================================================

const CACHE_NAME = "aio-digital-mall-customer-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json"
];


// ============================================================
// INSTALL
// ============================================================

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(APP_FILES);

      })

  );

  self.skipWaiting();

});


// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(cacheNames => {

      return Promise.all(

        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))

      );

    })

  );

  self.clients.claim();

});


// ============================================================
// FETCH
// ============================================================

self.addEventListener("fetch", event => {

  const request = event.request;

  // Firebase / API requests ko cache mat karo
  if (
    request.url.includes("firebaseio.com") ||
    request.url.includes("googleapis.com") ||
    request.url.includes("gstatic.com")
  ) {
    return;
  }

  event.respondWith(

    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(networkResponse => {

            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type === "opaque"
            ) {
              return networkResponse;
            }

            const responseClone =
              networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });

            return networkResponse;

          })
          .catch(() => {

            // Offline hone par index page
            return caches.match("./index.html");

          });

      })

  );

});


// ============================================================
// UPDATE SERVICE WORKER
// ============================================================

self.addEventListener("message", event => {

  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {

    self.skipWaiting();

  }

});
