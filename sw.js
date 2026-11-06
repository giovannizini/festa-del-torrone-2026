// Cache per l'uso offline quando la pagina è pubblicata in HTTPS e aggiunta alla schermata Home.
const CACHE = "festa-del-torrone-2026-v2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Rete prima (per ricevere gli aggiornamenti), cache se la rete manca o è lenta (>3 s).
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).pathname.includes("/api/")) return;
  const fromCache = () => caches.match(req, {ignoreSearch: true}).then(m => m || caches.match("./index.html"));
  const fromNet = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const timeout = new Promise((_, rej) => setTimeout(rej, 3000));
  e.respondWith(Promise.race([fromNet, timeout]).catch(() => fromCache().then(m => m || fromNet)));
});
