using Backend.Data;
using Microsoft.EntityFrameworkCore;
using static Backend.common.Constant;

namespace Backend.Services.impl
{
    public class AutoCancelService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AutoCancelService> _logger;
        private static readonly TimeSpan _interval = TimeSpan.FromMinutes(1);
        private static readonly TimeSpan _expireAfter = TimeSpan.FromMinutes(15);

        public AutoCancelService(
            IServiceScopeFactory scopeFactory,
            ILogger<AutoCancelService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CancelExpiredAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "AutoCancelService error");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }

        private async Task CancelExpiredAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cutoff = DateTime.Now - _expireAfter;

            // --- Bookings ---
            var expiredBookings = await db.Bookings
                .Include(b => b.Availability)
                .Where(b =>
                    b.Status == StatusBooking.PendingPayment &&
                    b.CreatedDate < cutoff &&
                    !db.Payments.Any(p =>
                        p.RefName == RefName.Booking &&
                        p.RefId == b.BookingId &&
                        p.PaymentMethod == 1 &&
                        p.Status == StatusPayment.Pending))
                .ToListAsync();

            foreach (var booking in expiredBookings)
            {
                booking.Status = StatusBooking.Cancelled;

                if (booking.Availability != null)
                {
                    booking.Availability.Status = StatusTeacherAvailability.Available;
                }

                var payment = await db.Payments.FirstOrDefaultAsync(p =>
                    p.RefName == RefName.Booking &&
                    p.RefId == booking.BookingId &&
                    p.Status == StatusPayment.Pending);

                if (payment != null)
                    payment.Status = StatusPayment.Expired;
            }

            // --- ClassEnrollments ---
            var expiredEnrollments = await db.ClassEnrollments
                .Include(e => e.TeacherClass)
                .Where(e =>
                    e.Status == StatusBooking.PendingPayment &&
                    e.EnrolledDate < cutoff &&
                    !db.Payments.Any(p =>
                        p.RefName == RefName.Class &&
                        p.RefId == e.EnrollmentId &&
                        p.PaymentMethod == 1 &&
                        p.Status == StatusPayment.Pending))
                .ToListAsync();

            foreach (var enrollment in expiredEnrollments)
            {
                enrollment.Status = StatusBooking.Cancelled;

                if (enrollment.TeacherClass != null &&
                    enrollment.TeacherClass.CurrentStudents > 0)
                {
                    enrollment.TeacherClass.CurrentStudents--;
                }

                var payment = await db.Payments.FirstOrDefaultAsync(p =>
                    p.RefName == RefName.Class &&
                    p.RefId == enrollment.EnrollmentId &&
                    p.Status == StatusPayment.Pending);

                if (payment != null)
                    payment.Status = StatusPayment.Expired;
            }

            if (expiredBookings.Count > 0 || expiredEnrollments.Count > 0)
            {
                await db.SaveChangesAsync();
                _logger.LogInformation(
                    "Auto-cancelled {b} bookings, {e} enrollments",
                    expiredBookings.Count,
                    expiredEnrollments.Count);
            }
        }
    }
}
