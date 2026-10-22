# App iPhone — cách miễn phí

Apple chỉ cho phát app iPhone tới người khác (App Store / TestFlight) khi có tài khoản **Apple Developer (99 USD/năm)**. Không trả phí thì có hai cách:

## 1. Cho mọi người dùng iPhone: PWA (khuyên dùng)

Mở `https://vietphuong.burmilla-porbeagle.ts.net` bằng **Safari**. Trang tự chuyển sang giao diện điện thoại. Sau đó bấm **Chia sẻ** → **Thêm vào MH chính**.

Biểu tượng VietPhuong sẽ có trên màn hình chính, mở lên chạy toàn màn hình như app. Bản mới tự cập nhật, không cần cài lại.

## 2. App thật trên chính iPhone của bạn (cần mượn máy Mac)

Miễn phí với Apple ID thường, nhưng có giới hạn:
- App **hết hạn sau 7 ngày**, phải cắm máy chạy lại.
- Tối đa **3 thiết bị**.
- **Không phát** được cho người khác.

Trên máy Mac (đã cài Xcode từ App Store và CocoaPods):

```bash
git clone https://github.com/thuphuong21072004-sketch/Vietnamese.git
cd Vietnamese/Mobile
npm ci
npm run build:device          # API = environment.device.ts (địa chỉ ts.net)
npx cap sync ios
cd ios/App && pod install && open App.xcworkspace
```

Trong Xcode:
1. Chọn target **App** → tab **Signing & Capabilities** → **Team**: chọn Apple ID của bạn (Personal Team). Nếu `com.vietphuong.app` bị trùng thì đổi Bundle Identifier, ví dụ `com.<ten-ban>.vietphuong`.
2. Cắm iPhone bằng cáp → chọn iPhone ở thanh trên → bấm **Run (▶)**.
3. Trên iPhone: **Cài đặt → Cài đặt chung → Quản lý VPN & thiết bị** → tin cậy Apple ID của bạn → mở app.

Đã cấu hình sẵn trong `ios/App/App/Info.plist`:
- Quyền micro (chấm phát âm).
- Cho phép gọi backend HTTP trong mạng LAN.

Giới hạn trên iOS: sau khi thanh toán Stripe, app chưa tự quay lại được. Muốn quay lại cần universal link trên tên miền riêng.
