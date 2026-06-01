using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class BookingRepositoryImpl : BookingRepository
    {
        private readonly AppDbContext _context;

        public BookingRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetById(int id)
        {
            return await _context.Bookings
                .Include(x => x.Student)
                    .ThenInclude(x => x.Role)
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.Role)
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Availability)
                .FirstOrDefaultAsync(x => x.BookingId == id);
        }

        public async Task<List<Booking>> GetByStudentId(
    int studentId,
    byte? status,
    DateOnly? date)
        {
            var query = _context.Bookings
                .Include(x => x.Student)
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.TeacherProfile)
                .Where(x => x.StudentId == studentId);

            if (status.HasValue)
            {
                query = query.Where(x => x.Status == status.Value);
            }

            if (date.HasValue)
            {
                query = query.Where(
                    x => DateOnly.FromDateTime(x.StartTime) == date.Value);
            }

            
            var now = DateTime.UtcNow;

            var data = await query.ToListAsync();

            var today = DateTime.UtcNow.Date;

            return data
                .OrderBy(x => Math.Abs((x.StartTime.Date - today).Days))
                .ThenBy(x =>
                    x.Status == common.Constant.StatusBooking.InProgress ? 0 :
                    x.Status == common.Constant.StatusBooking.Confirmed ? 1 :
                    x.Status == common.Constant.StatusBooking.Completed ? 2 :
                    x.Status == common.Constant.StatusBooking.PendingPayment ? 3 :
                    x.Status == common.Constant.StatusBooking.Cancelled ? 4 :
                    x.Status == common.Constant.StatusBooking.Refunded ? 5 : 99)
                .ThenBy(x => x.StartTime)
                .ToList();
        }

        public async Task<List<Booking>> GetByTeacherId(
    int instructorId,
    byte? status,
    DateOnly? date)
        {
            var query = _context.Bookings
                .Include(x => x.Student)
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.TeacherProfile)
                .Where(x => x.InstructorId == instructorId);

            if (status.HasValue)
            {
                query = query.Where(x => x.Status == status.Value);
            }

            if (date.HasValue)
            {
                query = query.Where(
                    x => DateOnly.FromDateTime(x.StartTime) == date.Value);
            }

            
            var now = DateTime.UtcNow;

            var data = await query.ToListAsync();

            var today = DateTime.UtcNow.Date;

            return data
                .OrderBy(x => Math.Abs((x.StartTime.Date - today).Days))
                .ThenBy(x =>
                    x.Status == common.Constant.StatusBooking.InProgress ? 0 :
                    x.Status == common.Constant.StatusBooking.Confirmed ? 1 :
                    x.Status == common.Constant.StatusBooking.Completed ? 2 :
                    x.Status == common.Constant.StatusBooking.PendingPayment ? 3 :
                    x.Status == common.Constant.StatusBooking.Cancelled ? 4 :
                    x.Status == common.Constant.StatusBooking.Refunded ? 5 : 99)
                .ThenBy(x => x.StartTime)
                .ToList();
        }

        public async Task Create(Booking booking)
        {
            await _context.Bookings.AddAsync(booking);
        }

        public async Task Update(Booking booking)
        {
            _context.Bookings.Update(booking);
            await Task.CompletedTask;
        }

        public async Task<Booking?> GetActiveBookingByAvailabilityId(int availabilityId, DateTime activeSince)
        {
            return await _context.Bookings
                .FirstOrDefaultAsync(x => x.AvailabilityId == availabilityId
                    && x.Status != common.Constant.StatusBooking.Cancelled
                    && (x.Status == common.Constant.StatusBooking.Confirmed
                        || x.Status == common.Constant.StatusBooking.InProgress
                        || x.Status == common.Constant.StatusBooking.Completed
                        || (x.Status == common.Constant.StatusBooking.PendingPayment
                            && x.CreatedDate >= activeSince)));
        }

        public async Task<List<Booking>> GetPendingBookingsBefore(int availabilityId, DateTime threshold)
        {
            return await _context.Bookings
                .Where(x => x.AvailabilityId == availabilityId
                    && x.Status == common.Constant.StatusBooking.PendingPayment
                    && x.CreatedDate < threshold)
                .ToListAsync();
        }

        public async Task<bool> HasOverlapBooking(int studentId, DateTime startTime, DateTime endTime)
        {
            return await _context.Bookings
                .AnyAsync(x => x.StudentId == studentId
                    && x.Status != common.Constant.StatusBooking.Cancelled
                    && (startTime < x.EndTime && endTime > x.StartTime));
        }

        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasBookingByAvailabilityId(int availabilityId)
        {
            return await _context.Bookings
                .AnyAsync(x => x.AvailabilityId == availabilityId
                    && x.Status != common.Constant.StatusBooking.Cancelled);
        }

        public async Task<List<Booking>> GetBookingsByMonth(
    int month,
    int year)
        {
            return await _context.Bookings

                .Include(x => x.Student)

                .Include(x => x.Instructor)

                .Include(x => x.Payment)

                .Where(x =>
                    x.CreatedDate.Month == month &&
                    x.CreatedDate.Year == year)

                .ToListAsync();
        }

    }
}