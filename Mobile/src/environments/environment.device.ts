// Bản cài lên điện thoại (npm run build:device): điện thoại gọi backend qua IP Wi-Fi của máy chạy backend.
// Đổi IP nếu máy đổi mạng. Backend phải nghe trên mọi địa chỉ:  dotnet run --urls http://0.0.0.0:5108
export const environment = {
  production: true,
  apiBaseUrl: 'http://192.168.1.41:5108/api',
  serverUrl: 'http://192.168.1.41:5108',
  // Thiết bị thật có safe-area riêng → không giả lập
  simulateSafeArea: false,
};
