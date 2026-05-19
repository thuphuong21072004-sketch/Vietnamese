using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class TeacherAvailabilityRepositoryImpl : TeacherAvailabilityRepository
    {
        private readonly AppDbContext _context;

        public TeacherAvailabilityRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * lấy thông tin lịch trống theo id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherAvailability?> GetById(int id)
        {
            return await _context.TeacherAvailabilities
                .Include(x => x.Teacher).ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Teacher).ThenInclude(x => x.Role)
                .FirstOrDefaultAsync(x => x.AvailabilityId == id);
        }

        /* 
         * kiểm tra lịch trống trùng lặp
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<bool> HasOverlapSchedule(int teacherId, DateTime start, DateTime end, int? excludeId = null)
        {
            return await _context.TeacherAvailabilities
                .AnyAsync(x => x.TeacherId == teacherId
                    && x.EndTime > DateTime.UtcNow
                    && (excludeId == null || x.AvailabilityId != excludeId)
                    && (start < x.EndTime && end > x.StartTime));
        }

        /* 
         * tạo mới lịch trống cho giáo viên
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(TeacherAvailability availability)
        {
            await _context.TeacherAvailabilities.AddAsync(availability);
        }

        /* 
         * cập nhật thông tin lịch trống
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Update(TeacherAvailability availability)
        {
            _context.TeacherAvailabilities.Update(availability);
            await Task.CompletedTask;
        }

        /* 
         * xóa lịch trống
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Delete(TeacherAvailability availability)
        {
            _context.TeacherAvailabilities.Remove(availability);
            await Task.CompletedTask;
        }

        /* 
         * lấy danh sách tất cả lịch trống chưa được đặt
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<TeacherAvailability>> GetAvailableSchedules(DateOnly? date)
        {
            var query = _context.TeacherAvailabilities
                .Include(x => x.Teacher).ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Teacher).ThenInclude(x => x.Role)
                .Where(x => !x.IsBooked
                    && x.StartTime > DateTime.UtcNow
                    && x.Teacher != null
                    && x.Teacher.TeacherProfile != null
                    && x.Teacher.TeacherProfile.Status == common.Constant.StatusTeacherProfile.Approved);

            if (date != null)
            {
                query = query.Where(x => DateOnly.FromDateTime(x.StartTime) == date);
            }

            return await query.OrderBy(x => x.StartTime).ToListAsync();
        }

        /* 
         * lấy danh sách lịch trống của một giáo viên cụ thể
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<TeacherAvailability>> GetTeacherSchedules(int teacherId)
        {
            return await _context.TeacherAvailabilities
                .Include(x => x.Teacher).ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Teacher).ThenInclude(x => x.Role)
                .Where(x => x.TeacherId == teacherId && x.EndTime > DateTime.UtcNow)
                .OrderBy(x => x.StartTime)
                .ToListAsync();
        }

        /* 
         * kiểm tra lịch trống có tồn tại hay không
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<bool> Exists(int id)
        {
            return await _context.TeacherAvailabilities.AnyAsync(x => x.AvailabilityId == id);
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