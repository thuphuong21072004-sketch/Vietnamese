# VietPhuong Mobile (Ionic 8 + Angular 18 + Capacitor 6)

App iPhone / Android dựng theo `design-mobile/`. Dùng chung API backend với web (`Fontend/`).

## Chạy

```bash
npm install
npm start          # http://localhost:8100 — backend phải chạy ở http://localhost:5108
npm run build      # → dist/mobile/browser (webDir của Capacitor)
```

`npm start` / `npm run build` tự chạy `scripts/sync-web.mjs`. Script này chép `Fontend/src/app/features/{services,models}` vào `src/app/web/` (thư mục bị gitignore, đừng sửa tay). Import bằng alias `@web/...`.

## Xem như iPhone / Android trên trình duyệt

- **iPhone:** khung 390×844, thêm `?ionic:mode=ios` vào URL.
- **Android:** khung 412×915, thêm `?ionic:mode=md` vào URL.

Khi chạy trên trình duyệt, `environment.simulateSafeArea` chừa sẵn khoảng status bar / home indicator như artboard (iOS 50/34, Android 28/16).

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/theme/tokens.css` | design token (README design §2) |
| `src/theme/ionic-overrides.css` | tab bar, nền theo module, khác biệt iOS/MD |
| `src/global.css` | lớp dùng chung: `.vp-card`, `.vp-btn--*`, `.vp-input`, `.vp-badge--*`, `.vp-chip`, `.vp-empty`… |
| `src/app/ui/` | component dùng chung: nav bar, avatar, badge (`status.ts` map trạng thái → màu), stat card, segmented, loading/empty |
| `src/app/core/` | auth (token, role, guard), interceptor, toast/confirm (`FeedbackService`), media URL |
| `src/app/shells/` | tab bar 5 mục theo vai trò |
| `src/app/pages/` | các màn, mỗi nhóm một thư mục có file `*.routes.ts` riêng (gộp trong `app.routes.ts`) |

**Màn theo nhóm** (`src/app/pages/`):

| Thư mục | Nhóm | Màn |
|---|---|---|
| `auth/`, `home/` | 1 | Login, Register, Home |
| `learn/` | 2 | Learning Path, Practice Tests, Lesson, Quiz (kết quả + xem lại) |
| `practice/` | 3 | Speaking, Vocabulary Search, Student Dashboard |
| `tutoring/` | 4 | Tutoring / My Bookings, Tutor Detail, Payment, Booking Detail, Review, Video Room* |
| `classes/` | 5 | Group Classes / My Classes, Class Detail |
| `travel/` | 6 | My Travel Plans, Travel Requests |
| `account/` | 7 | Profile (Me), Become a Teacher, Update Information*, Change Password*, Public profile* |
| `teacher/` | 8 | Dashboard, My Group Classes, Create Class, My Availability, Student Bookings, Class Detail*, Booking Detail*, Upcoming*, Travel (Home, Schedules, Requests, Open trips)* |
| `admin/` | 9 | Finance, Users, Teacher Applications, More*, Teacher Detail*, Videos*, Bank Transfers*, Travel Bookings* |
| `content/` | 9 | Content Management, Unit editor*, Quiz editor*, Placement Tests* |

\* chưa có design, dựng theo `ui-spec.md` với cùng token / component.

| `guest/` | — | Trang giới thiệu cho khách `/welcome`*, tra từ không cần tài khoản `/search` (cùng màn Vocabulary Search) |

## Vai trò

| Vai trò | Vào app | Ghi chú |
|---|---|---|
| Khách | `/welcome` | Xem lộ trình (level → khóa học) và dùng `/search`. Không hiển thị unit vì API `listUnits` của backend lỗi 500 khi chưa đăng nhập. |
| Học viên (User) | `/home` | Tab Home / Learn / Tutoring / Classes / Me |
| Giáo viên (Teacher) | `/teacher/dashboard` | Tab Dashboard / Classes / Schedule / Bookings / Me |
| Moderator | `/teacher/dashboard` | Như giáo viên, thêm "Switch to Admin tools" ở tab Me. Ở Admin tools có 4 tab Finance / Users / Content / More: Finance chỉ xem; More có Videos, Placements, Bank Transfers. Không có Teacher Applications và Travel Bookings vì backend chỉ cho Admin. |
| Admin | `/admin/finance` | Đủ Admin tools; "Switch to Teacher panel" ở tab More |

Panel đang xem (Admin tools / Teacher panel) được nhớ trong `sessionStorage` (`vp-panel`).

Export Excel (Travel Bookings) dùng `xlsx` 0.18.5, cùng phiên bản với web. Thư viện được nạp lazy khi bấm nút.

Nền màn hình đặt bằng host class của page: `bg-admin`, `bg-travel`, `bg-auth` hoặc `bg-quiz`. Mặc định là nền học viên.

## Chạy trên web: laptop ra web cũ, điện thoại ra giao diện mobile

Cùng một địa chỉ, ví dụ `https://vietphuong.burmilla-porbeagle.ts.net`:

| Thiết bị | Kết quả |
|---|---|
| Laptop / tablet | Web cũ (`Fontend/`, backend phục vụ từ `Backend/Backend/ClientApp`) |
| Điện thoại | Web cũ tự chuyển sang `/m/<cùng đường dẫn>`: giao diện mobile, phục vụ từ `Backend/Backend/ClientMobile` |

Cập nhật giao diện: double-click `build-deploy.cmd` ở gốc repo, rồi khởi động lại backend. Script này:
- build web cũ → chép vào `ClientApp`;
- chạy `npm run build:web` → ra thẳng `ClientMobile`.

Chi tiết:
- **Cùng origin với web cũ:** dùng chung đăng nhập (`localStorage.token`).
- **`environment.web.ts`:** gọi API bằng đường dẫn tương đối `/api`.
- **Đường dẫn cũ của web:** được đưa về màn mobile tương ứng (`src/app/legacy.routes.ts`), gồm cả `/my-bookings?payment=…` khi Stripe trả về.
- **PWA:** có `manifest.webmanifest` và `sw.js` (không cache), nên điện thoại "Thêm vào màn hình chính" được, mở toàn màn hình như app.
  - Android Chrome: ⋮ → Cài đặt ứng dụng.
  - iPhone Safari: Chia sẻ → Thêm vào MH chính.
- **Laptop mở `/m`:** giao diện hiện trong khung điện thoại 430px ở giữa, có nút "Desktop version" để về web cũ. Trên điện thoại nút này ẩn.
- **Menu avatar của web cũ:** có "Mobile version".

## Cài lên điện thoại (Android / iOS)

Project native đã có sẵn trong `android/` và `ios/` (Capacitor 6).

1. Chạy backend nghe trên mạng LAN (điện thoại và máy tính cùng Wi-Fi):
   ```bash
   dotnet run --urls http://0.0.0.0:5108
   ```
2. Sửa IP trong `src/environments/environment.device.ts` nếu IP Wi-Fi của máy khác `192.168.1.41`.
3. Build + đồng bộ vào project native, rồi mở IDE:
   ```bash
   npm run cap:android   # mở Android Studio → Run trên máy thật / emulator
   npm run cap:ios       # trên macOS: cd ios/App && pod install, rồi Run trong Xcode
   ```

Đã cấu hình sẵn:
- `capacitor.config.ts`:
  - `androidScheme: 'http'` + `cleartext`: gọi được backend HTTP trong mạng LAN.
  - `allowNavigation` cho `*.stripe.com`: trang Stripe Checkout mở ngay trong app.
  - Nhờ Origin `http://localhost`, Stripe trả về `/my-bookings` / `/user/myclass` là quay lại chính app.
- Quyền micro:
  - Android: `RECORD_AUDIO` trong `AndroidManifest.xml`.
  - iOS: `NSMicrophoneUsageDescription` trong `Info.plist`.
- iOS: `NSAllowsArbitraryLoads` (ATS) để gọi backend HTTP — bỏ khi backend có HTTPS.
- Ghi âm: tự chọn `audio/webm` (Android/Chrome) hoặc `audio/mp4` (iOS). Bản ghi được đổi sang WAV trước khi chấm. Quiz editor lưu `.m4a`; backend đã nhận định dạng này.

Còn giới hạn:
- **Stripe trên iOS:** WKWebView chạy ở `capacitor://localhost`. Backend không nhận Origin này nên trả về `http://localhost:4200`. Muốn quay lại app trên iOS cần một trang trả về HTTPS / universal link trên domain thật.
- **Export Excel trong app native:** `XLSX.writeFile` chỉ tải file trên trình duyệt. Trong app cần thêm `@capacitor/filesystem` + `@capacitor/share` để lưu / chia sẻ file.
