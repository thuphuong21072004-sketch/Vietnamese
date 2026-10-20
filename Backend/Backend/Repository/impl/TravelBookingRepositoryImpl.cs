using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class TravelBookingRepositoryImpl
        : TravelBookingRepository
    {
        private readonly AppDbContext _context;

        public TravelBookingRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<TravelBooking?>
            GetById(
                int bookingId)
        {
            return await _context.TravelBookings

                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)

                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)

                .FirstOrDefaultAsync(
                    x => x.TravelBookingId
                    == bookingId);
        }

        public async Task<List<TravelBooking>>
            GetByScheduleId(
                int scheduleId)
        {
            return await _context.TravelBookings

                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)

                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)

                .Where(x =>
                    x.ScheduleId ==
                    scheduleId)

                .OrderBy(x =>
                    x.StartDate)

                .ToListAsync();
        }

        public async Task<List<TravelBooking>>
            GetByTripId(
                int tripId)
        {
            return await _context.TravelBookings

                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)

                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)

                .Where(x =>
                    x.TripId ==
                    tripId)

                .OrderBy(x =>
                    x.StartDate)

                .ToListAsync();
        }

        /*
         * lấy các lịch đã chốt
         * của 1 teacher schedule
         */
        public async Task<List<TravelBooking>>
            GetConfirmedByScheduleId(
                int scheduleId)
        {
            return await _context.TravelBookings

                .Where(x =>

                    x.ScheduleId ==
                    scheduleId

                    &&

                    x.Status == 1)

                .OrderBy(x =>
                    x.StartDate)

                .ToListAsync();
        }

        public async Task<List<TravelBooking>>
            GetAllConfirmed(
                DateOnly? from,
                DateOnly? to)
        {
            var query = _context.TravelBookings
                .Include(x => x.Schedule)
                    .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                    .ThenInclude(x => x.Student)
                .Where(x => x.Status == 1)
                .AsQueryable();

            // from / to là ngày theo lịch của admin, CreatedAt lưu UTC
            if (from.HasValue)
            {
                var fromUtc = common.UserTime.UtcRangeOf(from.Value).From;
                query = query.Where(x => x.CreatedAt >= fromUtc);
            }

            if (to.HasValue)
            {
                var toUtc = common.UserTime.UtcRangeOf(to.Value).To;
                query = query.Where(x => x.CreatedAt < toUtc);
            }

            return await query
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<TravelBooking>>
            GetConfirmedByTeacherId(int teacherId)
        {
            return await _context.TravelBookings
                .Include(x => x.Schedule)
                    .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                    .ThenInclude(x => x.Student)
                .Where(x => x.Status == 1 && x.Schedule!.TeacherId == teacherId)
                .OrderBy(x => x.StartDate)
                .ToListAsync();
        }

        /*
         * kiểm tra giáo viên
         * có đang bận trong
         * khoảng thời gian này không
         */
        public async Task<bool>
            HasConflictBooking(
                int scheduleId,
                DateOnly startDate,
                DateOnly endDate)
        {
            return await _context
                .TravelBookings

                .AnyAsync(x =>

                    x.ScheduleId ==
                    scheduleId

                    &&

                    x.Status == 1

                    &&

                    x.StartDate <=
                    endDate

                    &&

                    x.EndDate >=
                    startDate);
        }

        public async Task Create(
            TravelBooking booking)
        {
            await _context
                .TravelBookings
                .AddAsync(booking);
        }

        public async Task Update(
            TravelBooking booking)
        {
            _context
                .TravelBookings
                .Update(booking);

            await Task.CompletedTask;
        }

        public async Task Delete(
            TravelBooking booking)
        {
            _context
                .TravelBookings
                .Remove(booking);

            await Task.CompletedTask;
        }

        public async Task Save()
        {
            await _context
                .SaveChangesAsync();
        }
    }
}