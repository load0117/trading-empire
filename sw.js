/* 트레이딩 제국 — 서비스워커: network-first (온라인=최신, 오프라인=캐시 폴백).
   ⚠ cache-first로 하면 배포 후 업데이트가 유저에게 안 감 → network-first로 변경. */
const CACHE = "te-cache-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return; // 교차출처(향후 광고 등)는 가로채기 안 함
  // network-first: 최신을 먼저 가져오고 캐시에 갱신, 오프라인이면 캐시로 폴백
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
  );
});
