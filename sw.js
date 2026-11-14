const CACHE='rallyboard-shell-v2-14';
const FILES=['./','./index.html','./style.css','./app.mjs','./model.mjs','./cloud.mjs','./dashboard.mjs?v=14','./schedule.mjs?v=14','./schedule-data.mjs?v=14','./wvv-parser.mjs?v=14','./app.mjs?v=14','./analytics.mjs?v=14','./stats.mjs?v=14','./model.mjs?v=14','./cloud.mjs?v=14','./style.css?v=14','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rallyboard-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});



