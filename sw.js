const CACHE='rallyboard-shell-v2-17';
const FILES=['./','./index.html','./style.css','./app.mjs','./model.mjs','./cloud.mjs','./access.mjs?v=17','./viewer-ui.mjs?v=17','./match-ui.mjs?v=17','./club-logo.png','./dashboard.mjs?v=17','./schedule.mjs?v=17','./schedule-data.mjs?v=17','./wvv-parser.mjs?v=17','./app.mjs?v=17','./analytics.mjs?v=17','./stats.mjs?v=17','./model.mjs?v=17','./cloud.mjs?v=17','./style.css?v=17','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rallyboard-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});



