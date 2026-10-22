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

## App Android (APK): build miễn phí trên GitHub

Không cần cài Android SDK. File `.github/workflows/android-apk.yml` tự build mỗi lần push lên `main`, khi có sửa `Mobile/**` hoặc `Fontend/src/app/features/**`. Muốn build ngay thì vào tab **Actions → Android APK → Run workflow**.

- **Link tải, luôn là bản mới nhất:** `https://github.com/thuphuong21072004-sketch/Vietnamese/releases/download/android-latest/vietphuong.apk`
- **Cài lên điện thoại:**
  - Trên giao diện `/m` của Android có nút "Get the Android app", ở trang chủ khách và tab Me.
  - Hoặc mở thẳng link tải → mở file → cho phép "Cài ứng dụng không rõ nguồn gốc" → Cài đặt.
- **App lấy dữ liệu từ đâu:** địa chỉ ghi trong `src/environments/environment.device.ts`, hiện là `https://vietphuong.burmilla-porbeagle.ts.net`. Máy chạy backend và Tailscale **phải đang bật** thì app mới dùng được. Đổi server thì sửa file này rồi push; GitHub sẽ build lại.
- **Số phiên bản:** `versionCode` = số lần chạy workflow, nên bản mới cài đè lên bản cũ được.

**Khóa ký app (làm một lần):**
- Khóa nằm ở `D:\Android\keys\`, ngoài repo. **Giữ bí mật, không làm mất**: mất khóa thì người dùng phải gỡ app rồi cài lại.
- Mở `D:\Android\keys\README.txt` rồi thêm 4 secret tại **Settings → Secrets and variables → Actions**: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- Chưa có secret thì workflow vẫn build, nhưng ký bằng khóa tạm; mỗi bản mới phải gỡ app cũ trước khi cài.

**Đã cấu hình sẵn cho app:**
- Icon VietPhuong (`android/app/src/main/res/mipmap-*`, iOS `AppIcon`).
- Quyền micro: `RECORD_AUDIO` trên Android, `NSMicrophoneUsageDescription` trên iOS.
- `capacitor.config.ts`:
  - `androidScheme: 'http'`.
  - `allowNavigation` cho `*.stripe.com`: trang Stripe Checkout mở ngay trong app. Origin là `http://localhost` nên Stripe trả về `/my-bookings` chính là quay lại app.
- Export Excel trong app: lưu file rồi mở bảng Chia sẻ (`src/app/core/native-file.ts`, plugin `@capacitor/filesystem` + `@capacitor/share`).
- Ghi âm: dùng `audio/webm` (Android) hoặc `audio/mp4` (iOS); đổi sang WAV trước khi chấm.

**Build bằng máy tính (không bắt buộc):** cần Android Studio; chạy `npm run cap:android`.

## iPhone

- **Miễn phí:** dùng PWA. Mở link trên Safari → **Chia sẻ** → **Thêm vào MH chính**. Trang chủ khách trên iPhone có hiện hướng dẫn này.
- **App thật trên chính iPhone của bạn:** cần mượn máy Mac. Xem `IOS-BUILD.md` (miễn phí nhưng app hết hạn sau 7 ngày).
- **Phát app iPhone cho người khác:** bắt buộc có Apple Developer (99 USD/năm). Không làm.

## Lưu ý bảo mật

Repo đang **public**, trong khi `Backend/Backend/appsettings.json` chứa khóa bí mật (Stripe, JWT…). Nên:
- tạo khóa mới (rotate);
- chuyển khóa sang biến môi trường hoặc `dotnet user-secrets`;
- xóa khóa khỏi lịch sử git, hoặc chuyển repo sang private.

Nếu chuyển repo sang private, link tải APK sẽ cần đăng nhập GitHub. Khi đó chép APK vào `Backend/Backend/wwwroot/download/` để tải qua ts.net.
