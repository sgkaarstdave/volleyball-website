const CACHE='rallyboard-shell-v2-16';
const FILES=['./','./index.html','./style.css','./app.mjs','./model.mjs','./cloud.mjs','./access.mjs?v=16','./viewer-ui.mjs?v=16','./match-ui.mjs?v=16','./club-logo.png','./dashboard.mjs?v=16','./schedule.mjs?v=16','./schedule-data.mjs?v=16','./wvv-parser.mjs?v=16','./app.mjs?v=16','./analytics.mjs?v=16','./stats.mjs?v=16','./model.mjs?v=16','./cloud.mjs?v=16','./style.css?v=16','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rallyboard-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});



