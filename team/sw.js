const CACHE_NAME =
  "aio-team-v1";

const FILES = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./dashboard-panel.html",
  "./app.js",
  "./firebaseConfig.js",
  "./manifest.json"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(
        CACHE_NAME
      ).then(
        cache =>
          cache.addAll(
            FILES
          )
      )

    );

    self.skipWaiting();

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      self.clients.claim()
    );

  }
);


self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method !==
      "GET"
    ) {
      return;
    }

    event.respondWith(

      caches.match(
        event.request
      ).then(
        cached =>
          cached ||
          fetch(event.request)
      )

    );

  }
);