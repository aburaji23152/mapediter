// Service Worker (sw.js)
const CACHE_NAME = 'japan-map-paint-pwa-v1.1.5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://unpkg.com/leaflet-image@0.4.0/leaflet-image.js',
  'https://unpkg.com/lucide@latest'
];

// インストール処理（新バージョンの即時待機解除）
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 新しいSWをすぐに有効化
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // 一部アセットの取得に失敗してもインストールを続行
      });
    })
  );
});

// アクティベート処理（古いキャッシュの全削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // 制御権を即座に確保
  );
});

// フェッチ処理 (ネットワーク優先・オフライン時キャッシュ)
self.addEventListener('fetch', (event) => {
  // GETリクエスト以外はそのままネットワークへ
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 自ドメイン（HTML/JSON等）は Network First で常に最新を取得
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
    );
  } else {
    // 外部CDN等は Cache First（キャッシュ優先）
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
