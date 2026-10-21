import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vietphuong.app',
  appName: 'VietPhuong',
  webDir: 'dist/mobile/browser',
  server: {
    // Android chạy app ở http://localhost (thay vì https) để:
    //  - gọi được backend HTTP trong mạng LAN (không bị chặn mixed content),
    //  - backend StripeService nhận Origin http(s) → Stripe trả về http://localhost/my-bookings = chính app.
    androidScheme: 'http',
    cleartext: true,
    // Cho trang Stripe Checkout mở ngay trong WebView để sau thanh toán quay lại app
    allowNavigation: ['checkout.stripe.com', '*.stripe.com'],
  },
};

export default config;
