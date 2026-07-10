// ちびクエ Service Worker — 完全オフライン対応
// 更新時は CACHE_VERSION の数字を上げる（古いキャッシュは activate で削除される）
const CACHE_VERSION = "chibi-quest-v22";

// アプリの土台を先読みキャッシュ（初回インストール時）。
// 問題データ・サッカーデータ・アイコンは、初回のオンライン表示時に
// runtime キャッシュ（下の fetch ハンドラ）へ自動で貯まる。
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./src/app.js?v=22",
  "./src/styles.css?v=22",
  "./src/curriculum.js?v=22",
  "./src/storage.js?v=22",
  "./src/data/questions/grade3/math/questions.js",
  "./src/data/questions/grade3/japanese/questions.js",
  "./src/data/questions/grade3/social/questions.js",
  "./src/data/questions/grade3/english/questions.js",
  "./src/data/questions/grade3/science/questions.js",
  "./src/data/soccer/players.js?v=22"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // cache-first: あればキャッシュ、なければ取得してキャッシュに追加。
  // これにより、一度オンラインで開けば全ファイルが貯まり、以降は機内モードでも動く。
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // オフラインで未キャッシュのナビゲーションは index.html を返す
          if (request.mode === "navigate") return caches.match("./index.html");
          return undefined;
        });
    })
  );
});
