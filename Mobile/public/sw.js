// Service worker tối giản cho PWA "Thêm vào màn hình chính".
// KHÔNG cache gì: mọi request đi thẳng ra mạng → luôn chạy bản mới nhất sau mỗi lần build/deploy.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Không gọi event.respondWith → trình duyệt tự xử lý request như bình thường.
});
