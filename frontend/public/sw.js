// Cache disabled project-wide. This service worker is intentionally a no-op
// that simply passes every request straight to the network. It exists only to
// override any previously installed worker (which still lives in users'
// browsers) and to unregister itself on activation.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Wipe every cache the old worker may have populated.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // Tell the browser to stop using us entirely on the next load.
      if (self.registration.unregister) {
        try {
          await self.registration.unregister();
        } catch (_) {
          // best effort
        }
      }
      if (self.clients && self.clients.matchAll) {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          if (client.navigate) {
            client.navigate(client.url);
          }
        }
      }
    })(),
  );
});

// Hard pass-through: never read from cache, never write to cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
