// Service Worker:離線快取。改了程式或素材後,把 VERSION 加 1,同袍重開就會更新。
const VERSION = 'v1';
const CACHE = 'shaorou-' + VERSION;
const CORE = [
  './', './index.html', './style.css', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './js/main.js',
  './js/core/engine.js', './js/core/save.js', './js/core/state.js', './js/core/ui.js', './js/core/assets.js',
  './js/data/levels.js',
  './js/minigames/index.js', './js/minigames/tapRun.js', './js/minigames/timing.js',
  './js/scenes/flow.js', './js/scenes/title.js', './js/scenes/story.js',
  './js/scenes/minigame.js', './js/scenes/weekend.js', './js/scenes/ending.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('shaorou-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// 快取優先;沒快取時上網抓,抓到的順便存起來(素材 png 不必手動列入清單)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
