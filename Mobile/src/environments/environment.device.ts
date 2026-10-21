// Bản cài lên điện thoại (npm run build:device): gọi backend qua địa chỉ HTTPS công khai (Tailscale Funnel)
// → dùng được ở mọi nơi có Internet, miễn máy chạy backend + Tailscale đang bật.
// Thử trong mạng LAN thay vì ts.net: đổi thành 'http://<IP Wi-Fi của máy>:5108' và chạy backend với
//   dotnet run --urls http://0.0.0.0:5108
export const environment = {
  production: true,
  apiBaseUrl: 'https://vietphuong.burmilla-porbeagle.ts.net/api',
  serverUrl: 'https://vietphuong.burmilla-porbeagle.ts.net',
  // Thiết bị thật có safe-area riêng → không giả lập
  simulateSafeArea: false,
};
