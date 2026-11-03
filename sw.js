/* Encrypted library files (*.dat) are fetched as name.dat?v=<content hash>: serve them from the cache and keep only the newest version of each. Everything else: network first, cache as offline fallback. */
const C = "bdi-v4";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  /* videos are streamed with range requests, which the cache cannot store: leave them to the browser */
  if (req.method !== "GET" || url.origin !== location.origin || req.headers.has("range") || /\.(mp4|webm|mov)$/.test(url.pathname)) return;
  if (/\.dat$/.test(url.pathname)){
    e.respondWith(caches.open(C).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req);
      if (r.ok){
        const old = (await c.keys()).filter(k => new URL(k.url).pathname === url.pathname);
        await Promise.all(old.map(k => c.delete(k)));
        await c.put(req, r.clone());
      }
      return r;
    }));
    return;
  }
  /* network first; on a slow connection fall back to the saved copy after 4 s instead of waiting */
  e.respondWith(caches.open(C).then(async c => {
    const saved = await c.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
    if (!saved) return net;
    return Promise.race([net.catch(() => saved), new Promise(res => setTimeout(() => res(saved), 4000))]);
  }));
});
