// Bản web của giao diện mobile (npm run build:web) — backend phục vụ ở /m, cùng địa chỉ với web cũ
// (vd https://vietphuong.burmilla-porbeagle.ts.net/m) → gọi API bằng đường dẫn tương đối như web cũ.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  serverUrl: '',
  // Điện thoại thật có safe-area riêng → không giả lập
  simulateSafeArea: false,
};
