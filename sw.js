const CACHE='gregfit-v3-1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./assets/icons/icon.svg',
'./assets/illustrations/march.svg','./assets/illustrations/swing.svg','./assets/illustrations/press.svg',
'./assets/illustrations/squat.svg','./assets/illustrations/row.svg','./assets/illustrations/rdl.svg',
'./assets/illustrations/deadbug.svg','./assets/illustrations/plank.svg','./assets/illustrations/carry.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request))));
