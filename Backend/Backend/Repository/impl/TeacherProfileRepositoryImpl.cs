using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class TeacherProfileRepositoryImpl : TeacherProfileRepository
    {
        private readonly AppDbContext _context;

        public TeacherProfileRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * lấy teacher profile theo user id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherProfile?> GetByUserId(int userId)
        {
            return await _context.TeacherProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
        }

        /* 
         * lấy hồ sơ giáo viên theo id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherProfile?> GetById(int id)
        {
            return await _context.TeacherProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.TeacherProfileId == id);
        }

        /* 
         * tạo teacher profile
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(TeacherProfile teacherProfile)
        {
            await _context.TeacherProfiles.AddAsync(teacherProfile);
        }

        /* 
         * cập nhật teacher profile
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Update(TeacherProfile teacherProfile)
        {
            _context.TeacherProfiles.Update(teacherProfile);
            await Task.CompletedTask;
        }

        /* 
         * lưu database
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }

        /* 
         * danh sách giáo viên
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<TeacherProfile>> GetAllForAdmin(int? status)
        {
            IQueryable<TeacherProfile> query = _context.TeacherProfiles.Include(x => x.User);

            query = query.Where(x => x.Status != common.Constant.StatusTeacherProfile.Draft);

            if (status.HasValue)
            {
                query = query.Where(x => x.Status == status);
            }

            return await query.OrderByDescending(x => x.TeacherProfileId).ToListAsync();
        }

        /* 
         * chi tiết giáo viên
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<TeacherProfile?> GetDetail(int id)
        {
            return await _context.TeacherProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.TeacherProfileId == id);
        }
    }
}