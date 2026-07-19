const CACHE='greg-kb-v1';
const FILES=['./','./index.html','./manifest.webmanifest','./assets/swing.png','./assets/press.png','./assets/goblet-squat.png','./assets/deadlift.png','./assets/carry.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
