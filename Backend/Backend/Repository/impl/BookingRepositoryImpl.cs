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

        /* 
         * lấy thông tin đặt lịch theo id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<Booking?> GetById(int id)
        {
            return await _context.Bookings
                .Include(x => x.Student).ThenInclude(x => x.Role)
                .Include(x => x.Teacher).ThenInclude(x => x.Role)
                .Include(x => x.Teacher).ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Availability)
                .FirstOrDefaultAsync(x => x.BookingId == id);
        }

        /* 
         * lấy danh sách đặt lịch của học sinh
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<Booking>> GetByStudentId(int studentId)
        {
            return await _context.Bookings
                .Include(x => x.Student)
                .Include(x => x.Teacher).ThenInclude(x => x.TeacherProfile)
                .Where(x => x.StudentId == studentId)
                .OrderByDescending(x => x.StartTime)
                .ToListAsync();
        }

        /* 
         * lấy danh sách đặt lịch của giáo viên
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<Booking>> GetByTeacherId(int teacherId)
        {
            return await _context.Bookings
                .Include(x => x.Student)
                .Include(x => x.Teacher).ThenInclude(x => x.TeacherProfile)
                .Where(x => x.TeacherId == teacherId)
                .OrderByDescending(x => x.StartTime)
                .ToListAsync();
        }

        /* 
         * tạo mới một lượt đặt lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(Booking booking)
        {
            await _context.Bookings.AddAsync(booking);
        }

        /* 
         * cập nhật thông tin đặt lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Update(Booking booking)
        {
            _context.Bookings.Update(booking);
            await Task.CompletedTask;
        }

        /* 
         * kiểm tra trùng lặp thời gian đặt lịch
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<Booking?> GetActiveBookingByAvailabilityId(int availabilityId, DateTime activeSince)
        {
            return await _context.Bookings
                .FirstOrDefaultAsync(x => x.AvailabilityId == availabilityId
                    && x.Status != common.Constant.StatusBooking.Cancelled
                    && (x.Status == common.Constant.StatusBooking.Booked || x.CreatedDate >= activeSince));
        }

        public async Task<List<Booking>> GetPendingBookingsBefore(int availabilityId, DateTime threshold)
        {
            return await _context.Bookings
                .Where(x => x.AvailabilityId == availabilityId
                    && x.Status == common.Constant.StatusBooking.Pending
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

        /* 
         * lưu thay đổi vào cơ sở dữ liệu
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}