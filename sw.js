const CACHE='rallyboard-shell-v2-18';
const FILES=['./','./index.html','./style.css','./app.mjs','./model.mjs','./cloud.mjs','./access.mjs?v=18','./viewer-ui.mjs?v=18','./match-ui.mjs?v=18','./club-logo.png','./dashboard.mjs?v=18','./schedule.mjs?v=18','./schedule-data.mjs?v=18','./wvv-parser.mjs?v=18','./app.mjs?v=18','./analytics.mjs?v=18','./stats.mjs?v=18','./model.mjs?v=18','./cloud.mjs?v=18','./style.css?v=18','./field.html','./field.css?v=18','./matchday.css?v=18','./field-host.mjs?v=18','./field-match.mjs?v=18','./field-report.mjs?v=18','./rally-model.mjs?v=rally6','./rally-view.mjs?v=rally6','./rally-lab.mjs?v=18','./rally.css?v=rally6','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rallyboard-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});



