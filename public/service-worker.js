// Basic service worker for offline support (without “stuck on old UI” issues).

// ✅ Bump version so old caches are cleared on user devices
const CACHE_NAME = "tinysteps-cache-v3";

const PRECACHE_URLS = ["/site.webmanifest", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // ✅ Don’t interfere with cross-origin requests (CDNs, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // ✅ Best way to detect SPA navigations
  const isNavigation = event.request.mode === "navigate";
  const accept = event.request.headers.get("accept") || "";
  const isHtmlRequest = isNavigation || accept.includes("text/html");

  // ✅ Network-first for HTML/navigation so latest deploy loads without hard refresh
  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache ONLY the app shell for offline fallback (avoid caching /courses, /pricing separately)
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("/index.html", networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() =>
          caches.match("/index.html").then((resp) => resp || caches.match("/offline.html"))
        )
    );
    return;
  }

  // ✅ Cache-first for same-origin assets (fast + offline)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => caches.match("/offline.html"));
    })
  );
});
