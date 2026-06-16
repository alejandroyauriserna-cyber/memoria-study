/* MemoriaStudy PWA — offline básico (Home, Biblioteca, Organizadores) */

const CACHE_VERSION = "memoria-pwa-v1";
const PRECACHE = "memoria-precache-v1";
const RUNTIME = "memoria-runtime-v1";

const OFFLINE_URL = "/offline";

const PRECACHE_ASSETS = [
  "/",
  "/library",
  "/organizers",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icon.svg",
];

const OFFLINE_NAV_ROUTES = ["/", "/library", "/organizers"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME && key.startsWith("memoria-"))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/icon.svg"
  );
}

function canServeOffline(pathname) {
  return OFFLINE_NAV_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || !isSameOrigin(url)) return;

  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "Sin conexión." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && canServeOffline(url.pathname)) {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const runtime = await caches.open(RUNTIME);
          const cached = await runtime.match(request);
          if (cached) return cached;

          const precache = await caches.open(PRECACHE);
          if (canServeOffline(url.pathname)) {
            const fallback =
              (await precache.match(url.pathname)) ??
              (await precache.match(url.pathname.replace(/\/$/, ""))) ??
              (await runtime.match("/"));
            if (fallback) return fallback;
          }

          return (await precache.match(OFFLINE_URL)) ?? Response.error();
        }),
    );
  }
});
