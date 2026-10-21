# UI Spec — VietPhuong (nền tảng học tiếng Việt)

> Tài liệu cho designer dựng lại giao diện mà không cần đọc code. Mô tả **hiện trạng** frontend Angular 18 (`Fontend/`).
> Chữ trong ngoặc kép "…" là nhãn UI gốc, giữ nguyên ngôn ngữ (phần lớn tiếng Anh, một số tiếng Việt).

## 0. Tổng quan

- **Sản phẩm:** học tiếng Việt: lộ trình tự học (Level → Course → Unit → Quiz), gia sư 1-1, lớp nhóm trực tuyến, luyện phát âm, ghép cặp "du lịch cùng giáo viên".
- **Vai trò:** Guest, Student (role `User`), Teacher (role `Moderator`), Admin (chuyển qua lại "Admin tools" và "Teacher panel").
- **Không dùng UI library** (không Bootstrap/Tailwind/Material). Không có component dùng chung; mỗi trang tự viết CSS. Mã màu gần như toàn bộ lấy từ bảng màu Tailwind mặc định.
- **Base font-size 13px** (1rem = 13px) nên giao diện khá "compact".
- **Icon:** SVG nét (kiểu Lucide/Feather, 14–16px, stroke 2) ở header; còn lại dùng emoji (★ ✕ 📍 ✈️ ✓ 🔍 🏫 📅 🎤 🔊 ✉ 🗑 ✏ ⚠).
- **Không có chart, toast hay modal component.** Thông báo và xác nhận dùng `alert()`/`confirm()`/`prompt()` của trình duyệt. Dashboard chỉ gồm thẻ số liệu và bảng.

---

## 1. Design tokens

### 1.1 Màu

**Brand / primary**

| Token | Hex | Dùng cho |
|---|---|---|
| primary | `#7c6cff` | nút chính ở header, focus, badge mặc định |
| primary-dark | `#5a2db5` | hover nút chính, chữ brand, tên user |
| accent (thực tế dùng nhiều nhất) | `#7c3aed` | active state, link, viền focus admin |
| gradient chính | `#7c3aed → #6366f1` (135°) | menu active, nút admin, avatar fallback |
| gradient nút global | `#7c6cff → #4f46e5` | `.btn-primary` |
| indigo | `#4f46e5` / `#4338ca` / `#eef2ff` (nền nhạt) | nút, tab active, eyebrow, nút phụ |
| blue | `#2563eb` / `#3b82f6` | nút lưu, phân trang, link |
| brand text gradient | `#7c6cff → #5a2db5` | chữ logo "VietPhuong" |
| CTA cam ("Become a Teacher") | `#f97316 → #f43f5e` | nút đặc biệt trong sidebar |

**Neutral**

| Vai trò | Hex |
|---|---|
| Chữ chính / tiêu đề | `#0f172a`, `#111827` |
| Chữ thân | `#334155`, `#374151`, `#475569` |
| Chữ phụ / muted | `#64748b`, `#6b7280` |
| Placeholder / rỗng | `#9ca3af`, `#94a3b8` |
| Viền | `#e5e7eb`, `#e2e8f0`, `#d1d5db`, hairline `rgba(15,23,42,.08)` |
| Nền nhạt / header bảng | `#f8fafc`, `#f9fafb`, `#f3f4f6`, `#f1f5f9` |
| Surface | `#ffffff`, `#faf8ff`, `#f5f3ff` |
| Nền app | radial violet `rgba(124,108,255,.14)` góc trên trái + radial sky `rgba(56,189,248,.12)` góc dưới phải + linear `#f3f0ff → #faf8ff → #f5f3ff` |

**Semantic (cặp nền / chữ, dùng cho badge và alert)**

| Ngữ nghĩa | Nền | Chữ | Màu đặc (nút, viền) |
|---|---|---|---|
| Success | `#dcfce7` | `#166534` / `#15803d` | `#22c55e`, `#16a34a` |
| Warning / Pending | `#fef3c7` | `#92400e` | `#f59e0b` |
| Danger | `#fee2e2` | `#dc2626` / `#b91c1c` | `#ef4444`, `#dc2626` |
| Info | `#dbeafe` | `#1d4ed8` / `#1e40af` | `#2563eb` |
| Upcoming (indigo) | `#e0e7ff` | `#4338ca` | — |
| Refunded (violet) | `#f3e8ff` | `#7e22ce` | — |
| Neutral / Cancelled nhẹ | `#f3f4f6` | `#6b7280` | — |
| Orange (số dư nợ) | — | `#ea580c` | `#f97316` |

**Theme riêng theo module**

| Module | Đặc điểm |
|---|---|
| Login | Nền tối gradient `#0f172a → #1e293b → #312e81`; card kính `rgba(255,255,255,.08)`, r24; input `rgba(255,255,255,.06)`, focus `#8b5cf6`; nút `#7c3aed → #6366f1`; link `#a78bfa`; vòng tròn mờ trang trí `#7c3aed`, `#2563eb`, `#9333ea` |
| Quiz / Placement (học viên) | Phong cách "đề thi giấy": navy `#1e3a8a`, font Times New Roman |
| Travel | Accent emerald `#059669` / `#10b981`, nút outline viền `#059669` |
| Admin list (Users, Videos, Teacher list) | Nền xanh nhạt `#f8fbff → #eef5ff` |

### 1.2 Typography

- **Font:** `"Inter", "Segoe UI", Arial, sans-serif` (Inter chưa được load, nên thực tế hiển thị Segoe UI). Ngoại lệ: Quiz/Placement dùng `"Times New Roman", serif`; trang Learning path khai báo `"Nunito"` (cũng chưa load).
- **Base:** 13px, line-height 1.35.
- **Scale (px):** 11 · 12 · 13 · 14 · 15 · 16 · 18 · 20 · 22 · 24 · 28 · 30 · 32; display 48 / 56 (điểm kết quả quiz).
  - Thân bài: 13–14. Phụ: 11–12. Tiêu đề section: 16–18. Tiêu đề trang: 22–28. Số trên stat card: 30.
- **Weight:** 700 (mặc định cho nút và tiêu đề), 600 (label, header bảng), 800 (brand, số lớn), 500 (ít dùng).
- **Style có sẵn:**
  - `.page-title`: `clamp(1.5rem, 1.9vw, 1.8rem)`, letter-spacing -0.03em.
  - `.section-title`: 1rem / 700 / `#111827`.
  - `.page-subtitle`: .92rem, muted.
  - Eyebrow (nhãn nhỏ trên tiêu đề): 11–12px, uppercase, `#4338ca`.

### 1.3 Spacing

- **Scale:** 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 (px). Gap phổ biến 8–12; padding card 14–24.
- **Padding nút:** `8px 14px` (chuẩn), `6px 12px` (nhỏ), `10px 20px` (lớn), `14px 32px` (CTA hero).
- **Container:** header 1280, footer 1200, admin card 1100, teacher list 980 (max-width, px).
- **Shell:** gap giữa sidebar và nội dung 18px; padding nội dung 24px.

### 1.4 Bo góc

| Mức | Giá trị | Dùng cho |
|---|---|---|
| XS | 6px | nút và input global |
| S | 8–10px | nút trang, input, logo |
| M | 12–14px | menu item, card nhỏ, tab |
| L | 16–20px | card, panel, khung nội dung |
| XL | 22–28px | hero, card auth, profile card sidebar, dropdown |
| Pill | 999px | badge, chip, filter pill |
| Tròn | 50% | avatar |

### 1.5 Shadow

| Mức | Giá trị |
|---|---|
| Card nhẹ | `0 2px 8px rgba(0,0,0,.04)` / `0 4px 15px rgba(15,23,42,.06)` |
| Card dashboard | `0 4px 16px rgba(0,0,0,.08)` |
| Card hover | `0 8px 24px rgba(0,0,0,.12)` + `translateY(-4px)` |
| Card lớn (tint tím) | `0 18px 48px rgba(99,102,241,.12)` |
| Khung nội dung | `0 28px 84px rgba(99,102,241,.08)` |
| Nút primary glow | `0 18px 40px rgba(124,108,255,.22)` (nhỏ: `0 4px 12px rgba(124,108,255,.3)`) |
| Focus ring | `0 0 0 4px rgba(124,108,255,.12)`; nút: outline `3px rgba(124,108,255,.32)` |
| Dropdown | `0 24px 60px rgba(15,23,42,.12)` |
| Modal | `0 20px 60px rgba(0,0,0,.3)` |

### 1.6 Breakpoint & chuyển động

- **Breakpoint (max-width):** 1200 · 1024 · 900 · **860 (app shell)** · **768 (chính)** · 600 · 480.
- **Transition:** 0.15–0.2s. Hover nút `translateY(-1px)`; hover card `-4px`.
- **Animation:**
  - Spinner: 36px, viền 3px, quay 0.7s.
  - Thanh shimmer gradient 3px trên đầu header (4s).
  - Sóng và pulse cho nút ghi âm.
  - Đồng hồ quiz nhấp nháy khi sắp hết giờ.

---

## 2. Danh sách màn hình

### 2.1 Public / Auth

| Màn hình | Route | Mục đích |
|---|---|---|
| Home | `/home` (`/` redirect) | Landing, giới thiệu lộ trình học |
| Login | `/login` | Đăng nhập |
| Register | `/user/register` | Tạo tài khoản |
| Profile | `/profile` | Xem/sửa thông tin cá nhân, đổi mật khẩu |
| Public profile | `/user/profile/:id` | Hồ sơ công khai của user hoặc giáo viên |
| Vocabulary Search | `/user/search` | Tra từ: clip YouTube có phát âm + từ điển |

### 2.2 Học viên (Student)

| Màn hình | Route | Mục đích |
|---|---|---|
| Student Dashboard | `/user/dashboard` | Thống kê chi tiêu, khóa học đã mua |
| Learning path | `/user/units` | Lộ trình bài học kiểu Duolingo + xem bài |
| Quiz | `/user/quiz?refType=&refId=&unitId=` | Làm bài kiểm tra (unit / skip / placement) |
| Practice Tests | `/user/tests` | Chọn đề kiểm tra xếp lớp |
| Speaking | `/user/speaking` | Dịch câu + chấm phát âm |
| 1-on-1 Tutoring | `/user/learnOnline` | Danh sách lịch trống của gia sư |
| Tutor slot detail | `/schedule/:id` | Chi tiết gia sư + lịch, đặt lịch |
| Payment | `/payment/:id` (`?type=CLASS`) | Thanh toán Stripe hoặc chuyển khoản VietQR |
| My Bookings | `/my-bookings` | Danh sách buổi 1-1 đã đặt |
| Booking Detail | `/booking/:id` | Chi tiết buổi 1-1 |
| Video Room | `/room/:id` | Tạo / vào phòng học online |
| Review | `/review/:id` (`?type=CLASS&enrollmentId=`) | Đánh giá giáo viên hoặc khóa học |
| Group Classes | `/teacher/class` (*tên route gây nhầm, đây là màn học viên*) | Tìm lớp nhóm |
| Class Detail | `/user/classdetail/:id` | Chi tiết lớp, đăng ký |
| My Classes | `/user/myclass` | Lớp đã đăng ký |
| Upcoming Classes | `/user/schedule` | Các buổi học sắp tới |
| Travel Home | `/user/travel` | Giới thiệu "du lịch cùng gia sư" |
| My Travel Plans | `/user/travel/trips` | Quản lý chuyến đi, tìm giáo viên |
| Travel Requests | `/user/travel/requests` | Lời mời và yêu cầu ghép cặp |
| Become a Teacher | `/user/become-teacher` | Nộp hồ sơ giáo viên (giáo viên dùng làm "Teacher Profile") |

### 2.3 Giáo viên (Teacher panel)

| Màn hình | Route | Mục đích |
|---|---|---|
| Teacher Dashboard | `/teacher/dashboard` | Thu nhập, lớp, số tiền admin còn nợ |
| My Group Classes | `/teacher/listclass` | Danh sách lớp nhóm của mình |
| Create Class | `/class/create` | Tạo lớp nhóm + sinh lịch học |
| Class Detail (GV) | `/teacher/detail/:id` | Sửa chủ đề từng buổi, xem học viên |
| Upcoming Teaching Schedule | `/teacher/schedule` | Buổi dạy sắp tới, vào Zoom |
| My Availability | `/admin/schedule` | Tạo slot trống cho lịch 1-1 |
| Student Bookings | `/admin/classrooms` (cũng `/teacher/bookings`) | Các buổi 1-1 học viên đã đặt |
| Booking Detail (GV) | `/admin/bookings/:id` | Chi tiết buổi 1-1 |
| Travel Home (GV) | `/teacher/travel` | Trang chủ module du lịch |
| My Travel Schedules | `/teacher/travel/schedules` | Lịch rảnh tại các tỉnh, tìm học viên |
| Travel Requests (GV) | `/teacher/travel/requests` | Lời mời và yêu cầu |
| Students Looking for a Teacher | `/teacher/travel/open-trips` | Duyệt chuyến đi của học viên |

### 2.4 Admin (Admin tools; Moderator cũng thấy menu này)

| Màn hình | Route | Mục đích |
|---|---|---|
| Admin Dashboard — Finance | `/admin/dashboard` | Doanh thu, đối soát trả tiền giáo viên |
| User Management | `/admin/users` | Đổi trạng thái và role user |
| Video Management | `/admin/videos` | Import video YouTube, duyệt |
| Level Management | `/admin/levels` | CRUD level |
| Course Management | `/admin/courses?levelId=` | CRUD khóa học trong level + quiz nhảy level |
| Unit Management | `/admin/units?courseId=` | Danh sách unit + quiz nhảy khóa |
| Unit editor | `/admin/unitDetail?unitId=` hoặc `?courseId=` | Thêm/sửa unit, video, quiz |
| Placement Tests | `/admin/placements` | Đề xếp lớp |
| Teacher Applications | `/admin/teachers` (chỉ Admin) | Duyệt hồ sơ giáo viên |
| Teacher Application Detail | `/admin/teachers/:id` | Duyệt / từ chối / cấm |
| Pending Bank Transfers | `/admin/bank-transfers` (*không có trong menu*) | Xác nhận chuyển khoản |
| Confirmed Travel Bookings | `/admin/travel/bookings` | Danh sách cặp GV–HV đã ghép, xuất Excel |

---

## 3. Nội dung từng màn hình

Quy ước: **Khối** = các phần theo thứ tự từ trên xuống · **Bảng** = tên cột · **Form** = field (kiểu input) · **Nút** · **Lọc** · **Trạng thái** (loading / rỗng / lỗi).

### 3.1 Public / Auth

#### Home `/home`
- **Khối:**
  1. **Hero:** tag "Learn Vietnamese the smart way", H1 "Master Vietnamese with a modern study path", mô tả, 3 số đếm live (Levels / Courses / Units).
  2. **Hero visual:** badge "Learning path", 3 số tĩnh (3 Clear paths, 150+ Interactive lessons, 1000+ Real examples).
  3. **"Why choose VietPhuong":** 3 feature card (Structured learning / Smart practice / Progress visibility).
  4. **"Course overview":** 4 stat card (Levels, Courses, Units, 100+ Audio lessons).
  5. **"Explore our learning system":** accordion 3 cấp. Level card (tên, mô tả, "N courses", "N units", +/−) mở ra Course row (tên, mô tả, "N units", +/−), mở tiếp ra danh sách tên unit.
- **Nút:** "Register" (primary `#4338ca`), "Login" (secondary `#eef2ff` / `#3730a3`).
- **Trạng thái:**
  - Loading: "Loading available paths..."
  - Lỗi: "Unable to load learning paths right now. Please try again later."
  - Rỗng: "Study paths are being updated…"; level không có khóa: "No courses available for this level yet."

#### Login `/login`
- **Layout:** card 920px chia 2 cột, nền tối (xem theme Login ở 1.1).
- **Cột trái:** logo "VP", "Welcome Back", đoạn mô tả, danh sách tính năng (Interactive Lessons, Online Teacher Booking, AI Pronunciation Practice).
- **Cột phải:** "Login" / "Sign in to your account".
  - **Form:** Email (email), Password (password), "Remember me" (checkbox), link "Forgot password?".
  - **Nút:** "Login Account". Dưới nút: "Don't have an account? **Create Account**".
- **Lỗi:** "Email and password required", "Sai email hoặc mật khẩu".

#### Register `/user/register`
- **Layout:** 2 cột như Login. Cột trái "Start Your Journey" + 3 tính năng.
- **Form "Register / Create your account":**
  - Avatar preview + nút "Upload Avatar" (file image/*).
  - Full Name (text), Email (email).
  - Country (select "Select Country", Vietnam đứng đầu).
  - Bio (textarea).
  - Password, Confirm Password (password).
  - "I agree to the terms" (checkbox).
- **Nút:** "Create Account". Dưới nút: "Already have an account? **Login**".
- **Lỗi:** "All fields required", "Password too short" (dưới 6 ký tự), "Passwords do not match", "You must agree to terms".

#### Profile `/profile`
- **Khối 1 (thông tin):** avatar (hoặc "No Avatar") + các dòng chỉ đọc: Name, Email, Role, Status, Country, Date of Birth, Gender, Bio ("No bio yet").
- **Khối 2 "Update Information":**
  - Form: Full Name (text), Email (text), Country (select), Date of Birth (date), Gender (select: -- Select -- / Male / Female / Other), Bio (textarea), Avatar (file).
  - Nút: "Update Profile".
- **Khối 3 "Change Password":**
  - Form: Old Password, New Password (password, tối thiểu 6 ký tự).
  - Nút: "Change Password".

#### Public profile `/user/profile/:id`
- **Khối chung:** "← Back", avatar, tên, meta (quốc gia, icon giới tính, ngày sinh), bio, tóm tắt sao.
- **Nếu là giáo viên:**
  - "Teaching Info": Specialty, Experience, Price / hour, Rating.
  - "About".
  - "Introduction Video".
  - "Reviews": filter pill "All (n)", "5★ (n)" … "1★ (n)"; review card (avatar, tên, ngày, sao, nội dung).
- **Nếu là học viên:** Country, Gender, Date of Birth, Role.
- **Trạng thái:** "Loading profile...", "Profile not found.", "No reviews yet."

#### Vocabulary Search `/user/search`
- **Khối:**
  1. **Hero:** "Pronunciation search" / "Hear Vietnamese in real clips".
  2. **Ô tìm kiếm:** text "Enter a Vietnamese word..." + nút "Search" (Enter cũng tìm).
  3. **Chip gợi ý** (trước khi tìm): "Try:" xin chào / gia đình / ngôi nhà.
  4. **Kết quả:** "Results for "…"", YouTube player.
  5. **Thanh điều khiển:** Previous video, Back 5s, Replay word, Play/Pause, Forward 5s, Next video.
  6. **Card từ điển:** từ, "Vietnamese to English", nhóm nghĩa (từ loại, nghĩa tiếng Anh, "Similar:"), "Example Sentences".
- **Rỗng:** "No videos found for "…"".

### 3.2 Học viên

#### Student Dashboard `/user/dashboard`
- **Header:** "Student Dashboard".
- **Lọc:** month picker (input month) + checkbox "All time" (bật thì disable month picker).
- **Stat card hàng 1 (USD):** Total Paid, Completed Learning, Active Learning, Cancelled (Pending Refund), Refunded.
- **Stat card hàng 2:** My Courses (số lượng), Spent on Courses.
- **Bảng "My Courses":** Class | Teacher | Status (badge) | Paid On | Amount; dòng tổng "Total (n courses)".
- **Bảng "Monthly Payment Breakdown":** Month | Total Paid | Completed | Active | Cancelled | Refunded.
- **Rỗng:** "No group class payments in {period}.", "No payment records found."

#### Learning path `/user/units`
Màn có 2 chế độ xem.

**(a) Path view**
- Header: tên level + mô tả.
- Mỗi course: header dính (sticky) tên course, rồi một cột node unit xếp zig-zag; nhãn dưới node là tên unit.
- Trạng thái node (tròn):
  - ✓ done (xanh lá)
  - ▶ current (primary, nổi bật)
  - 🔒 locked (xám, không bấm được)
- Giữa các course: node ★ "Skip Course Test" (disabled khi bị khóa).
- Cuối trang: nút "🏆 Skip Level Test".
- Trang tự cuộn tới unit hiện tại. Loading: "Loading your progress...".

**(b) Lesson view (sau khi bấm unit)**
- "← Back", eyebrow "Current lesson", tên unit.
- Khối Objective, khối Description.
- Video bài học (mp4).
- Nút "Start Test".

#### Quiz `/user/quiz`
Phong cách "đề thi giấy" (navy + Times New Roman). Dùng chung cho bài kiểm tra unit, skip test và placement.

**Khung trang**
- Banner: "VIETNAMESE LEARNING INSTITUTE" / "Official Assessment Paper".
- Nút "Review Test" (nếu đã làm bài này trước đây).
- Header: tên quiz; loại (Unit Test / Skip Course Test / Skip Level Test / Placement Test); "Pass Score: 70%".

**Điều hướng câu hỏi (2 kiểu)**
- *Quiz phẳng:* tab số 1..n, mỗi lần hiện 1 câu; nút "← Câu n" / "Câu n →".
- *Quiz chia phần:*
  - Tab "Phần N" kèm bộ đếm đã làm/tổng.
  - Mỗi phần có header (số, tên phần), hướng dẫn, các câu hỏi và các đoạn văn (text / ảnh / audio) kèm câu hỏi con.
  - Nút "← Phần N" / "Phần N →".

**Khối câu hỏi**
- "Câu N." + nội dung (text / ảnh / audio), "(x pts)".
- Nút cờ "Mark for Review" / "Marked".
- Kiểu trả lời:
  - Multiple choice: radio (text, ảnh hoặc audio).
  - Pronunciation: nút "🎤 Record" / "⏹ Stop", "Processing...", "✓ Recorded".
  - Writing: textarea "Type your answer here...".

**Sidebar phải (desktop)**
- Đồng hồ "Time Remaining:". Dưới 5 phút chuyển màu warning; dưới 1 phút chuyển danger và nhấp nháy.
- Nút "SUBMIT".
- Chú thích màu: Answered / Flagged.
- Lưới số câu theo từng phần; bấm để nhảy tới câu.
- Mobile: đồng hồ nằm ở header, nút SUBMIT riêng.

**Màn kết quả "Your Results"**
- 4 card: Correct Answers, Wrong Answers, Skipped ("N Câu"), Score % + PASSED/FAILED (placement hiện "level assigned").
- Nút: "Review Answers", "Continue", "Try Again", "Back to Units" (placement: "Back").

**Chế độ review**
- Đáp án đúng tô xanh, sai tô đỏ.
- Pronunciation: "Your recording:" + "Reference:" (audio), pill "✓ Passed" / "✗ Failed".
- Writing: "Your answer:" / "Correct answer:".
- Thanh review: điểm %, badge, "← Results", "Continue", "Try Again".

#### Practice Tests `/user/tests`
- **Hero:** "Entrance Placement Test", mô tả, chip ("N exam papers", "Scored automatically", "Level assigned after completion").
- **Danh sách "Available exams — N papers":**
  - Card "Random Exam" (icon xúc xắc) + nút "Start".
  - Các card đề đánh số (tên, mô tả) + nút "Take Exam".
- **Loading:** spinner "Loading exams…".

#### Speaking `/user/speaking`
- **Header:** 🎙️ "Speaking Practice" / "Translate and practice Vietnamese pronunciation".
- **Card dịch:** 2 ô nhập cạnh nhau.
  - 🇬🇧 English (text + nút 🔊).
  - Ở giữa: nút ✕ (xóa) và ⇄.
  - 🇻🇳 Tiếng Việt (text + nút 🔊).
  - Tự dịch khi gõ. Trạng thái: "Translating...", "⚠️ error".
- **Card luyện nói** (hiện khi đã có câu tiếng Việt):
  - Nút tròn lớn "🎤 Record" / "⏹ Stop" có hiệu ứng sóng; dòng "Đang nhận dạng giọng nói...".
  - "You said:" + transcript + 🔊.
  - "Pronunciation Score" dạng pill: ≥85 excellent, ≥60 good, dưới 60 poor.
  - Câu mẫu tô màu từng từ theo chú thích: Correct / Tone/accent / Similar / Wrong / Missing / Extra.

#### 1-on-1 Tutoring `/user/learnOnline`
- **Intro:** "Your personal schedule" / "Find your next class".
- **Lọc:** Search (text "Teacher, specialty or date"), Date (date).
- **Tóm tắt:** "N schedules found" / "N total available".
- **Lưới card:**
  - Avatar giáo viên, tên, pill "Available", specialty, "⭐ x · N reviews".
  - Các dòng Date / Time / Rate ($).
  - Nút "View detail", "Book now" (hoặc "Unavailable" disabled).
- **Trạng thái:** "Loading schedules...", "No schedules available right now…", "No schedules match your filter…".

#### Tutor slot detail `/schedule/:id`
- "← Back".
- **Card giáo viên:** avatar, tên, badge "⭐ x" / "N đánh giá" / "N năm kinh nghiệm", specialty, "$x / hour", mô tả.
- **Card video:** "Teacher Introduction" + "Teacher Reviews" (tóm tắt, filter All / 5★…1★, danh sách review).
- **"Schedule Information":** Date, Start Time, End Time, Status (Available / Booked / Expired), Duration, Total Cost.
- **Nút:** "Book Schedule" (trạng thái "Booking...", "Already Booked").

#### Payment `/payment/:id`
- "← Back". Layout 2 cột.
- **Cột trái:**
  - Card header "Secure Payment" / "Payment Details": Total Amount, Method.
  - Buổi 1-1: badge "Private Lesson" + "Booking Information" (Booking ID, Teacher, Date, Time, Duration, Price / Hour, Total Payment).
  - Lớp nhóm: badge "Online Course" + "Course Information" (Enrollment ID, Course, Teacher, Students, Description, Course Fee).
- **Cột phải:**
  - Tab "Select Payment Method": 💳 "Credit / Debit Card" | 🏦 "Bank Transfer (VietQR)".
  - **Tab thẻ:** "Amount to pay", badge trạng thái (Pending Payment / Payment Failed), nút "Pay Now" / "Continue Payment" ("Processing...") chuyển sang Stripe Checkout.
  - **Tab chuyển khoản:** ảnh QR VietQR; Bank, Account No, Account Name, Amount (VND), Description; nút "I've Transferred".
  - Đã thanh toán: ✓ "Payment Successful" + "View My Classes" / "Go to My Bookings".
  - Đã báo chuyển khoản: ⏳ "Awaiting Confirmation".

#### My Bookings `/my-bookings`
- **Header:** "My Bookings" / "Your booked online classes".
- **Lọc:** Date (date), Status (select: All, Pending Payment, Confirmed, In Progress, Completed, Cancelled, Refunded).
- **Card:** avatar giáo viên, tên, badge trạng thái; Date, Time, Duration, Total Amount.
- **Nút (tùy trạng thái):**
  - "View Detail".
  - "Pay Now" + ghi chú "Please complete payment within 15 minutes…".
  - "Join Room" (mở từ 30 phút trước giờ học đến 15 phút sau khi kết thúc; ngoài khung giờ: "Room not open yet or access expired", disabled).
  - "Write Review", hoặc "Reviewed" (disabled).
  - "Cancel".
- **Trạng thái:** "Loading bookings...", "No bookings found".

#### Booking Detail `/booking/:id`
- "← Back".
- **Card giáo viên:** avatar, tên, specialty, badge trạng thái.
- **"Online Class Room"** (khi In Progress): Room Code, Expired At, nút "Join Room", link "Open class room".
- **"Booking Information":** Booking ID, Booking Date, Class Date, Class Time, Duration, Total Amount, Payment Status, Payment Method, Transaction Code.
- **"Student Review":** Rating / 5, Comment, By.
- **Nút:** "Pay Now", "Write Review" (hoặc dòng "You already reviewed this class."), "Cancel Booking".

#### Video Room `/room/:id`
- "← Back", "Online Class Room", "Booking ID: #".
- Room Code, Expired At, ghi chú "Room is ready…".
- **Nút:** "Create room and join class" ("Creating...") hoặc "Join Room"; link "Open class room".

#### Review `/review/:id`
- **Tiêu đề:** "Teacher Review" hoặc "Course Review".
- **Tóm tắt:** avatar giáo viên, tên, specialty.
  - Buổi 1-1: Class Date, Class Time, Duration, Lesson Fee.
  - Lớp nhóm: Course, Main Topic, Sub Topic, Students, Sessions, Course Fee.
- **Form:** Rating (select 1 Star…5 Stars), Comment (textarea, bắt buộc). Nút "Submit Review".
- **Nếu đã đánh giá:** "Your Review" (⭐ x/5, nội dung, ngày).
- **Nếu chưa được phép:** "Review is available after the class is completed."

#### Group Classes `/teacher/class`
- **Header:** "Find Vietnamese Classes" + nút "My Classes", "Upcoming Schedule".
- **Card "Search Filters":**
  - Class Name (text).
  - Country (select).
  - Minimum Rating (select: Any Rating, 1★+ … 4.5★+).
  - Main Topic (select: Daily Communication, Work, Study, Travel, Exam Preparation, Vietnamese Culture).
  - Sub Topic (select, phụ thuộc Main Topic). Nếu Main Topic là Travel thì thay bằng Province (select) + Specific Location (select).
  - Min Price / Max Price (number).
  - Course Start Date / Course End Date (date).
  - Start Time / End Time (time).
  - Study Days (checkbox Monday…Sunday).
  - Nút "Search Classes", "Clear Filters".
- **Card lớp:**
  - Avatar giáo viên, tên, quốc gia, ⭐.
  - Tiêu đề lớp, badge (Upcoming / Ongoing / Completed / Cancelled / Refunded), giá $.
  - Mô tả, Main Topic, Sub Topic, Time, Students n/max, Sessions, badge các ngày học.
- **Nút (tùy trạng thái):** "View Details", "Enroll Now", "Pay Now", "Cancel Enrollment", "Enter Class", "View Result", "Review Teacher" / "View Review", "Enroll Again".
- **Trạng thái:** "Loading classes...", "No classes found."

#### Class Detail `/user/classdetail/:id`
- **Header:** tiêu đề lớp, mô tả, nút hành động theo trạng thái: "Enroll Now" / "Pay Now" / "Cancel Enrollment", hoặc nhãn "In Progress" / "Completed".
- **Toggle "View/Hide Teacher Information":** avatar, tên, quốc gia, specialty, ⭐, số review, số năm kinh nghiệm, mô tả, video giới thiệu.
- **Toggle "View/Hide Teacher Reviews":** tóm tắt + filter sao + danh sách review.
- **"Course Information"** (lưới key–value): Teacher, Country, Rating, Price, Main Topic, Sub Topic, Students, Total Sessions, Study Time.
- **"Course Curriculum":** card từng buổi ("Session N", topic, Date, Time); buổi đã qua bị làm mờ; nút "Join Zoom Room" (mở trong khoảng ±15 phút quanh giờ học).

#### My Classes `/user/myclass`
- **Header:** "My Classes" + nút "Upcoming Schedule".
- **Lọc:** Class Name (text), Status (select: All, Pending Payment, Upcoming, Ongoing, Completed, Cancelled, Refunded), Study Date (date), nút "Clear".
- **Card:**
  - Giáo viên (avatar, tên, quốc gia).
  - Tiêu đề lớp, giá $, mô tả, Main/Sub Topic, Time, Students, Sessions, badge ngày học.
  - "Enrolled on dd/MM/yyyy", pill trạng thái.
- **Nút:** "View Class", "Pay Now", "Cancel Enrollment", "Enroll Again", "Review Teacher", "View Review".
- **Rỗng:** "No enrolled classes" / "Start learning by joining a class."

#### Upcoming Classes `/user/schedule`
- **Header:** "Upcoming Classes" / "Your upcoming classes and sessions."
- **Card:** tiêu đề lớp, badge "Session N", Teacher, Topic, Date, Time, nút "Join Zoom Room".
- **Rỗng:** "No upcoming sessions" / "There are currently no scheduled classes."

#### Travel Home `/user/travel`
- **Nav tile phía trên:** 🗺️ "My Travel Plans", 📬 "Invites & Requests".
- **Hero:** badge "✈️ Travel with a Local Tutor", H1 "Discover Vietnam Your Own Way", mô tả, CTA "+ Plan a New Trip" (emerald).
- **3 feature card:** Choose Your Destination, Connect with a Tutor, Experience It Deeply.

#### My Travel Plans `/user/travel/trips`
- **Header:** "My Travel Plans" + nút "📋 My Requests", "+ New Trip".
- **Form inline "New Trip" / "Edit Trip":**
  - Province / City (select).
  - Specific location (select, tùy chọn).
  - Contact phone (tel).
  - Start date / End date (date; ghi chú "📅 Trip must start at least 30 days from today.").
  - Nút "Create Trip" / "Save Changes", "Cancel".
- **Lọc:** status (All statuses / Finding Teacher / Matched / Cancelled), From, To (date), "✕ Clear".
- **Card chuyến đi:**
  - 📍 điểm đến + địa điểm cụ thể, badge trạng thái, chip ngày.
  - Banner "Enrolled in a class for this trip" + "View class →".
  - **Chưa ghép cặp:**
    - "🔍 Find Teachers" mở panel "Matching teachers": avatar, tên, 🌍 quốc gia, ngày rảnh; nút "✉ Invite" / "✕ Cancel" / "Reject" / "✓ Accept", "Profile →".
    - "🏫 View Classes" mở panel "Classes created for this trip": tiêu đề, chip "✅ Enrolled", giáo viên, số buổi, giờ, giá; "View detail →".
    - "✏️ Edit", "🗑 Delete".
  - **Đã ghép cặp:** "👤 View Teacher", "🏫 Enroll Now".
- **Trạng thái:**
  - Loading: spinner "Loading trips…".
  - Rỗng: "No trips yet" + nút "Create your first trip".
  - Lọc không ra kết quả: "No trips match the selected filters."

#### Travel Requests `/user/travel/requests`
- **Header:** "Travel Requests" + nút "← My Trips".
- **Lọc:** status (All Statuses / Pending / Accepted / Rejected / Cancelled), From, To, "✕ Clear".
- **Card:**
  - Avatar giáo viên ↔ "You (Student)", badge trạng thái.
  - 📍 điểm đến, 📅 ngày, nhãn "You invited teacher" / "Teacher invited you".
- **Nút:**
  - Pending, do mình gửi: "Cancel".
  - Pending, nhận được: "Reject" / "Accept".
  - Accepted: "View Class Detail".
  - Luôn có: "View Profile".

#### Become a Teacher `/user/become-teacher`
- **Header:** eyebrow "Teacher Dashboard", tiêu đề "Become a Teacher" hoặc "Edit Teacher Profile".
- **Banner trạng thái** "Status: …" + hộp thông báo màu theo trạng thái (xem 4.6):
  - Draft: "Complete your information and submit for review."
  - Submitted: chờ admin duyệt.
  - Approved By Admin: chấp nhận hoặc từ chối mức giá admin đề xuất.
  - Rejected By Admin.
  - Approved Teacher: "Congratulations!…".
  - Rejected By Teacher.
  - Banned.
- **Form** (chỉ sửa được khi Draft hoặc bị từ chối):
  - Specialty (text, bắt buộc).
  - Experience Years (number).
  - Desired Price Per Hour (number).
  - Status (chỉ đọc).
  - Description (textarea, bắt buộc).
  - Introduction Video (file video/*, có player xem trước).
  - English Certificate (file .pdf / .doc / .docx / .jpg / .png) + link "Download File".
  - Chỉ đọc: Approved Price Per Hour, Reviewed Date, Admin Note.
- **Nút:** "Create Profile" / "Update Profile", "Submit Profile" (khi Draft), "Accept Teaching" / "Reject Teaching" (khi Approved By Admin).

### 3.3 Giáo viên

#### Teacher Dashboard `/teacher/dashboard`
- **Header:** "Teacher Dashboard" + month picker + checkbox "All time".
- **Stat card hàng 1:** Total from Students, Completed Earnings ("Finished sessions"), Active Earnings ("Ongoing sessions"), Cancelled (Pending Refund).
- **Stat card hàng 2:** Group Classes, Students ("Unique paid students"), Paid by Admin ("of $X earned (all time)"), "Still Owed to You" / "Overpaid" (card đổi màu cam / đỏ / xanh theo số dư).
- **Bảng "By Course":** Class | Status (badge) | Schedule (start → end) | Fee | Students x/max | Cancelled (cam nếu > 0) | Revenue; dòng tổng "Total (N classes)".
- **Bảng "Monthly Earnings Breakdown":** Month | Total from Students | Completed | Active | Cancelled.
- **Rỗng:** "No group class payments in {period}.", "No earnings records found."

#### My Group Classes `/teacher/listclass`
- **Header:** "My Classes" / "Manage your teaching classes and schedules." + nút "Upcoming Schedule", "Create New Class".
- **Card "Filters":**
  - Class Name (text).
  - Main Topic (select), Sub Topic (select) hoặc Province + Specific Location khi chọn Travel.
  - Class Status (select: All Statuses / Upcoming / Ongoing / Completed); khi đã chọn thì hiện thêm Study Date (date).
  - Start Date / End Date (date), Start Time / End Time (time).
  - Study Days (checkbox Monday…Sunday).
  - Nút "Search", "Clear Filters".
- **Card lớp:** tiêu đề, badge (Upcoming / Ongoing / Completed), giá $, mô tả, Main/Sub Topic, Start Date, Time, "Students: x / max", Sessions, badge ngày học; nút "View Details".

#### Create Class `/class/create`
- **Form "Create Class":**
  - Title (text), Description (textarea).
  - Main Topic (select), Sub Topic (select) hoặc Province + Specific Location khi chọn Travel.
  - Price (number; chữ đỏ nhỏ bên dưới "Maximum allowed price: X").
  - Max Students (number 1–10), Total Sessions (number, mặc định 10).
  - Start Date (date), Start Time / End Time (time, mặc định 19:00 / 20:00).
  - Study Days (checkbox Monday…Sunday).
- **Nút "Generate Schedule"** sinh bảng "Sessions": No | Date | Topic (ô text sửa được cho từng buổi).
- **Cảnh báo ⚠️** (lớp gắn với chuyến du lịch): buổi cuối cách ngày khởi hành dưới 3 ngày thì nút lưu bị disable.
- **Nút:** "Save Class".

#### Class Detail (GV) `/teacher/detail/:id`
- **Header:** tiêu đề lớp / "Class Detail" + nút "Save Changes", "Delete Class" (đỏ).
- **"Class Information"** (lưới): Main Topic, Sub Topic, Price, Students x/max, Total Sessions, Study Time, Start Date, Description.
- **"Enrolled Students (n)":** avatar, tên, quốc gia, "Joined: date". Rỗng: "No students enrolled yet."
- **"Session Content":** badge "Session N", "date · start - end", textarea chủ đề; buổi đã qua bị làm mờ.
- **"Student Reviews (n)":** "⭐ x average", filter sao, danh sách review.

#### Upcoming Teaching Schedule `/teacher/schedule`
- **Header:** "Upcoming Teaching Schedule" / "Your upcoming classes and sessions."
- **Card:** tiêu đề lớp, badge "Session N", Topic, Date, Time, nút "Join Zoom Room".
- **Rỗng:** "No upcoming sessions."

#### My Availability `/admin/schedule`
- **Header:** eyebrow "Teacher dashboard", "Manage Your Schedule" / "Create, edit and organize your teaching availability."
- **Form card "Create New Schedule" / "Update Schedule":** Start Time, End Time (datetime-local); nút "Create Schedule" / "Update Schedule", "Cancel".
- **Lọc:** Filter by Date (date), Status (select: All / Available / Booked / Expired).
- **Tóm tắt:** "Total schedules: n".
- **Lưới card:** ngày, "HH:mm - HH:mm", badge trạng thái, dòng Start / End; nút "Edit", "Delete" (chỉ bật khi slot Available).

#### Student Bookings `/admin/classrooms`
- **Header:** "Teaching Bookings" / "Manage your classes and students".
- **Lọc:** Date (date), Status (select: All, Pending Payment, Confirmed, In Progress, Completed, Cancelled, Refunded).
- **Card:** avatar học viên, tên, badge trạng thái; Date, Time, "Duration n hours", "Revenue $x".
- **Nút:**
  - "View Detail".
  - "Join Room".
  - "Waiting for class time" (disabled).
  - "View Review".
  - "Cancel".

#### Booking Detail (GV) `/admin/bookings/:id`
- **Header:** "← Back", eyebrow "Teaching Session", "Booking Detail".
- **Card học viên:** avatar, tên, badge trạng thái; Booking ID, Booking Date, Class Date, Time, Duration, Payment Status, Payment Method, Transaction Code, Total Revenue.
- **Card "Session Actions":** "Join Room" / "Waiting for class time" / "Cancel Booking".
- **Card "Student Review":** sao, ngày, nội dung. Rỗng: "Student has not reviewed this class yet."

#### Travel Home (GV) `/teacher/travel`
- **Nav tile:** 🗓️ "My Schedules", 📬 "Invites & Requests", 🔍 "Browse Student Trips" (tile này được highlight).
- **Hero:** badge "✈️ Travel Companion", H1 "Share the Beauty of Your Homeland", mô tả, CTA "+ Add a New Travel Schedule".
- **3 feature card:** Set Your Availability, Connect with Students, A Meaningful Journey.

#### My Travel Schedules `/teacher/travel/schedules`
- **Header:** "My Travel Schedules" + nút "My Requests", "+ New Schedule".
- **Form inline:** Tỉnh/Thành phố (select "-- Chọn tỉnh/thành --"), Available From / Available To (date), Status (Open / Closed, chỉ khi sửa); nút "Save" / "Cancel".
- **Card lịch:**
  - 📍 điểm đến, badge Open / Closed, khoảng ngày.
  - Nút: "Find Students", "View Requests", "Edit", "Close", "Delete", "Mở lại".
  - Panel "Matching Students": avatar, tên, quốc gia, ngày, trạng thái chuyến; nút "Invite" / "Cancel" / "Reject" / "Accept", "View Profile".
  - Panel Requests: badge trạng thái, "Accept" / "Reject".
- **Rỗng:** "No schedules yet" + "Create your first schedule".

#### Travel Requests (GV) `/teacher/travel/requests`
Giống màn của học viên, khác ở:
- Nhãn hướng: "You (Teacher)" ↔ học viên; "You invited student" / "Student invited you".
- Khi Accepted: nút "View Class Detail" hoặc "+ Create Class".

#### Students Looking for a Teacher `/teacher/travel/open-trips`
- **Lọc:** Destination (text "e.g. Hà Nội, Đà Nẵng…"), nút "🔍 Search", "✕ Clear".
- **Tóm tắt:** "n trips looking for a teacher".
- **Card chuyến đi:** avatar, tên, 🌍 quốc gia, badge "Finding teacher" / "Enrolled in class", 📍 điểm đến, chip ngày, "Posted dd/MM/yyyy".
- **Footer card (theo trạng thái):**
  - "✉ Invite sent" + "Cancel".
  - "✅ Your schedule matches (dates)" + "✉ Send Invite".
  - "No matching schedule for this destination & dates".
  - "🏫 View my class" / "🏫 Create class for this trip".

### 3.4 Admin

#### Admin Dashboard — Finance `/admin/dashboard`
- **Header:** "Admin Dashboard — Finance" + month picker + checkbox "All time".
- **5 stat card** (viền trái theo thứ tự: mặc định / xanh lá / xanh dương / cam / đỏ):
  - Total Student Payments
  - Completed Learning ("Pay out to teachers")
  - Active Learning ("Pending payout")
  - Cancelled (Pending Refund) ("Needs refund processing")
  - Total Refunded ("Returned to students")
- **Bảng "Monthly Revenue Breakdown":** Month | Total Paid | Completed | Active | Cancelled | Refunded.
- **Bảng "Teacher Payout Reconciliation":**
  - Cột: Teacher (tên + email, ▸ để mở rộng) | Classes | Students | Owed (dòng phụ "group $x · 1-on-1 $y") | Paid Out (dòng phụ "last dd/MM/yyyy") | Balance (nhãn Owed / Overpaid / Settled) | "Record payment".
  - **"Record payment"** mở form inline: Amount (USD, number), Paid on (date), Note (text "e.g. Bank transfer October"); nút "Save" / "Cancel".
  - **Mở rộng dòng** ra 2 bảng con:
    - "Classes": Class | Status | Students | Revenue.
    - "Payout History": Date | Amount | Note | "Delete".
  - Dòng tổng: "Total (N teachers)".
- **Rỗng:** "No financial data found."

#### User Management `/admin/users`
- **Card header:** "User Management" / "Manage all users in the Vietnamese learning system".
- **Lọc:** Search Email (text), Status (select All / Active / Inactive), Role (select All / User / Admin / Moderator / Teacher), nút "Search".
- **Bảng:** # | Name | Email | Country | Bio | Status (select sửa tại chỗ) | Role (select sửa tại chỗ) | Action ("Save").
- **Phân trang:** "Prev" | "Page x / y" | "Next" (10 dòng/trang).

#### Video Management `/admin/videos`
- **Header:** "Video Management" / "Import, review and moderate videos for the platform".
- **Khối:**
  1. Player YouTube.
  2. Chi tiết video: tiêu đề, "Youtube ID", "Status".
  3. Ô import: text "Enter Youtube ID to import" + nút "Import".
  4. Ô tìm: text "Search by Youtube ID" + "Search" + "Back".
  5. Lọc trạng thái: select All / Pending / Approved / Temporarily Locked.
  6. Danh sách video: card có thumbnail, tiêu đề, "ID: x", select trạng thái ngay trên card.
- **Phân trang:** "Prev" | "Page n" | "Next".

#### Level Management `/admin/levels`
- **Header:** "Level Management" / "Create and manage levels used by courses".
- **Bảng sửa trực tiếp:** Name (text) | Description (text) | Active (checkbox) | Delete (checkbox; dòng đánh dấu xóa bị gạch/mờ) | Select (➡ đi tới danh sách course).
- **Nút:** "Add new row", "Save All".

#### Course Management `/admin/courses`
- **Header:** "Course Management" + khối thông tin level (tên, mô tả).
- **Bảng:** Name | Description | Created By | Active | Delete | Select (➡).
- **Nút:** "Add new row", "Save All", "Manage Level Quiz" / "Hide Level Quiz" (nhúng Quiz editor ngay bên dưới).

#### Unit Management `/admin/units`
- **Header:** "Unit Management" + khối thông tin course.
- **Bảng:** Name | Description | Created By | Created Date | Active | Delete (checkbox) | Select (➡).
- **Nút:** "Add unit", "Delete Selected" (đỏ), "Manage Course Quiz" / "Hide Course Quiz".

#### Unit editor `/admin/unitDetail`
- **Card header:** eyebrow "Learning content", "Edit Unit" / "Add New Unit", pill Active / Inactive.
- **Form:**
  - Vùng upload kéo-thả video ("Upload unit video" / "Drag and drop a video here, or click to browse").
  - Video preview + thời lượng.
  - Unit title (text).
  - Description (textarea).
  - Objective (textarea).
  - Checkbox "Publish this unit" (mô tả "Students can access this lesson when it is active.").
  - Nút "Save Unit".
- **Panel quiz** (chỉ khi unit đã lưu): eyebrow "Assessment", "Unit quiz", nút "Manage Quiz" / "Hide Quiz".

#### Quiz editor (component nhúng: unit / course / level / placement)
- **Header:** "Quiz Management", "Total Score: n".
  - Badge: "Mode: Question-only / Part-based / Draft", "Questions: n", "Parts: n", "Timer: n min".
  - Nút "Preview as Student", hoặc "+ Create Quiz" khi chưa có quiz.
- **Thông tin quiz:** Quiz Name (text), "Enable timer" (checkbox) + Time Limit (number, phút), Pass Score (number).
- **Hộp gợi ý:** "Start by adding a question or a part…".
- **Card câu hỏi "Câu N":**
  - Nội dung: textarea "Enter question...", hoặc ảnh/audio có nút ×.
  - Toolbar: upload ảnh, upload audio, ghi âm (mic ↔ stop), "Delete".
  - Score (number).
  - Question Type (select: Multiple Choice / Pronunciation / Writing).
  - Multiple Choice: mỗi đáp án gồm radio chọn đáp án đúng + text "Answer..." hoặc media + toolbar media + "Remove"; nút "+ Add Answer".
  - Writing: "Correct Answer" (text).
- **Card phần:**
  - Part number (number) + Part name (text) + "Delete Part".
  - Textarea "Instruction...".
  - Nút "+ Question" / "+ Passage".
  - Card đoạn văn: textarea "Enter conversation, email, or passage..." hoặc ảnh/audio + các câu hỏi con + "+ Add Question".
- **Footer:** "Save Quiz", "Delete Quiz".
- **Overlay "Student preview":**
  - Header: tên quiz, "Timer: n min", "✕ Close Preview".
  - Nội dung: "Phần N", đoạn văn, "Câu N." với đáp án A., B., …, tag "Written Answer" / "🎤 Pronunciation".

#### Placement Tests `/admin/placements`
Một màn hình, chuyển giữa 2 chế độ.
- **Danh sách:**
  - "Placement Tests" / "Manage your placement test assessments" + nút "+ Create Placement" + badge "Total: n".
  - Bảng: Name | Description | Action ("Manage").
  - Rỗng: "No placement tests yet. Create your first one!"
- **Chi tiết:**
  - "Edit Placement Test", "ID: x", "← Back to List".
  - Form "Test Details": Test Name * (text), Description (textarea).
  - Nút "💾 Save Placement", "+ Manage Quiz" / "✓ Hide Quiz", "🗑️ Delete".

#### Teacher Applications `/admin/teachers`
- **Header:** eyebrow "Admin Dashboard", "Teacher Profile Management" / "Review and manage teacher applications."
- **Tab lọc:** All | Submitted | Approved Admin | Rejected Admin | Approved Teacher | Rejected Teacher | Banned.
- **Lưới card:**
  - Avatar, tên, quốc gia.
  - Experience, Desired Price, Approved Price, Rating, Reviews.
  - Badge ⭐, "n Reviews", badge trạng thái.
  - Nút "View Detail".

#### Teacher Application Detail `/admin/teachers/:id`
- **Khối:**
  1. "← Back".
  2. Card hồ sơ: avatar, tên, specialty, "⭐ x · n Reviews", số năm kinh nghiệm, badge trạng thái, mô tả.
  3. "Teacher Information" (key–value): Country, Experience, Desired Price, Approved Price, Rating, Reviews, Approved By.
  4. "Introduction Video".
  5. "English Certificate" → link "View Certificate".
  6. "Admin Review" (khi Submitted): Approved Price Per Hour (number), Admin Note (textarea).
  7. "Existing Admin Note".
  8. "Teacher Reviews" (filter sao).
- **Nút:** "Approve Teacher" (xanh), "Reject Teacher" (đỏ nhạt), "Ban Teacher" (đen).

#### Pending Bank Transfers `/admin/bank-transfers`
- **Header:** "Pending Bank Transfers" / "Review and confirm payments made via bank transfer".
- **Bảng:** Payment ID | Type (badge Group Class / Private Lesson) | Ref ID | Amount (USD) | Submitted At | Action ("Confirm Payment" → "Confirming...").
- **Rỗng:** "No pending bank transfers."

#### Confirmed Travel Bookings `/admin/travel/bookings`
- **Header:** "Confirmed Travel Bookings" / "List of matched teacher–student travel plans…" + nút "⬇ Export Excel".
- **Lọc:** Confirmed At (date), "Search", "✕ Clear".
- **Tóm tắt:** "n bookings found".
- **Bảng:** # | Destination | Travel Dates | Teacher Name | Teacher Email | Teacher Phone | Student Name | Student Email | Student Phone | Confirmed At.

---

## 4. Components dùng chung

> Code không có component tái sử dụng thật. Dưới đây là các **pattern lặp lại** đã chuẩn hóa để designer dựng thành thư viện component.

### 4.1 Button

| Biến thể | Nền | Chữ | Viền | Ghi chú |
|---|---|---|---|---|
| Primary | gradient `#7c6cff → #4f46e5` (admin: `#7c3aed → #6366f1`) | `#fff` | — | glow shadow |
| Secondary | `#eef2ff` | `#4338ca` | `rgba(99,102,241,.18)` | |
| Ghost | transparent | `#334155` | `rgba(15,23,42,.08)` | hover nền `#f8f7ff` |
| Danger soft | `#fee2e2` | `#dc2626` | — | Delete, Cancel |
| Danger solid | `#ef4444` | `#fff` | — | hover `#dc2626` |
| Back / Neutral | `#f1f5f9` | `#475569` | `#cbd5e1` | "← Back" |
| Success / Travel | `#059669` → `#10b981` | `#fff` | — | Confirm, CTA du lịch |
| Outline (Travel) | `#fff` | `#059669` | 1.5px `#059669` | |
| Special CTA | `#f97316 → #f43f5e` | `#fff` | — | "Become a Teacher" |

- **Kích thước:** min-height 34px (global) / 40px (admin); padding `8px 14px`; radius 6–10px; chữ 13px / 700.
- **Trạng thái:**
  - Hover: nhấc `-1px` và đậm màu hơn.
  - Focus: outline 3px `rgba(124,108,255,.32)`.
  - Disabled: opacity .55–.65, con trỏ not-allowed, bỏ shadow.
  - Loading: đổi nhãn ("Saving...", "Processing...", "Creating...", "Booking..."), không có spinner trong nút.
- **Icon button:** vuông 32–36px dùng cho toolbar media trong Quiz editor (ảnh, audio, mic).

### 4.2 Card

| Loại | Style |
|---|---|
| Card chuẩn | nền `rgba(255,255,255,.92)` hoặc trắng, r16–18, p18–24, shadow card nhẹ, hover nhấc `-4px` |
| Glass card | thêm `backdrop-filter: blur(18px)`, viền `rgba(124,108,255,.16)` |
| Stat card | trắng, r18, p24; tiêu đề 14px `#6b7280`, số 30px / 700, dòng phụ 12px; biến thể viền trái 4px: xanh lá `#16a34a`, xanh dương `#2563eb`, cam `#ea580c`, đỏ `#dc2626`, tím `#7c3aed` |
| Card người (teacher / student / class / booking) | avatar 48–62px + tên + meta + badge góc phải; thân là các dòng label–value; chân card chứa hàng nút |
| Section block | nền `#f5f3ff`, r16 |
| Hero | r24–28, gradient nhạt, CTA lớn |

### 4.3 Table

- **Header:** nền `#f8fafc` (hoặc gradient trắng → `#f3f0ff`), chữ 12–14px / 600–700 `#374151`.
- **Ô:** padding 12–14px, chữ 13px `#334155`, viền dưới `#f1f5f9`.
- **Hover dòng:** `#f9fafb` hoặc `rgba(124,108,255,.05)`.
- **Dòng tổng:** viền trên 2px `#e5e7eb`, chữ đậm.
- **Wrapper:** r16, viền `rgba(124,108,255,.10)`, cuộn ngang trên mobile (min-width ~780px).
- **Biến thể:**
  - Ô sửa trực tiếp: input / select / checkbox nằm trong ô (Levels, Courses, Users).
  - Dòng mở rộng ▸ / ▾ ra bảng con (Admin Finance).
  - Dòng đánh dấu xóa: mờ, input bị disable.

### 4.4 Form input

- **Kiểu dùng:** text, email, password, number, tel, date, time, datetime-local, month, select, textarea, checkbox, radio, file (image / video / audio / document), vùng kéo-thả upload.
- **Input:** radius 6–10px, viền `rgba(15,23,42,.08)` hoặc `#e2e8f0`, padding `8px 10px`, chiều cao 34–40px.
- **Focus:** viền `rgba(124,108,255,.45)` + ring 4px `rgba(124,108,255,.12)`.
- **Label:** 12–13px / 600 `#334155`, đặt phía trên input. Hint: muted, 12px. Lỗi inline: chữ đỏ `#dc2626`, 12px.
- **Lưới form:** 2–3 cột, gộp thành 1 cột dưới 920px.
- **Nhóm checkbox ngày học:** 7 chip Monday…Sunday.

### 4.5 Badge / Status pill

- **Hình dạng:** pill r999, padding `4px 10px`, chữ 11–13px / 600–700.
- Bảng màu dưới đây là **đề xuất thống nhất**; code hiện đang lệch màu giữa các trang (xem Phụ lục).

| Nhóm | Giá trị → màu (nền / chữ) |
|---|---|
| Booking / Enrollment | Pending Payment → warning · Confirmed → success · In Progress → info · Completed → `#e0e7ff` / `#4338ca` · Cancelled → danger · Refunded → `#f3e8ff` / `#7e22ce` |
| Lớp (vòng đời) | Upcoming → `#e0e7ff` / `#4338ca` · Ongoing → info · Completed → success · Cancelled → danger · Refunded → violet |
| Hồ sơ giáo viên | Created/Draft → neutral · Submitted → warning · Approved By Admin → info · Rejected By Admin → danger · Approved Teacher → success · Rejected Teacher → danger nhạt · Banned → `#111827` / `#fff` |
| Slot 1-1 | Available → success · Booked → warning · Expired → danger |
| Thanh toán | Pending → `#facc15` / `#111827` · Success → `#22c55e` / `#fff` · Failed → `#ef4444` / `#fff` |
| Travel request | Pending → warning · Accepted → success · Rejected → danger · Cancelled → neutral |
| Travel trip | Finding Teacher → info · Matched → success · Cancelled → danger · Invite sent → `#ede9fe` / `#6d28d9` |
| Lịch du lịch GV | Open → success · Closed → neutral |
| Video | Pending → warning · Approved → success · Temporarily Locked → danger |
| Unit | Active → success · Inactive → danger |
| Kết quả quiz | PASSED → success · FAILED → danger |
| Loại thanh toán | Private Lesson → `#eff6ff` / `#2563eb` · Group Class → `#f0fdf4` / `#16a34a` |
| Role chip (sidebar) | `rgba(79,70,229,.1)` / `#4f46e5` |
| Tag mặc định | `rgba(124,108,255,.12)` / `#5a2db5` |

### 4.6 Alert box (inline)

- **Info:** `#eef2ff` / `#4338ca`.
- **Pending:** `#fffbeb` / `#92400e`.
- **Success:** `#ecfdf5` / `#065f46`.
- **Error:** `#fef2f2` / `#991b1b`.
- Bo r12, padding 12–16px, có thể kèm icon emoji đầu dòng. Dùng ở Become a Teacher, Speaking, cảnh báo ⚠️ khi tạo lớp.

### 4.7 Tabs / Filter pills / Segmented

- **Filter pill** (lọc sao, lọc trạng thái): viền 1.5px `#e2e8f0`, chữ `#64748b`; hover viền `#8b5cf6`; active nền `#7c3aed`, chữ trắng.
- **Method tab** (Payment): card r14, viền 2px `#e5e7eb`, nền `#f9fafb`; active viền `#4f46e5`, nền `#eef2ff` + ring 3px.
- **Part tab** (Quiz): pill viền `#d1d5db`; active navy `#1e3a8a` chữ trắng; đã xong `#f0fdf4` / `#15803d`.
- **Segmented switch** (sidebar Admin: "Admin tools | Teacher panel"): 2 nút r14, nút active dùng gradient chính.
- **Toggle "View / Hide …":** nút secondary đổi nhãn khi bấm, nội dung xổ xuống ngay bên dưới (thay cho modal).

### 4.8 Pagination

- Bố cục: "Prev" | "Page x / y" | "Next".
- Nút cao 36px, r10, gradient `#2563eb → #3b82f6`, chữ 12px / 700; disabled opacity .55.

### 4.9 Avatar

- Tròn; các cỡ 36 (header), 38 (dropdown), 48 (mặc định), 60–62 (card / sidebar), 72 (lớn).
- Fallback: gradient `#7c3aed → #6366f1` + chữ cái đầu tên màu trắng.
- Sidebar dùng avatar bo r22 (squircle).

### 4.10 Empty / Loading / Feedback

- **Empty state** (3 kiểu):
  - Chữ xám căn giữa (`#9ca3af`, p48).
  - Hộp viền đứt 2px `#d1d5db`, r18–20, p40–80, kèm tiêu đề, mô tả và CTA.
  - Panel nhạt `#f8f6ff` viền đứt `rgba(124,108,255,.22)`.
- **Loading:** dòng chữ "Loading…" `#94a3b8`, hoặc spinner 36px (track `#e5e7eb`, đầu `#4f46e5`).
- **Overlay / modal:**
  - Nền phủ `rgba(15,23,42,.55)`; hộp trắng r12–20, shadow modal, nút "✕ Close" ở header; bấm ra ngoài để đóng.
  - Hiện có: Quiz preview (toàn màn), Currency modal (400px).
- **Xác nhận và thông báo:** hiện dùng dialog native của trình duyệt. Designer nên thiết kế 2 component mới: **Confirm dialog** (tiêu đề, nội dung, Cancel / Confirm, biến thể danger) và **Toast** (success / error / info, góc trên phải).

### 4.11 Thành phần đặc thù

- **Header dropdown:** rộng 220px, r22; trên cùng là avatar 38 + tên + role, kẻ phân cách `#f3f4f6`, item "Profile", "Log out" (hover `#fef2f2` / `#dc2626`).
- **Sidebar menu item:** cao tối thiểu 40px, padding `9px 14px`, r12, nền trắng, viền hairline, chữ 13px / 700 `#334155`; hover và active dùng gradient chính, chữ trắng, nhấc `-1px`.
- **Learning-path node:** nút tròn ~64px; trạng thái done (xanh lá ✓), current (primary ▶ + vòng pulse), locked (xám 🔒); node ★ cho skip test.
- **Quiz navigator:** lưới ô số vuông 32–36px; trạng thái default / current / answered (xanh) / flagged (vàng); có chú thích màu.
- **Recorder button:** nút tròn lớn 72–96px, idle 🎤, recording ⏹ đỏ + sóng lan (ripple); dòng trạng thái bên dưới.
- **Word-diff highlight** (Speaking): từng từ là chip màu: Correct xanh, Tone/accent cam, Similar vàng, Wrong đỏ, Missing xám gạch, Extra tím.
- **Media field** (Quiz editor): một ô có thể là text, ảnh hoặc audio, kèm toolbar 3 icon và nút × để gỡ media.
- **Upload drop zone:** viền đứt, icon, 2 dòng chữ, hover đổi nền tím nhạt; sau khi chọn thì hiện preview.

---

## 5. Luồng sử dụng chính

1. **Đăng ký / đăng nhập**
   - `/user/register` → tự đăng nhập → `/home`.
   - `/login` → `/home` (mọi role đều về đây; chỉ menu sidebar khác nhau theo role).
   - Phiên hết hạn (401) → quay về `/login`.
2. **Tự học**
   - Practice Tests → Quiz (Placement) → kết quả → hộp xác nhận "level assigned" → Learning path.
   - Learning path → bấm unit hiện tại → Lesson view (video) → "Start Test" → Quiz → Submit (hoặc hết giờ tự nộp) → "Your Results" → "Review Answers" / "Continue" (mở khóa unit kế tiếp) / "Try Again".
   - Lối tắt: node ★ Skip Course Test, nút 🏆 Skip Level Test.
3. **Gia sư 1-1 (học viên)**
   - 1-on-1 Tutoring → (Tutor slot detail) → "Book now" → Payment.
   - Payment: Stripe Checkout → My Bookings; hoặc VietQR "I've Transferred" → chờ admin xác nhận.
   - My Bookings → Booking Detail → "Join Room" → sau buổi học "Write Review" → Review → My Bookings.
4. **Gia sư 1-1 (giáo viên)**
   - My Availability: tạo slot.
   - Student Bookings → View Detail → Join Room → View Review.
5. **Lớp nhóm**
   - Học viên: Group Classes (lọc) → Class Detail → "Enroll Now" → Payment → My Classes → Upcoming → "Join Zoom Room" → "Review Teacher".
   - Giáo viên: My Group Classes → "Create New Class" → điền form → "Generate Schedule" → sửa chủ đề từng buổi → "Save Class" → Class Detail (sửa chủ đề, xem học viên) → Upcoming Teaching Schedule → "Join Zoom Room".
6. **Luyện nói:** Speaking → gõ câu (tự dịch) → 🔊 nghe mẫu → 🎤 ghi âm → điểm + tô màu từng từ.
7. **Du lịch cùng gia sư**
   - Học viên: Travel Home → My Travel Plans → "+ New Trip" → "Find Teachers" → "✉ Invite".
   - Giáo viên: My Travel Schedules → "Find Students" / Browse Student Trips → "Send Invite".
   - Bên nhận chọn "Accept" → giáo viên "+ Create Class" (địa điểm điền sẵn) → học viên "Enroll Now" → Payment.
   - Admin: Confirmed Travel Bookings → "Export Excel".
8. **Trở thành giáo viên**
   - Become a Teacher → điền form + upload video và chứng chỉ → "Create Profile" → "Submit Profile".
   - Admin: Teacher Applications (tab Submitted) → Detail → nhập giá + ghi chú → "Approve Teacher" / "Reject Teacher" / "Ban Teacher".
   - Người nộp: "Accept Teaching" → trở thành giáo viên (menu Teacher panel).
9. **Soạn nội dung (Admin)**
   - Level Management → ➡ Course Management → ➡ Unit Management → "Add unit" → Unit editor.
   - Unit editor: upload video, điền thông tin, "Save Unit" → "Manage Quiz" → "+ Create Quiz".
   - Trong quiz: "+ Question" hoặc "+ Part" → (Passage) → câu hỏi → "Save Quiz" → "Preview as Student".
   - Placement: Placement Tests → "Manage" → "Save Placement" → "+ Manage Quiz".
10. **Tài chính (Admin)**
    - Admin Dashboard → chọn tháng → mở rộng dòng giáo viên → "Record payment".
    - Giáo viên thấy số tiền ở "Paid by Admin" / "Still Owed to You".
    - Pending Bank Transfers → "Confirm Payment".

---

## 6. Menu / điều hướng

### 6.1 App shell

```
┌────────────────────────────────────────────────────────────────────────┐ ← thanh shimmer 3px
│ [logo] VietPhuong          (nav links | lời chào)       [CTA | avatar▾] │ header 68px, sticky
│        tagline                                                          │
├──────────────┬─────────────────────────────────────────────────────────┤
│ Profile card │                                                         │
│ (avatar,     │   Khung nội dung: nền trắng, r20, p24, shadow lớn       │
│  tên, role)  │                                                         │
│ [switch]     │                                                         │
│ Menu items   │                                                         │
│ 220px sticky │                                                         │
├──────────────┴─────────────────────────────────────────────────────────┤
│ Footer tối (rgba(15,23,42,.98)): thông tin đồ án | liên hệ | ©          │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Header

- **Guest:**
  - Giữa: Courses (`/user/units`), Speaking (`/user/speaking`), Tutoring (`/user/learnOnline`), Live Classes (`/teacher/class`); mỗi link có icon SVG 14px.
  - Phải: "Đăng nhập" (ghost), "Đăng ký miễn phí" (primary).
- **Đã đăng nhập:**
  - Giữa: "Hello, **{name}**" / "Keep up the great work today!".
  - Phải: avatar mở dropdown (tên, role, Profile, Log out).
- **Dưới 860px:** ẩn nav giữa, lời chào và tagline; sidebar chuyển thành khối xếp chồng phía trên nội dung.

### 6.3 Sidebar theo vai trò

| Guest | Student | Admin — "Admin tools" (và Moderator) | Admin — "Teacher panel" (Teacher) |
|---|---|---|---|
| Home | Home | Home | Home |
| Vocabulary Search | Dashboard | Dashboard (`/admin/dashboard`) | Dashboard (`/teacher/dashboard`) |
| | Vocabulary Search | Manage Users | Teacher Applications *(chỉ Admin)* |
| | Courses | Manage Videos | My Group Classes |
| | Practice Tests | Manage Lessons | ✈️ Travel Schedules |
| | Practice Speaking | Manage Tests | Teacher Profile |
| | Group Classes | ✈️ Travel Bookings | My Availability |
| | ✈️ Travel Plans | | Student Bookings |
| | ✨ Become a Teacher *(nút cam)* | | |
| | 1-on-1 Tutoring | | |
| | My Bookings | | |

- **Chip role** trên profile card: Student / Administrator / tên role / Guest.
- **Switch 2 nút "Admin tools | Teacher panel"** chỉ hiện với Admin, mặc định "Admin tools".
- **Màn không có trong menu**, chỉ vào được qua liên kết từ màn khác:
  - Payment, Room, Review, Public profile, các màn con của Travel, Class/Booking detail.
  - `/admin/bank-transfers`: không có link nào, cần thêm vào menu Admin.

### 6.4 Điều hướng trong trang

- Nút "← Back" ở đầu các màn chi tiết.
- Drill-down bằng ➡ ở bảng Level → Course → Unit.
- Nav tile ở đầu module Travel.
- Hai màn có phân trang: Users, Videos.
- Không có breadcrumb.

---

## Phụ lục — Điểm bất nhất cần designer quyết định

1. **Màu primary không thống nhất:** `#7c6cff` (header), gradient `#7c3aed→#6366f1` (menu, admin), `#4338ca` (home), `#2563eb` (pagination, save), emerald (travel), navy (quiz). Nên chọn 1 primary + 1 gradient.
2. **Cùng trạng thái nhưng khác màu giữa các trang** (ví dụ Completed khi xanh lá, khi xanh dương, khi xám). Badge hồ sơ giáo viên chưa có màu riêng. Nên dùng bảng ở mục 4.5.
3. **Font:** Inter và Nunito được khai báo nhưng không load; quiz dùng Times New Roman. Cần chốt 1 font (đề xuất Inter, có hỗ trợ tiếng Việt).
4. **Trộn ngôn ngữ:** header tiếng Việt ("Đăng nhập", "Đăng ký miễn phí"), phần còn lại tiếng Anh, rải rác "Câu", "Phần", "đánh giá" và các alert tiếng Việt.
5. **Thiếu component phản hồi:** cần thiết kế Toast và Confirm dialog để thay dialog native của trình duyệt.
6. **Lỗi hiển thị:**
   - Booking Detail có 2 field Payment Status / Payment Method luôn trống.
   - Profile hiển thị Status dạng số.
   - Bảng Unit hiển thị Active dạng `true` / `false`.
   - Nhãn "Contry" sai chính tả.
7. **Link và control chết:**
   - "Create Account" ở Login trỏ tới `/register` (route không tồn tại).
   - "Forgot password?" và "Remember me" không có tác dụng.
   - Chưa có màn quên mật khẩu.
8. **Tiền tệ:** $ ở mọi nơi, riêng Public profile hiện VND; chuyển khoản VietQR hiện VND.
9. **Thời hạn thanh toán ghi khác nhau:** "15 minutes" (My Bookings) và "5 minutes" (Booking Detail).
10. **Thiếu màn:** điểm danh lớp nhóm, AI chat tutor, trang 404, thông báo kết quả sau khi quay về từ Stripe.
11. **Moderator và Teacher:** route học viên `/teacher/class` dễ nhầm; Moderator thấy menu quản trị chứ không thấy Teacher panel. Cần chốt lại IA (cấu trúc thông tin) theo role.
