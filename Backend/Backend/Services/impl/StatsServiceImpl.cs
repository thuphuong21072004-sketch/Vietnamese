using Backend.Common;
using Backend.Data;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using Backend.common;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.impl
{
    public class StatsServiceImpl : StatsService
    {
        private readonly AppDbContext _ctx;
        private readonly UserContextUtil _userCtx;
        private readonly UserRepository _userRepo;
        private readonly TeacherProfileRepository _profileRepo;

        public StatsServiceImpl(
            AppDbContext ctx,
            UserContextUtil userCtx,
            UserRepository userRepo,
            TeacherProfileRepository profileRepo)
        {
            _ctx = ctx;
            _userCtx = userCtx;
            _userRepo = userRepo;
            _profileRepo = profileRepo;
        }

        // ──────────────────────────────────────────────
        // STUDENT
        // ──────────────────────────────────────────────

        public async Task<StudentPaymentStatsDto> GetStudentStats(int? year, int? month)
        {
            var email = _userCtx.GetEmail();
            int userId = (await _userRepo.GetUserIdByEmail(email))!.Value;

            return await BuildStudentStats(userId, year, month);
        }

        private async Task<StudentPaymentStatsDto> BuildStudentStats(int userId, int? year, int? month)
        {
            // All bookings by this student
            var bookingIds = await _ctx.Bookings
                .Where(b => b.StudentId == userId)
                .Select(b => new { b.BookingId, b.Status })
                .ToListAsync();

            // All class enrollments by this student
            var enrollmentIds = await _ctx.ClassEnrollments
                .Where(ce => ce.StudentId == userId)
                .Select(ce => new { ce.EnrollmentId, ce.ClassId, ce.Status })
                .ToListAsync();

            // Payments for those bookings
            var bkIds = bookingIds.Select(x => x.BookingId).ToList();
            var enIds = enrollmentIds.Select(x => x.EnrollmentId).ToList();

            var bookingPayments = await _ctx.Payments
                .Where(p => p.RefName == Constant.RefName.Booking && bkIds.Contains(p.RefId))
                .ToListAsync();

            var enrollmentPayments = await _ctx.Payments
                .Where(p => p.RefName == Constant.RefName.Class && enIds.Contains(p.RefId))
                .ToListAsync();

            // Build lookup for status
            var bkStatus = bookingIds.ToDictionary(x => x.BookingId, x => x.Status);
            var enStatus = enrollmentIds.ToDictionary(x => x.EnrollmentId, x => x.Status);

            // Apply year/month filter for summary
            var bp = bookingPayments.Where(p => InPeriod(p, year, month)).ToList();
            var ep = enrollmentPayments.Where(p => InPeriod(p, year, month)).ToList();

            var dto = new StudentPaymentStatsDto
            {
                TotalPaid = SumSuccess(bp) + SumSuccess(ep),

                CompletedLearning =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed)
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed)
                      .Sum(p => p.Amount),

                ActiveLearning =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && (bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                            || bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress))
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && (enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                            || enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress))
                      .Sum(p => p.Amount),

                CancelledUnrefunded =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled)
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled)
                      .Sum(p => p.Amount),

                Refunded = SumRefunded(bp) + SumRefunded(ep),
            };

            // Monthly breakdown — full dataset (no period filter)
            dto.MonthlyBreakdown = BuildStudentMonthly(bookingPayments, bkStatus, enrollmentPayments, enStatus);

            // Khóa học (lớp nhóm) đã thanh toán trong kỳ
            var enrollmentClass = enrollmentIds.ToDictionary(x => x.EnrollmentId, x => x.ClassId);

            var paidCourses = ep
                .Where(p => p.Status == Constant.StatusPayment.Success)
                .GroupBy(p => p.RefId)
                .Select(g => new { EnrollmentId = g.Key, Amount = g.Sum(p => p.Amount), PaidAt = g.Max(p => p.PaidAt) })
                .ToList();

            var classIds = paidCourses.Select(c => enrollmentClass[c.EnrollmentId]).Distinct().ToList();
            var meta = (await LoadClassMeta(_ctx.TeacherClasses.Where(tc => classIds.Contains(tc.ClassId))))
                .ToDictionary(m => m.ClassId);

            dto.Courses = paidCourses
                .Select(c =>
                {
                    var m = meta[enrollmentClass[c.EnrollmentId]];
                    return new StudentCourseDto
                    {
                        ClassId = m.ClassId,
                        Title = m.Title,
                        TeacherName = m.TeacherName,
                        Status = m.Status,
                        EnrollmentStatus = enStatus.GetValueOrDefault(c.EnrollmentId),
                        PaidAt = c.PaidAt,
                        Amount = c.Amount,
                    };
                })
                .OrderByDescending(c => c.PaidAt)
                .ToList();

            var activeCourses = dto.Courses.Where(c => IsActiveEnrollment(c.EnrollmentStatus)).ToList();
            dto.CourseCount = activeCourses.Select(c => c.ClassId).Distinct().Count();
            dto.CourseTotal = activeCourses.Sum(c => c.Amount);

            return dto;
        }

        // ──────────────────────────────────────────────
        // TEACHER
        // ──────────────────────────────────────────────

        public async Task<TeacherEarningsStatsDto> GetTeacherStats(int? year, int? month)
        {
            var email = _userCtx.GetEmail();
            int userId = (await _userRepo.GetUserIdByEmail(email))!.Value;

            return await BuildTeacherStats(userId, year, month);
        }

        private async Task<TeacherEarningsStatsDto> BuildTeacherStats(int userId, int? year, int? month)
        {
            // Private lesson bookings where this teacher is instructor
            var bookings = await _ctx.Bookings
                .Where(b => b.InstructorId == userId)
                .Select(b => new BookingRow(b.BookingId, b.InstructorId, b.Status, b.EndTime))
                .ToListAsync();

            // Group class enrollments via teacher's classes
            var profile = await _profileRepo.GetByUserId(userId);
            var enrollments = new List<EnrollmentRow>();

            if (profile != null)
            {
                enrollments = await _ctx.ClassEnrollments
                    .Where(ce => ce.TeacherClass != null && ce.TeacherClass.TeacherProfileId == profile.TeacherProfileId)
                    .Select(ce => new EnrollmentRow(ce.EnrollmentId, ce.ClassId, ce.StudentId, ce.Status))
                    .ToListAsync();
            }

            var bkIds = bookings.Select(x => x.BookingId).ToList();
            var enIds = enrollments.Select(x => x.EnrollmentId).ToList();

            var bookingPayments = bkIds.Any()
                ? await _ctx.Payments
                    .Where(p => p.RefName == Constant.RefName.Booking && bkIds.Contains(p.RefId))
                    .ToListAsync()
                : new List<Payment>();

            var enrollmentPayments = enIds.Any()
                ? await _ctx.Payments
                    .Where(p => p.RefName == Constant.RefName.Class && enIds.Contains(p.RefId))
                    .ToListAsync()
                : new List<Payment>();

            var bkStatus = bookings.ToDictionary(x => x.BookingId, x => x.Status);
            var enStatus = enrollments.ToDictionary(x => x.EnrollmentId, x => x.Status);

            var bp = bookingPayments.Where(p => InPeriod(p, year, month)).ToList();
            var ep = enrollmentPayments.Where(p => InPeriod(p, year, month)).ToList();

            var dto = new TeacherEarningsStatsDto
            {
                TotalFromStudents = SumSuccess(bp) + SumSuccess(ep),

                CompletedEarnings =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed)
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed)
                      .Sum(p => p.Amount),

                ActiveEarnings =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && (bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                            || bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress))
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && (enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                            || enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress))
                      .Sum(p => p.Amount),

                CancelledUnrefunded =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled)
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled)
                      .Sum(p => p.Amount),
            };

            dto.MonthlyBreakdown = BuildTeacherMonthly(bookingPayments, bkStatus, enrollmentPayments, enStatus);

            // Theo từng lớp nhóm + đối soát với admin (dùng lại dữ liệu đã tải ở trên)
            decimal groupOwed = 0;
            if (profile != null)
            {
                var calcs = ComputeClasses(
                    await LoadClassMeta(_ctx.TeacherClasses.Where(tc => tc.TeacherProfileId == profile.TeacherProfileId)),
                    enrollments, enrollmentPayments, year, month);
                var visible = VisibleClasses(calcs, year, month);

                dto.Classes = visible.Select(c => c.Dto).ToList();
                dto.ClassCount = dto.Classes.Count;
                dto.StudentCount = visible.SelectMany(c => c.PeriodStudents).Distinct().Count();
                groupOwed = calcs.Sum(c => c.Owed);
            }

            var privateOwed = ComputePrivateOwed(bookings, bookingPayments).GetValueOrDefault(userId);
            dto.TotalOwed = groupOwed + privateOwed;
            dto.TotalPaidOut = await _ctx.TeacherPayouts
                .Where(p => p.TeacherUserId == userId)
                .SumAsync(p => (decimal?)p.Amount) ?? 0;
            dto.Balance = dto.TotalOwed - dto.TotalPaidOut;

            return dto;
        }

        // ──────────────────────────────────────────────
        // ADMIN
        // ──────────────────────────────────────────────

        public async Task<AdminPaymentStatsDto> GetAdminStats(int? year, int? month)
        {
            // All booking payments
            var allBookings = await _ctx.Bookings
                .Select(b => new BookingRow(b.BookingId, b.InstructorId, b.Status, b.EndTime))
                .ToListAsync();

            var allEnrollments = await _ctx.ClassEnrollments
                .Select(ce => new
                {
                    ce.EnrollmentId,
                    ce.ClassId,
                    ce.StudentId,
                    ce.Status,
                    TeacherUserId = ce.TeacherClass != null && ce.TeacherClass.TeacherProfile != null
                        ? ce.TeacherClass.TeacherProfile.UserId : (int?)null
                })
                .ToListAsync();

            var bkPayments = await _ctx.Payments
                .Where(p => p.RefName == Constant.RefName.Booking)
                .ToListAsync();

            var enPayments = await _ctx.Payments
                .Where(p => p.RefName == Constant.RefName.Class)
                .ToListAsync();

            // Lookups
            var bkStatus = allBookings.ToDictionary(x => x.BookingId, x => x.Status);
            var bkTeacher = allBookings.ToDictionary(x => x.BookingId, x => x.InstructorId);
            var enStatus = allEnrollments.ToDictionary(x => x.EnrollmentId, x => x.Status);
            var enTeacher = allEnrollments.ToDictionary(x => x.EnrollmentId, x => x.TeacherUserId);

            var bp = bkPayments.Where(p => InPeriod(p, year, month)).ToList();
            var ep = enPayments.Where(p => InPeriod(p, year, month)).ToList();

            var allSuccess = bp.Where(p => p.Status == Constant.StatusPayment.Success)
                .Concat(ep.Where(p => p.Status == Constant.StatusPayment.Success)).ToList();

            var dto = new AdminPaymentStatsDto
            {
                TotalStudentPayments = allSuccess.Sum(p => p.Amount),

                TotalCompletedLearning =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed)
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed)
                      .Sum(p => p.Amount),

                TotalActiveLearning =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && (bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                            || bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress))
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && (enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                            || enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress))
                      .Sum(p => p.Amount),

                TotalCancelledUnrefunded =
                    bp.Where(p => p.Status == Constant.StatusPayment.Success
                        && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled)
                      .Sum(p => p.Amount)
                    + ep.Where(p => p.Status == Constant.StatusPayment.Success
                        && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled)
                      .Sum(p => p.Amount),

                TotalRefunded = SumRefunded(bp) + SumRefunded(ep),
            };

            // Monthly breakdown (full dataset, no period filter)
            dto.MonthlyBreakdown = BuildAdminMonthly(bkPayments, bkStatus, enPayments, enStatus);

            // Theo lớp nhóm (kỳ) + đối soát trả tiền (lũy kế)
            // dùng lại enrollments / payments / bookings đã tải ở trên, không truy vấn lại
            var classCalcs = ComputeClasses(
                await LoadClassMeta(_ctx.TeacherClasses),
                allEnrollments.Select(e => new EnrollmentRow(e.EnrollmentId, e.ClassId, e.StudentId, e.Status)).ToList(),
                enPayments, year, month);
            var visibleClasses = VisibleClasses(classCalcs, year, month);
            var visibleByTeacher = visibleClasses.ToLookup(c => c.TeacherUserId);
            dto.UniqueStudentCount = visibleClasses.SelectMany(c => c.PeriodStudents).Distinct().Count();
            var groupOwed = classCalcs
                .GroupBy(c => c.TeacherUserId)
                .ToDictionary(g => g.Key, g => g.Sum(c => c.Owed));
            var privateOwed = ComputePrivateOwed(allBookings, bkPayments);
            var paidOut = await _ctx.TeacherPayouts
                .GroupBy(p => p.TeacherUserId)
                .Select(g => new { TeacherUserId = g.Key, Amount = g.Sum(p => p.Amount), LastPaidAt = g.Max(p => p.PaidAt) })
                .ToDictionaryAsync(x => x.TeacherUserId);

            // Per-teacher breakdown
            var teacherUserIds = bkTeacher.Values.OfType<int>()
                .Concat(enTeacher.Values.OfType<int>())
                .Concat(paidOut.Keys)
                .Distinct().ToList();

            var teacherUsers = await _ctx.Users
                .Where(u => teacherUserIds.Contains(u.UserId))
                .Select(u => new { u.UserId, u.Name, u.Email })
                .ToListAsync();

            dto.TeacherPayouts = teacherUsers.Select(t =>
            {
                var tbp = bp.Where(p => bkTeacher.GetValueOrDefault(p.RefId) == t.UserId).ToList();
                var tep = ep.Where(p => enTeacher.GetValueOrDefault(p.RefId) == t.UserId).ToList();
                var classes = visibleByTeacher[t.UserId].ToList();
                var owedGroup = groupOwed.GetValueOrDefault(t.UserId);
                var owedPrivate = privateOwed.GetValueOrDefault(t.UserId);
                var paid = paidOut.GetValueOrDefault(t.UserId);
                return new TeacherPayoutDto
                {
                    ClassCount = classes.Count,
                    StudentCount = classes.SelectMany(c => c.PeriodStudents).Distinct().Count(),
                    Classes = classes.Select(c => c.Dto).ToList(),
                    GroupOwed = owedGroup,
                    PrivateOwed = owedPrivate,
                    TotalOwed = owedGroup + owedPrivate,
                    TotalPaidOut = paid?.Amount ?? 0,
                    Balance = owedGroup + owedPrivate - (paid?.Amount ?? 0),
                    LastPaidAt = paid?.LastPaidAt,
                    UserId = t.UserId,
                    TeacherName = t.Name,
                    Email = t.Email,
                    TotalFromStudents = SumSuccess(tbp) + SumSuccess(tep),
                    CompletedEarnings =
                        tbp.Where(p => p.Status == Constant.StatusPayment.Success
                            && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed).Sum(p => p.Amount)
                        + tep.Where(p => p.Status == Constant.StatusPayment.Success
                            && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed).Sum(p => p.Amount),
                    ActiveEarnings =
                        tbp.Where(p => p.Status == Constant.StatusPayment.Success
                            && (bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                                || bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress)).Sum(p => p.Amount)
                        + tep.Where(p => p.Status == Constant.StatusPayment.Success
                            && (enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                                || enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress)).Sum(p => p.Amount),
                    CancelledUnrefunded =
                        tbp.Where(p => p.Status == Constant.StatusPayment.Success
                            && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled).Sum(p => p.Amount)
                        + tep.Where(p => p.Status == Constant.StatusPayment.Success
                            && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled).Sum(p => p.Amount),
                };
            }).OrderByDescending(t => t.Balance).ThenByDescending(t => t.TotalFromStudents).ToList();

            return dto;
        }

        // ──────────────────────────────────────────────
        // ADMIN — GHI NHẬN ĐÃ TRẢ GIÁO VIÊN
        // ──────────────────────────────────────────────

        public async Task<List<PayoutRecordDto>> GetPayouts(int? teacherUserId)
        {
            return await _ctx.TeacherPayouts
                .Where(p => teacherUserId == null || p.TeacherUserId == teacherUserId)
                .OrderByDescending(p => p.PaidAt)
                .Select(p => new PayoutRecordDto
                {
                    PayoutId = p.PayoutId,
                    TeacherUserId = p.TeacherUserId,
                    TeacherName = p.Teacher != null ? p.Teacher.Name : "",
                    Amount = p.Amount,
                    PaidAt = p.PaidAt,
                    Note = p.Note,
                    CreatedBy = p.CreatedBy,
                })
                .ToListAsync();
        }

        public async Task<PayoutRecordDto> CreatePayout(CreatePayoutDto request)
        {
            if (request.Amount <= 0)
                throw new ArgumentException("Amount must be greater than 0");

            // ngày trả: không ở tương lai (cho lệch 1 ngày vì múi giờ), không quá 5 năm trước
            var now = DateTime.UtcNow;
            if (request.PaidAt is DateTime paidAt
                && (paidAt > now.AddDays(1) || paidAt < now.AddYears(-5)))
                throw new ArgumentException("Payment date must be within the last 5 years and not in the future");

            // người nhận phải có hồ sơ giáo viên (admin cũng có thể dạy nên không xét theo role)
            var teacher = await _ctx.TeacherProfiles
                .Where(tp => tp.UserId == request.TeacherUserId && tp.User != null)
                .Select(tp => new { tp.User!.UserId, tp.User.Name })
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("Teacher not found");

            var payout = new TeacherPayout
            {
                TeacherUserId = teacher.UserId,
                Amount = request.Amount,
                PaidAt = request.PaidAt ?? DateTime.UtcNow,
                Note = request.Note,
                CreatedBy = _userCtx.GetEmail(),
                CreatedDate = DateTime.UtcNow,
            };
            _ctx.TeacherPayouts.Add(payout);
            await _ctx.SaveChangesAsync();

            return new PayoutRecordDto
            {
                PayoutId = payout.PayoutId,
                TeacherUserId = payout.TeacherUserId,
                TeacherName = teacher.Name,
                Amount = payout.Amount,
                PaidAt = payout.PaidAt,
                Note = payout.Note,
                CreatedBy = payout.CreatedBy,
            };
        }

        public async Task DeletePayout(int payoutId)
        {
            // xoá mềm: bản ghi tài chính vẫn còn trong DB kèm người xoá / thời điểm
            var payout = await _ctx.TeacherPayouts
                .FirstOrDefaultAsync(p => p.PayoutId == payoutId)
                ?? throw new KeyNotFoundException("Payout not found");
            payout.DeletedAt = DateTime.UtcNow;
            payout.DeletedBy = _userCtx.GetEmail();
            await _ctx.SaveChangesAsync();
        }

        // ──────────────────────────────────────────────
        // HELPERS
        // ──────────────────────────────────────────────

        private sealed class ClassMeta
        {
            public int ClassId { get; init; }
            public string Title { get; init; } = "";
            public int TeacherUserId { get; init; }
            public string TeacherName { get; init; } = "";
            public decimal Price { get; init; }
            public int MaxStudents { get; init; }
            public DateOnly? FirstDate { get; init; }
            public DateOnly? LastDate { get; init; }
            public string Status { get; init; } = "";
        }

        private sealed class ClassCalc
        {
            public ClassRevenueDto Dto { get; init; } = new();
            public int TeacherUserId { get; init; }
            public bool HasPeriodPayment { get; set; }
            public HashSet<int> PeriodStudents { get; } = new();
            // lũy kế: tiền của học viên còn hiệu lực ở lớp đã kết thúc → phải trả giáo viên
            public decimal Owed { get; set; }
        }

        private sealed record EnrollmentRow(int EnrollmentId, int ClassId, int StudentId, byte Status);

        private sealed record BookingRow(int BookingId, int InstructorId, byte Status, DateTime EndTime);

        // tháng của khoản thanh toán theo lịch người xem (DB lưu UTC)
        private static bool InPeriod(Payment p, int? year, int? month)
        {
            if (year == null && month == null) return true;
            if (p.PaidAt == null) return false;
            var local = UserTime.ToUser(p.PaidAt.Value);
            return (year == null || local.Year == year) && (month == null || local.Month == month);
        }

        private static bool IsActiveEnrollment(byte status) =>
            status == Constant.StatusBooking.Confirmed
            || status == Constant.StatusBooking.InProgress
            || status == Constant.StatusBooking.Completed;

        /*
         * trạng thái lớp theo giờ bắt đầu của buổi đầu và giờ kết thúc của buổi cuối
         * (từng buổi có thể bị dời giờ nên không dùng giờ chung của lớp)
         * giờ buổi học lưu theo giờ Việt Nam
         */
        private static string ClassStatus(DateOnly? firstDate, TimeSpan? firstStart, DateOnly? lastDate, TimeSpan? lastEnd)
        {
            if (firstDate == null || lastDate == null) return "Upcoming";

            var nowVn = VnTime.ToVn(DateTime.UtcNow);
            var start = firstDate.Value.ToDateTime(TimeOnly.FromTimeSpan(firstStart ?? TimeSpan.Zero));
            var end = lastDate.Value.ToDateTime(TimeOnly.FromTimeSpan(lastEnd ?? TimeSpan.Zero));

            if (nowVn < start) return "Upcoming";
            return nowVn >= end ? "Completed" : "Ongoing";
        }

        private static async Task<List<ClassMeta>> LoadClassMeta(IQueryable<TeacherClass> classes)
        {
            var rows = await classes
                .Select(tc => new
                {
                    tc.ClassId,
                    tc.Title,
                    tc.Price,
                    tc.MaxStudents,
                    TeacherUserId = tc.TeacherProfile != null ? tc.TeacherProfile.UserId : 0,
                    TeacherName = tc.TeacherProfile != null && tc.TeacherProfile.User != null
                        ? tc.TeacherProfile.User.Name : "",
                    First = tc.ClassSessions
                        .OrderBy(s => s.StudyDate).ThenBy(s => s.StartTime)
                        .Select(s => new { s.StudyDate, s.StartTime })
                        .FirstOrDefault(),
                    Last = tc.ClassSessions
                        .OrderByDescending(s => s.StudyDate).ThenByDescending(s => s.EndTime)
                        .Select(s => new { s.StudyDate, s.EndTime })
                        .FirstOrDefault(),
                })
                .ToListAsync();

            return rows.Select(r => new ClassMeta
            {
                ClassId = r.ClassId,
                Title = r.Title,
                TeacherUserId = r.TeacherUserId,
                TeacherName = r.TeacherName,
                Price = r.Price,
                MaxStudents = r.MaxStudents,
                FirstDate = r.First?.StudyDate,
                LastDate = r.Last?.StudyDate,
                Status = ClassStatus(r.First?.StudyDate, r.First?.StartTime, r.Last?.StudyDate, r.Last?.EndTime),
            }).ToList();
        }

        /*
         * doanh thu từng lớp trong kỳ + số tiền phải trả giáo viên (lũy kế)
         * classPayments: payment RefName = CLASS (mọi trạng thái — chỉ tính Success)
         */
        private static List<ClassCalc> ComputeClasses(
            List<ClassMeta> meta, List<EnrollmentRow> enrollments, List<Payment> classPayments, int? year, int? month)
        {
            var enByClass = enrollments.ToLookup(e => e.ClassId);
            var payByEnrollment = classPayments
                .Where(p => p.Status == Constant.StatusPayment.Success)
                .ToLookup(p => p.RefId);

            var result = new List<ClassCalc>();
            foreach (var m in meta)
            {
                var calc = new ClassCalc
                {
                    TeacherUserId = m.TeacherUserId,
                    Dto = new ClassRevenueDto
                    {
                        ClassId = m.ClassId,
                        Title = m.Title,
                        TeacherName = m.TeacherName,
                        Status = m.Status,
                        StartDate = m.FirstDate,
                        EndDate = m.LastDate,
                        Price = m.Price,
                        MaxStudents = m.MaxStudents,
                    },
                };
                var cancelledStudents = new HashSet<int>();
                bool classDone = m.Status == "Completed";

                foreach (var e in enByClass[m.ClassId])
                {
                    var pays = payByEnrollment[e.EnrollmentId].ToList();
                    bool active = IsActiveEnrollment(e.Status);

                    if (active && (classDone || e.Status == Constant.StatusBooking.Completed))
                        calc.Owed += pays.Sum(p => p.Amount);

                    var periodPays = pays.Where(p => InPeriod(p, year, month)).ToList();
                    if (periodPays.Count == 0) continue;

                    calc.HasPeriodPayment = true;
                    if (active)
                    {
                        calc.Dto.TotalRevenue += periodPays.Sum(p => p.Amount);
                        calc.PeriodStudents.Add(e.StudentId);
                    }
                    else if (e.Status == Constant.StatusBooking.Cancelled)
                    {
                        calc.Dto.CancelledUnrefunded += periodPays.Sum(p => p.Amount);
                        cancelledStudents.Add(e.StudentId);
                    }
                }

                calc.Dto.StudentCount = calc.PeriodStudents.Count;
                calc.Dto.CancelledCount = cancelledStudents.Count;
                result.Add(calc);
            }

            return result;
        }

        /*
         * chọn "tất cả thời gian" thì hiện mọi lớp, còn theo tháng chỉ hiện lớp có thanh toán trong tháng
         */
        private static List<ClassCalc> VisibleClasses(List<ClassCalc> calcs, int? year, int? month) =>
            calcs
                .Where(c => (year == null && month == null) || c.HasPeriodPayment)
                .OrderByDescending(c => c.Dto.StartDate)
                .ToList();

        /*
         * tiền 1-1 phải trả giáo viên (lũy kế): buổi đã hoàn thành hoặc đã qua giờ kết thúc
         * bookingPayments: payment RefName = PrivateLesson (mọi trạng thái — chỉ tính Success)
         */
        private static Dictionary<int, decimal> ComputePrivateOwed(List<BookingRow> bookings, List<Payment> bookingPayments)
        {
            var now = DateTime.UtcNow;
            var instructorOf = bookings
                .Where(b => b.Status == Constant.StatusBooking.Completed
                    || ((b.Status == Constant.StatusBooking.Confirmed || b.Status == Constant.StatusBooking.InProgress)
                        && b.EndTime <= now))
                .ToDictionary(b => b.BookingId, b => b.InstructorId);

            return bookingPayments
                .Where(p => p.Status == Constant.StatusPayment.Success && instructorOf.ContainsKey(p.RefId))
                .GroupBy(p => instructorOf[p.RefId])
                .ToDictionary(g => g.Key, g => g.Sum(p => p.Amount));
        }

        private static decimal SumSuccess(IEnumerable<Payment> payments) =>
            payments.Where(p => p.Status == Constant.StatusPayment.Success).Sum(p => p.Amount);

        private static decimal SumRefunded(IEnumerable<Payment> payments) =>
            payments.Where(p => p.Status == Constant.StatusPayment.Refunded).Sum(p => p.Amount);

        private static List<MonthlyStudentBreakdownDto> BuildStudentMonthly(
            List<Payment> bkPayments, Dictionary<int, byte> bkStatus,
            List<Payment> enPayments, Dictionary<int, byte> enStatus)
        {
            var all = bkPayments.Select(p => new {
                p.Amount, p.Status, p.PaidAt,
                RelStatus = bkStatus.GetValueOrDefault(p.RefId)
            }).Concat(enPayments.Select(p => new {
                p.Amount, p.Status, p.PaidAt,
                RelStatus = enStatus.GetValueOrDefault(p.RefId)
            })).Where(x => x.PaidAt.HasValue).ToList();

            return all.GroupBy(x => new { UserTime.ToUser(x.PaidAt!.Value).Year, UserTime.ToUser(x.PaidAt.Value).Month })
                .Select(g => new MonthlyStudentBreakdownDto
                {
                    Year = g.Key.Year, Month = g.Key.Month,
                    TotalPaid = g.Where(x => x.Status == Constant.StatusPayment.Success).Sum(x => x.Amount),
                    CompletedLearning = g.Where(x => x.Status == Constant.StatusPayment.Success && x.RelStatus == Constant.StatusBooking.Completed).Sum(x => x.Amount),
                    ActiveLearning = g.Where(x => x.Status == Constant.StatusPayment.Success && (x.RelStatus == Constant.StatusBooking.Confirmed || x.RelStatus == Constant.StatusBooking.InProgress)).Sum(x => x.Amount),
                    CancelledUnrefunded = g.Where(x => x.Status == Constant.StatusPayment.Success && x.RelStatus == Constant.StatusBooking.Cancelled).Sum(x => x.Amount),
                    Refunded = g.Where(x => x.Status == Constant.StatusPayment.Refunded).Sum(x => x.Amount),
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month).ToList();
        }

        private static List<MonthlyTeacherBreakdownDto> BuildTeacherMonthly(
            List<Payment> bkPayments, Dictionary<int, byte> bkStatus,
            List<Payment> enPayments, Dictionary<int, byte> enStatus)
        {
            var all = bkPayments.Select(p => new {
                p.Amount, p.Status, p.PaidAt,
                RelStatus = bkStatus.GetValueOrDefault(p.RefId)
            }).Concat(enPayments.Select(p => new {
                p.Amount, p.Status, p.PaidAt,
                RelStatus = enStatus.GetValueOrDefault(p.RefId)
            })).Where(x => x.PaidAt.HasValue).ToList();

            return all.GroupBy(x => new { UserTime.ToUser(x.PaidAt!.Value).Year, UserTime.ToUser(x.PaidAt.Value).Month })
                .Select(g => new MonthlyTeacherBreakdownDto
                {
                    Year = g.Key.Year, Month = g.Key.Month,
                    TotalFromStudents = g.Where(x => x.Status == Constant.StatusPayment.Success).Sum(x => x.Amount),
                    CompletedEarnings = g.Where(x => x.Status == Constant.StatusPayment.Success && x.RelStatus == Constant.StatusBooking.Completed).Sum(x => x.Amount),
                    ActiveEarnings = g.Where(x => x.Status == Constant.StatusPayment.Success && (x.RelStatus == Constant.StatusBooking.Confirmed || x.RelStatus == Constant.StatusBooking.InProgress)).Sum(x => x.Amount),
                    CancelledUnrefunded = g.Where(x => x.Status == Constant.StatusPayment.Success && x.RelStatus == Constant.StatusBooking.Cancelled).Sum(x => x.Amount),
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month).ToList();
        }

        private static List<MonthlyAdminBreakdownDto> BuildAdminMonthly(
            List<Payment> bkPayments, Dictionary<int, byte> bkStatus,
            List<Payment> enPayments, Dictionary<int, byte> enStatus)
        {
            var all = bkPayments.Select(p => new {
                p.Amount, p.Status, p.PaidAt,
                RelStatus = bkStatus.GetValueOrDefault(p.RefId)
            }).Concat(enPayments.Select(p => new {
                p.Amount, p.Status, p.PaidAt,
                RelStatus = enStatus.GetValueOrDefault(p.RefId)
            })).Where(x => x.PaidAt.HasValue).ToList();

            return all.GroupBy(x => new { UserTime.ToUser(x.PaidAt!.Value).Year, UserTime.ToUser(x.PaidAt.Value).Month })
                .Select(g => new MonthlyAdminBreakdownDto
                {
                    Year = g.Key.Year, Month = g.Key.Month,
                    TotalPaid = g.Where(x => x.Status == Constant.StatusPayment.Success).Sum(x => x.Amount),
                    CompletedLearning = g.Where(x => x.Status == Constant.StatusPayment.Success && x.RelStatus == Constant.StatusBooking.Completed).Sum(x => x.Amount),
                    ActiveLearning = g.Where(x => x.Status == Constant.StatusPayment.Success && (x.RelStatus == Constant.StatusBooking.Confirmed || x.RelStatus == Constant.StatusBooking.InProgress)).Sum(x => x.Amount),
                    CancelledUnrefunded = g.Where(x => x.Status == Constant.StatusPayment.Success && x.RelStatus == Constant.StatusBooking.Cancelled).Sum(x => x.Amount),
                    Refunded = g.Where(x => x.Status == Constant.StatusPayment.Refunded).Sum(x => x.Amount),
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month).ToList();
        }
    }
}
