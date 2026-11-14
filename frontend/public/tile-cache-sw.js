const CACHE_NAME = "terr-analog-map-tiles-v1";

const TILE_HOSTS = new Set([
  "services.arcgisonline.com",
  "server.arcgisonline.com",
  "s3.amazonaws.com",
  "gibs.earthdata.nasa.gov",
  "tiles.openfreemap.org",
]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("terr-analog-map-tiles-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  const isTileHost = TILE_HOSTS.has(url.hostname);
  const isLocalWorker = url.pathname === "/maplibre-gl-worker.mjs";

  if (!isTileHost && !isLocalWorker) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && (response.status === 200 || response.type === "opaque")) {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (err) {
        if (cached) return cached;
        throw err;
      }
    })
  );
});
