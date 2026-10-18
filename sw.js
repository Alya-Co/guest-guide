// Offline cache for the guest guide: after the first visit every page opens without internet.
const CACHE = "guest-guide-v1";
const CORE = ["./", "index.html", "demo-classic.html", "demo-journal.html", "demo-minimal.html", "demo-app.html",
  "img-classic.png", "img-journal.png", "img-minimal.png", "img-app.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Pages: fresh copy when online, saved copy when offline.
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("index.html"))));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    // Fonts: saved copy first.
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
