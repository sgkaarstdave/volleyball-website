const CACHE='rallyboard-shell-v2-20';
const FILES=['./','./index.html','./style.css','./app.mjs','./model.mjs','./cloud.mjs','./access.mjs?v=19','./viewer-ui.mjs?v=19','./match-ui.mjs?v=19','./club-logo.png','./dashboard.mjs?v=19','./schedule.mjs?v=19','./schedule-data.mjs?v=19','./wvv-parser.mjs?v=19','./app.mjs?v=20','./analytics.mjs?v=19','./stats.mjs?v=20','./model.mjs?v=19','./cloud.mjs?v=19','./style.css?v=19','./field.html','./field.css?v=19','./matchday.css?v=19','./field-host.mjs?v=20','./field-match.mjs?v=20','./field-report.mjs?v=20','./rally-model.mjs?v=rally8','./rally-view.mjs?v=rally8','./rally-lab.mjs?v=20','./rally.css?v=rally8','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rallyboard-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});



