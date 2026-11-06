// Service Worker:離線快取。改完任何檔案後執行 python3 tools/build_sw.py,會自動更新清單與版本號。
const VERSION = '20261106-100733';
const CACHE = 'shaorou-' + VERSION;
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './style.css',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './js/main.js',
  './js/core/assets.js',
  './js/core/audio.js',
  './js/core/engine.js',
  './js/core/fx.js',
  './js/core/input.js',
  './js/core/save.js',
  './js/core/screen.js',
  './js/core/sprite.js',
  './js/core/state.js',
  './js/core/ui.js',
  './js/data/levels.js',
  './js/data/sprites.js',
  './js/minigames/base.js',
  './js/minigames/cadence.js',
  './js/minigames/foldBlanket.js',
  './js/minigames/grenade.js',
  './js/minigames/index.js',
  './js/minigames/prepFood.js',
  './js/minigames/shoot.js',
  './js/minigames/sortWaste.js',
  './js/scenes/dev.js',
  './js/scenes/ending.js',
  './js/scenes/flow.js',
  './js/scenes/minigame.js',
  './js/scenes/story.js',
  './js/scenes/title.js',
  './js/scenes/weekend.js',
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
