// Các service dùng chung (chép từ Fontend vào src/app/web bởi scripts/sync-web.mjs) cũng đọc file này.
// Chạy trên điện thoại thật: đổi localhost thành IP LAN của máy chạy backend.
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5108/api',
  serverUrl: 'http://localhost:5108',
  // Xem trên trình duyệt: chừa khoảng status bar / home indicator như artboard (iOS 50/34, Android 28/16)
  simulateSafeArea: true,
};
