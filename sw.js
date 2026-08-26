/**
 * sw.js — Offline PWA Service Worker for Virtual Analytical Lab
 *
 * Caching strategy:
 *   • HTML / CSS / JS  → Network-First (fresh code, fall back to cache if offline)
 *   • JSON datasets / images → Cache-First (truly static, safe to cache long-term)
 *
 * Bump CACHE_NAME version whenever you want to force all clients to re-fetch
 * everything (e.g., after a Design System token update).
 */

const CACHE_NAME = 'analytical-lab-v2';

// Assets that are safe to serve from cache indefinitely
const STATIC_ASSETS = [
  '/instruments/hplc/data/samples.json',
  '/instruments/uvvis/data/manifest.json',
  '/instruments/ftir/data/samples.json',
  '/instruments/gc/data/samples.json',
  '/manifest.webmanifest',
];

// Dynamic assets — always try network first, cache only as offline fallback
const DYNAMIC_ASSETS = [
  '/',
  'index.html',
  'css/global.css',
  'core/PluginRegistry.js',
  'core/ManifestValidator.js',
  'platform/graph/ScientificGraphEngine.js',
  'platform/graph/adapters/ChromatogramAdapter.js',
  'platform/graph/adapters/SpectrumAdapter.js',
  'platform/graph/adapters/CalibrationAdapter.js',
  'platform/graph/adapters/InterferogramAdapter.js',
  'platform/common/format.js',
  'platform/common/math.js',
  'platform/education/EducationalFramework.js',
  'instruments/hplc/index.html',
  'instruments/uvvis/index.html',
  'instruments/ftir/index.html',
  'instruments/gc/index.html',
];

// ── Install: pre-cache everything ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([...DYNAMIC_ASSETS, ...STATIC_ASSETS].filter(Boolean))
        .catch((err) => console.warn('[SW] Pre-cache partial failure:', err))
    )
  );
  self.skipWaiting();
});

// ── Activate: delete ALL old caches ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-First for HTML/CSS/JS, Cache-First for static data ──────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isStatic = STATIC_ASSETS.some((a) => url.pathname === a)
    || url.pathname.match(/\.(png|jpg|svg|ico|woff2?)$/);

  if (isStatic) {
    // Cache-First: static data / images
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
      )
    );
  } else {
    // Network-First: HTML, CSS, JS — always try live, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached || caches.match('/instruments/hplc/index.html')
          )
        )
    );
  }
});

