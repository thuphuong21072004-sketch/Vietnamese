# VietPhuong Mobile App — Design handoff

Thiết kế giao diện app điện thoại (iOS + Android) cho VietPhuong, dựng lại từ `ui-spec.md` của bản web Angular.
Giữ nguyên màu, font và phong cách của web; chỉ đổi layout cho mobile: **bottom tab bar thay sidebar, card thay bảng, form 1 cột, nút đủ lớn để chạm**.

- 33 màn hình, mỗi màn 2 khung: **iPhone 390×844** và **Android 412×915** (66 artboard).
- Source nằm trong `screens/`. Canvas gốc: artifact Design "VietPhuong Mobile App" trên claude.ai.

---

## 1. Cấu trúc thư mục `screens/`

| File | Ý nghĩa |
|---|---|
| `canvas.json` | Index của canvas: vị trí từng khung, tiêu đề, thứ tự, 9 nhãn nhóm luồng |
| `<Tên>.dc.html` | Thiết kế đầy đủ của màn (khung iPhone). Có prop `platform` = `ios` / `android` |
| `<Tên>_Android.dc.html` | Khung Android — chỉ là wrapper `<dc-import name="<Tên>" platform="android">`, dùng lại đúng file iPhone |
| `Main.dc.html` | Màn Login (artboard "entry" của canvas bắt buộc tên `Main`) |

**Lưu ý:** `.dc.html` là định dạng Design Component của Claude Design — cần runtime `support.js` của canvas mới render được, mở trực tiếp bằng trình duyệt sẽ không hiển thị đúng. Dùng các file này làm **tài liệu tham chiếu** (giá trị style inline, cấu trúc DOM, nhãn, dữ liệu mẫu), không phải code để chép thẳng vào app.

Toàn bộ style được viết **inline**. Phần `<script type="text/x-dc">` cuối mỗi file chứa:
- thông số theo nền tảng (`w`, `h`, `top`, `tabH`, `barH`…),
- định nghĩa tab bar (icon path, nhãn, link),
- dữ liệu mẫu (tên giáo viên, giá, ngày…) — **không phải dữ liệu thật**.

---

## 2. Design tokens

### 2.1 Màu

**Brand**

| Token | Giá trị | Dùng cho |
|---|---|---|
| primary | `#7c6cff` | focus, glow |
| primary-dark | `#5a2db5` | chữ brand, tên user, nút back, giá tiền |
| accent | `#7c3aed` | tab đang chọn, chip đang chọn |
| gradient-primary (nút) | `linear-gradient(135deg, #7c6cff, #4f46e5)` | nút CTA chính |
| gradient-admin / segmented / avatar | `linear-gradient(135deg, #7c3aed, #6366f1)` | segmented control đang chọn, avatar fallback, hero card, nút Admin, nút Login |
| indigo | `#4f46e5`, `#4338ca`, nền `#eef2ff` | nút phụ (secondary), eyebrow |
| blue (phân trang, Save ở Users) | `linear-gradient(135deg, #2563eb, #3b82f6)` | |
| CTA cam "Become a Teacher" | `linear-gradient(135deg, #f97316, #f43f5e)` | |
| Travel (emerald) | `#059669`, `#10b981`, nền `#ecfdf5` / `#f0fdf4` | module Du lịch, nút "I've Transferred" |
| Quiz (navy) | `#1e3a8a` | header, tab phần đang làm, nút điều hướng câu |

**Neutral**

| Vai trò | Giá trị |
|---|---|
| Chữ tiêu đề | `#0f172a`, `#111827` |
| Chữ thân | `#334155`, `#475569` |
| Chữ phụ | `#64748b`, `#6b7280` |
| Placeholder | `#94a3b8`, `#9ca3af` |
| Viền | `#e2e8f0`, `#e5e7eb`, `#d1d5db`, hairline `rgba(15,23,42,.08)` |
| Nền nhạt trong card | `#f8fafc`, `#f1f5f9`, `#f5f3ff` |
| Surface | `#ffffff` |

**Nền màn hình**

| Module | Nền |
|---|---|
| Học viên / Giáo viên | `radial-gradient(circle at 0% 0%, rgba(124,108,255,.14), transparent 40%), radial-gradient(circle at 100% 100%, rgba(56,189,248,.12), transparent 40%), linear-gradient(180deg, #f3f0ff, #faf8ff 50%, #f5f3ff)` |
| Admin | `linear-gradient(180deg, #f8fbff, #eef5ff)` |
| Travel | như học viên nhưng radial góc trái là `rgba(16,185,129,.12)`, linear bắt đầu `#f0fdf8` |
| Login / Register | `linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #312e81 100%)` + 3 vòng tròn mờ `#7c3aed`, `#2563eb`, `#9333ea` (blur 60px). Card kính `rgba(255,255,255,.08)`, viền `rgba(255,255,255,.14)`, input `rgba(255,255,255,.06)`, focus `#8b5cf6`, link `#a78bfa` |
| Quiz / Kết quả | `#f8fafc`, header navy `#1e3a8a` |

**Badge trạng thái (nền / chữ)** — thống nhất theo mục 4.5 của spec

| Ngữ nghĩa | Nền | Chữ | Dùng cho |
|---|---|---|---|
| Success | `#dcfce7` | `#166534` | Confirmed, Completed (lớp), Available, Accepted, Matched, Approved Teacher, PASSED |
| Warning | `#fef3c7` | `#92400e` | Pending Payment, Booked (slot), Pending, Submitted |
| Danger | `#fee2e2` | `#dc2626` | Cancelled, Expired, Rejected |
| Info | `#dbeafe` | `#1d4ed8` | In Progress, Ongoing, Finding Teacher, Approved By Admin |
| Indigo | `#e0e7ff` | `#4338ca` | Upcoming, Completed (booking 1-1) |
| Violet | `#f3e8ff` | `#7e22ce` | Refunded |
| Neutral | `#f3f4f6` | `#6b7280` | Draft |
| Banned | `#111827` | `#fff` | Banned |
| Orange (số dư nợ) | `#ffedd5` / `#fff7ed` | `#c2410c` / `#ea580c` | "Still Owed", "Owed $x" |

**Word-diff (Speaking)**: Correct `#dcfce7/#166534` · Tone `#ffedd5/#c2410c` · Similar `#fef9c3/#854d0e` · Wrong `#fee2e2/#b91c1c` · Missing `#f3f4f6/#6b7280` + gạch ngang · Extra `#f3e8ff/#7e22ce`.

### 2.2 Font

- **Inter** (Google Fonts, weight 400/500/600/700/800), fallback `'Segoe UI', Arial, sans-serif`.
- Ngoại lệ: Quiz và tiêu đề/điểm ở Quiz Results dùng **`'Times New Roman', Times, serif`** (phong cách "đề thi giấy").

| Vai trò | Cỡ / weight |
|---|---|
| Tiêu đề lớn màn gốc của tab | iOS 28–30 / Android 24, 800, letter-spacing -0.03em |
| Tiêu đề thanh điều hướng màn con | iOS 17 / Android 20, 700 |
| Hero / tên màn trong nội dung | 22–26, 800 |
| Tiêu đề section | 16, 700, `#111827` |
| Tiêu đề card | 15–17, 700–800 |
| Thân | 14–15 |
| Phụ / meta | 12–13 |
| Eyebrow | 11–12, 700, uppercase, letter-spacing .06em, `#4338ca` |
| Nhãn tab bar | 11, 600 (đang chọn 700) |
| Số trên stat card | 22 (card nhỏ) / 30 (card lớn) / 56 (điểm quiz), 800 |
| Input | **16px** (tránh iOS tự zoom khi focus) |

### 2.3 Bo góc

| Mức | Giá trị | Dùng cho |
|---|---|---|
| S | 10px | input, nút nhỏ, ô thông tin, icon button |
| M | 12–14px | nút chính, chip vuông, segmented, nhóm thông tin |
| L | 16–18px | card |
| XL | 20–24px | hero card, form card, card hồ sơ, card kính Login |
| Squircle | 22px | avatar trên Profile |
| Pill | 999px | badge, chip lọc |
| Tròn | 50% | avatar, nút ghi âm, node lộ trình, FAB-icon |

### 2.4 Shadow

| Mức | Giá trị |
|---|---|
| Card thường | `0 4px 15px rgba(15,23,42,.06)` |
| Stat card | `0 4px 16px rgba(0,0,0,.06)` – `.08` |
| Card lớn (tint tím) | `0 18px 48px rgba(99,102,241,.12)` (hero gradient: `.25`) |
| Nút primary | `0 4px 12px rgba(124,108,255,.3)` |
| CTA lớn / FAB | `0 18px 40px rgba(124,108,255,.3–.35)` |
| Focus ring input | viền `rgba(124,108,255,.45)` + `0 0 0 4px rgba(124,108,255,.12)` |

### 2.5 Kích thước nút & vùng chạm

| Thành phần | Kích thước |
|---|---|
| Nút CTA cố định đáy màn | cao **52px**, bo 14, chữ 16/700, full width |
| Nút trong card | cao **44px**, bo 12, chữ 14/700 |
| Nút phụ trong form | cao 48px |
| Icon button (back, chuông, lọc) | **44×44** |
| Input / select | cao 48–50px (trong card con 44px), padding 0 14px |
| Chip lọc | cao 32px, padding 0 10px, chữ 12/600, tự **xuống dòng** (không cuộn ngang) |
| Avatar | 40 (list) · 48–52 (card) · 64–72 (hồ sơ) · 92 (chọn ảnh khi đăng ký) |
| Node lộ trình học | 64px tròn; node Skip test 72px |
| Nút ghi âm | 84px trong vòng ripple 120px |
| Ô số câu quiz | 44px |
| FAB | cao 56px, bo 28 (iOS) / 16 (Android) |

Quy tắc chung: mọi vùng bấm ≥ 44px (trừ chip lọc 32px). Không hiển thị scrollbar (cả ngang lẫn dọc) — người dùng chỉ vuốt.

### 2.6 Spacing

Padding ngang màn hình **16px**. Gap giữa các khối 12–16px. Padding card 14–18px. Gap trong lưới card 8–10px.

---

## 3. Khác biệt iOS / Android

Cùng một thiết kế, chỉ khác các thông số sau (xem `renderVals()` trong từng file):

| Thông số | iOS (390×844) | Android (412×915) |
|---|---|---|
| Vùng an toàn trên (status bar) | 50px | 28px |
| Vùng an toàn dưới (home indicator) | 34px dưới nút CTA, 30px dưới tab bar | 16px dưới nút CTA, 12px dưới tab bar |
| Thanh điều hướng màn con | cao 44px, tiêu đề **căn giữa**, 17px | cao 64px, tiêu đề **căn trái**, 20px |
| Icon back | chevron `‹` (`M15 18l-6-6 6-6`) | mũi tên `←` (`M19 12H5M12 19l-7-7 7-7`) |
| Tiêu đề lớn màn gốc | 28–30px | 24px |
| Tab bar | cao 44 + 30 safe area; tab đang chọn chỉ đổi màu `#7c3aed` | cao 56 + 12; tab đang chọn có **pill nền `#ede9fe`** 60×32 sau icon (kiểu Material 3) |
| FAB | bo 28px (dạng viên thuốc) | bo 16px (Material extended FAB) |

Không vẽ status bar giả (giờ/pin) — chỉ chừa khoảng trống safe area.

---

## 4. Danh sách 33 màn theo 9 nhóm luồng

File = `screens/<File>.dc.html` (+ `_Android`). Route web tương ứng trong ngoặc.

**1 · Đăng nhập & bắt đầu**
1. Login — `Main` (`/login`)
2. Register — `Register` (`/user/register`) — bấm vào vòng tròn avatar để chọn ảnh, không có nút upload riêng
3. Home — `Home` (`/home`, bản đã đăng nhập)

**2 · Tự học: xếp lớp → lộ trình → bài học → quiz**
4. Practice Tests — `PracticeTests` (`/user/tests`)
5. Learning Path — `LearningPath` (`/user/units`, path view)
6. Lesson — `Lesson` (`/user/units`, lesson view)
7. Quiz — `Quiz` (`/user/quiz`)
8. Quiz Results — `QuizResults`

**3 · Luyện tập & thống kê**
9. Speaking — `Speaking` (`/user/speaking`)
10. Vocabulary Search — `VocabSearch` (`/user/search`)
11. Student Dashboard — `StudentDashboard` (`/user/dashboard`)

**4 · Gia sư 1-1: tìm → đặt lịch → thanh toán → học → đánh giá**
12. 1-on-1 Tutoring — `Tutoring` (`/user/learnOnline`)
13. Tutor Slot Detail — `TutorDetail` (`/schedule/:id`)
14. Payment — `Payment` (`/payment/:id`, đang hiện tab VietQR)
15. My Bookings — `MyBookings` (`/my-bookings`)
16. Booking Detail — `BookingDetail` (`/booking/:id`)
17. Review — `Review` (`/review/:id`)

**5 · Lớp nhóm**
18. Group Classes — `GroupClasses` (`/teacher/class`)
19. Class Detail — `ClassDetail` (`/user/classdetail/:id`)
20. My Classes — `MyClasses` (`/user/myclass`, gộp khối "Upcoming Schedule" lên đầu)

**6 · Du lịch cùng gia sư**
21. My Travel Plans — `TravelTrips` (`/user/travel/trips`, gộp nav tile của Travel Home)
22. Travel Requests — `TravelRequests` (`/user/travel/requests`)

**7 · Tài khoản**
23. Profile (tab "Me") — `Profile` (`/profile`, kiêm menu cho các mục không có trong tab bar)
24. Become a Teacher — `BecomeTeacher` (`/user/become-teacher`)

**8 · Giáo viên (Teacher panel)**
25. Teacher Dashboard — `TeacherDashboard` (`/teacher/dashboard`)
26. My Group Classes — `TeacherClasses` (`/teacher/listclass`)
27. Create Class — `CreateClass` (`/class/create`)
28. My Availability — `Availability` (`/admin/schedule`)
29. Student Bookings — `TeacherBookings` (`/admin/classrooms`)

**9 · Admin tools**
30. Admin Finance — `AdminFinance` (`/admin/dashboard`)
31. User Management — `AdminUsers` (`/admin/users`)
32. Teacher Applications — `TeacherApps` (`/admin/teachers`)
33. Content Management — `ContentMgmt` (`/admin/courses`, có segmented Levels › Courses › Units)

**Chưa thiết kế** (có trong spec): Public profile, Video Room, Upcoming Classes (riêng), Travel Home (riêng), các màn Travel của giáo viên, Class Detail (GV), Booking Detail (GV), Unit editor, Quiz editor, Placement Tests, Teacher Application Detail, Pending Bank Transfers, Confirmed Travel Bookings, Update Information / Change Password, trình chọn ảnh avatar.

---

## 5. Tab bar theo vai trò

Luôn 5 tab. Icon nét kiểu Lucide 22px, stroke 2. Tab đang chọn màu `#7c3aed`, còn lại `#64748b`.

| Học viên (User) | Giáo viên (Moderator/Teacher) | Admin |
|---|---|---|
| **Home** → Home | **Dashboard** → TeacherDashboard | **Finance** → AdminFinance |
| **Learn** → LearningPath (+ Practice Tests, Speaking, Vocab, Lesson, Quiz) | **Classes** → TeacherClasses (+ Create Class) | **Users** → AdminUsers |
| **Tutoring** → Tutoring / My Bookings (segmented) | **Schedule** → Availability | **Content** → ContentMgmt |
| **Classes** → GroupClasses / My Classes (segmented) | **Bookings** → TeacherBookings | **Teachers** → TeacherApps |
| **Me** → Profile (Dashboard, Speaking, Vocab, Travel, Become a Teacher, tài khoản, Log out) | **Me** → Profile | **More** → menu (Videos, Placements, Bank Transfers, Travel Bookings, chuyển sang Teacher panel) |

Ẩn tab bar ở các màn **tác vụ toàn màn hình** có nút CTA cố định đáy: Login, Register, Lesson, Quiz, Quiz Results, Tutor Detail, Payment, Booking Detail, Review, Class Detail, Travel Plans/Requests, Become a Teacher, Student Dashboard, Create Class.

Admin có thể chuyển "Admin tools ↔ Teacher panel" (switch trong sidebar web) — trên mobile đặt trong tab **More**.

---

## 6. Hướng dẫn cho người code

1. **Đọc token từ mục 2, không đọc từ code web.** Bản web có nhiều màu lệch nhau giữa các trang (xem Phụ lục spec); mobile đã thống nhất theo bảng trên. Nên khai báo thành theme/constant một chỗ (ví dụ `theme.ts` hoặc `colors.xml` / `Color.swift`).
2. **Tạo component dùng chung trước khi làm màn:** `Screen` (nền + safe area), `NavBar` (back + title, theo platform), `LargeTitle`, `TabBar` (theo role), `Card`, `Button` (primary / secondary / ghost / danger-soft / back / travel / outline-travel / cta-orange), `Badge` (map trạng thái → màu ở 2.1), `ChipGroup` (wrap, không scroll ngang), `TextField` / `Select` (label trên, cao 48, font 16), `StatCard` (viền trái 4px), `KeyValueRow`, `Avatar` (fallback gradient + chữ cái đầu), `BottomActionBar` (CTA cố định đáy), `SegmentedControl`, `FAB`.
3. **Bảng → card:** mỗi dòng bảng web thành 1 card; cột chính lên tiêu đề card, badge góc phải, các cột phụ thành lưới 2–4 ô nền `#f8fafc`, hành động thành hàng nút cuối card. Dòng tổng giữ dạng hàng có viền trên 2px `#e5e7eb`.
4. **Bộ lọc:** select trạng thái → `ChipGroup`; bộ lọc nhiều trường (Group Classes, Teacher Classes, Users) → nút "Filters" mở **bottom sheet** (chưa vẽ sheet).
5. **Cuộn:** chỉ vùng nội dung giữa cuộn dọc; header, tab bar, bottom action bar đứng yên. Ẩn scrollbar.
6. **Platform:** dùng API platform của framework (React Native `Platform.OS`, Flutter `Theme.of(context).platform`…) để áp các khác biệt ở mục 3. Dùng safe-area thật của thiết bị thay cho số cố định 50/34/28/16.
7. **Thay dialog native của web** (`alert/confirm/prompt`) bằng Confirm dialog / bottom sheet và Toast của mobile.
8. **Dữ liệu trong file là mẫu.** Các chỗ dạng `[BANK NAME]`, `[ACCOUNT NO]`, `[MAX PRICE]`… là placeholder phải lấy từ API.
9. **Nhãn UI giữ nguyên ngôn ngữ của spec** (đa số tiếng Anh, một số tiếng Việt như "Câu", "Phần", "đánh giá"). Nên đưa toàn bộ chuỗi vào file i18n ngay từ đầu.
10. **Trạng thái loading / rỗng / lỗi** chưa vẽ trên mobile — dùng nội dung chữ ở spec (mục 3) với kiểu empty state "hộp viền đứt 2px `#d1d5db`, r18" và spinner 36px (`#e5e7eb` / `#4f46e5`).
11. API backend giữ nguyên (`http://localhost:5108/api`, JWT Bearer); mobile cần thêm cấu hình CORS/base URL riêng vì backend hiện chỉ cho phép `http://localhost:4200`.
