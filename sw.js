const CACHE_NAME = "aio-digital-mall-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", event => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );

});

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys =>

      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )

    ).then(() => self.clients.claim())

  );

});

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(

    fetch(request)

      .then(response => {

        const copy =
          response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, copy);
          });

        return response;
      })

      .catch(() => {

        return caches.match(request)
          .then(cached => {

            return cached ||
              caches.match("./index.html");

          });

      })

  );

});