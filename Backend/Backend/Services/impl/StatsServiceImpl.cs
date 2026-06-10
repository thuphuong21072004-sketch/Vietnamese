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
                .Select(ce => new { ce.EnrollmentId, ce.Status })
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
            bool InPeriod(Payment p) =>
                (year == null || p.PaidAt?.Year == year) &&
                (month == null || p.PaidAt?.Month == month);

            var bp = bookingPayments.Where(InPeriod).ToList();
            var ep = enrollmentPayments.Where(InPeriod).ToList();

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
                .Select(b => new { b.BookingId, b.Status })
                .ToListAsync();

            // Group class enrollments via teacher's classes
            var profile = await _profileRepo.GetByUserId(userId);
            List<(int EnrollmentId, byte Status)> enrollments = new();

            if (profile != null)
            {
                enrollments = await _ctx.TeacherClasses
                    .Where(tc => tc.TeacherProfileId == profile.TeacherProfileId)
                    .SelectMany(tc => tc.ClassEnrollments)
                    .Select(ce => new { ce.EnrollmentId, ce.Status })
                    .ToListAsync()
                    .ContinueWith(t => t.Result.Select(x => (x.EnrollmentId, x.Status)).ToList());
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

            bool InPeriod(Payment p) =>
                (year == null || p.PaidAt?.Year == year) &&
                (month == null || p.PaidAt?.Month == month);

            var bp = bookingPayments.Where(InPeriod).ToList();
            var ep = enrollmentPayments.Where(InPeriod).ToList();

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

            return dto;
        }

        // ──────────────────────────────────────────────
        // ADMIN
        // ──────────────────────────────────────────────

        public async Task<AdminPaymentStatsDto> GetAdminStats(int? year, int? month)
        {
            // All booking payments
            var allBookings = await _ctx.Bookings
                .Select(b => new { b.BookingId, b.StudentId, b.InstructorId, b.Status })
                .ToListAsync();

            var allEnrollments = await _ctx.ClassEnrollments
                .Include(ce => ce.TeacherClass)
                    .ThenInclude(tc => tc!.TeacherProfile)
                        .ThenInclude(tp => tp!.User)
                .Select(ce => new
                {
                    ce.EnrollmentId,
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
            var bkStudent = allBookings.ToDictionary(x => x.BookingId, x => x.StudentId);
            var bkTeacher = allBookings.ToDictionary(x => x.BookingId, x => x.InstructorId);
            var enStatus = allEnrollments.ToDictionary(x => x.EnrollmentId, x => x.Status);
            var enStudent = allEnrollments.ToDictionary(x => x.EnrollmentId, x => x.StudentId);
            var enTeacher = allEnrollments.ToDictionary(x => x.EnrollmentId, x => x.TeacherUserId);

            bool InPeriod(Payment p) =>
                (year == null || p.PaidAt?.Year == year) &&
                (month == null || p.PaidAt?.Month == month);

            var bp = bkPayments.Where(InPeriod).ToList();
            var ep = enPayments.Where(InPeriod).ToList();

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

            // Per-teacher breakdown
            var teacherUserIds = bkTeacher.Values.OfType<int>()
                .Concat(enTeacher.Values.OfType<int>())
                .Distinct().ToList();

            var teacherUsers = await _ctx.Users
                .Where(u => teacherUserIds.Contains(u.UserId))
                .Select(u => new { u.UserId, u.Name, u.Email })
                .ToListAsync();

            dto.TeacherPayouts = teacherUsers.Select(t =>
            {
                var tbp = bkPayments.Where(p => bkTeacher.GetValueOrDefault(p.RefId) == t.UserId).ToList();
                var tep = enPayments.Where(p => enTeacher.GetValueOrDefault(p.RefId) == t.UserId).ToList();
                return new TeacherPayoutDto
                {
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
            }).OrderByDescending(t => t.TotalFromStudents).ToList();

            // Per-student breakdown
            var studentUserIds = bkStudent.Values
                .Concat(enStudent.Values)
                .Distinct().ToList();

            var studentUsers = await _ctx.Users
                .Where(u => studentUserIds.Contains(u.UserId))
                .Select(u => new { u.UserId, u.Name, u.Email })
                .ToListAsync();

            dto.StudentSummaries = studentUsers.Select(s =>
            {
                var sbp = bkPayments.Where(p => bkStudent.GetValueOrDefault(p.RefId) == s.UserId).ToList();
                var sep = enPayments.Where(p => enStudent.GetValueOrDefault(p.RefId) == s.UserId).ToList();
                return new StudentPaymentSummaryDto
                {
                    UserId = s.UserId,
                    StudentName = s.Name,
                    Email = s.Email,
                    TotalPaid = SumSuccess(sbp) + SumSuccess(sep),
                    CompletedLearning =
                        sbp.Where(p => p.Status == Constant.StatusPayment.Success
                            && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed).Sum(p => p.Amount)
                        + sep.Where(p => p.Status == Constant.StatusPayment.Success
                            && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Completed).Sum(p => p.Amount),
                    ActiveLearning =
                        sbp.Where(p => p.Status == Constant.StatusPayment.Success
                            && (bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                                || bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress)).Sum(p => p.Amount)
                        + sep.Where(p => p.Status == Constant.StatusPayment.Success
                            && (enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Confirmed
                                || enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.InProgress)).Sum(p => p.Amount),
                    CancelledUnrefunded =
                        sbp.Where(p => p.Status == Constant.StatusPayment.Success
                            && bkStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled).Sum(p => p.Amount)
                        + sep.Where(p => p.Status == Constant.StatusPayment.Success
                            && enStatus.GetValueOrDefault(p.RefId) == Constant.StatusBooking.Cancelled).Sum(p => p.Amount),
                    Refunded = SumRefunded(sbp) + SumRefunded(sep),
                };
            }).OrderByDescending(s => s.TotalPaid).ToList();

            return dto;
        }

        // ──────────────────────────────────────────────
        // HELPERS
        // ──────────────────────────────────────────────

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

            return all.GroupBy(x => new { x.PaidAt!.Value.Year, x.PaidAt.Value.Month })
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

            return all.GroupBy(x => new { x.PaidAt!.Value.Year, x.PaidAt.Value.Month })
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

            return all.GroupBy(x => new { x.PaidAt!.Value.Year, x.PaidAt.Value.Month })
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
