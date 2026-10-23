const C="bdi-v2";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>clients.claim())));
self.addEventListener("fetch",e=>{ if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin) return;
 e.respondWith(caches.open(C).then(async c=>{ try{ const r=await fetch(e.request); c.put(e.request,r.clone()); return r; }catch(err){ const m=await c.match(e.request); if(m) return m; throw err; } })); });
