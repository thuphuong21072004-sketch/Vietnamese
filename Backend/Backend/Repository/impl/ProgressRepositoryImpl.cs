using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class ProgressRepositoryImpl : ProgressRepository
    {
        private readonly AppDbContext _context;

        public ProgressRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy tiến độ của người dùng theo Level 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<UserProgress?> GetUserLevel(int userId, int levelId, string refType)
        {
            return await _context.UserProgress
    .FirstOrDefaultAsync(x =>
        x.UserId == userId &&
        x.RefType == refType &&
        x.RefId == levelId
    );
        }

        /* 
         * Lấy tiến độ khóa học của người dùng bằng CourseId 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<UserProgress?> GetUserCourseByCourseId(int userId, int courseId, string refType)
        {
            return await _context.UserProgress
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.RefType == refType && x.RefId == courseId);
        }

        /* 
         * Lấy danh sách tiến độ các Unit trong một khóa học 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<UserProgress>> GetUserUnits(int userId, int courseId, string refType)
        {
            var unitIds = _context.Units.Where(u => u.CourseId == courseId).Select(u => u.UnitId);

            return await _context.UserProgress
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.RefType == refType && unitIds.Contains(x.RefId))
                .ToListAsync();
        }

        /* 
         * Lấy tiến độ hiện tại đang thực hiện (chưa hoàn thành) 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<UserProgress?> GetCurrentProgress(int userId, string refType)
        {
            return await _context.UserProgress
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.RefType == refType && x.Status == false)
                .OrderBy(x => x.AssignedDate)
                .FirstOrDefaultAsync();
        }

        /* 
         * Thêm tiến độ Level cho người dùng 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddUserLevel(int userId, int levelId, string refType)
        {
            await _context.UserProgress.AddAsync(new UserProgress
            {
                UserId = userId,
                RefType = refType,
                RefId = levelId,
                Status = false,
                AssignedDate = DateTime.Now
            });
        }

        /* 
         * Thêm tiến độ khóa học cho người dùng 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddUserCourse(int userId, int courseId, string refType)
        {
            await _context.UserProgress.AddAsync(new UserProgress
            {
                UserId = userId,
                RefType = refType,
                RefId = courseId,
                Status = false,
                AssignedDate = DateTime.Now
            });
        }

        /* 
         * Thêm một bản ghi tiến độ bất kỳ 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddUserProgress(UserProgress userProgress)
        {
            await _context.UserProgress.AddAsync(userProgress);
        }

        /* 
         * Lưu các thay đổi vào cơ sở dữ liệu 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy danh sách tiến độ các khóa học theo Level 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<UserProgress>> GetUserCourses(int userId, int levelId, string refType)
        {
            var courseIds = _context.Courses.Where(c => c.LevelId == levelId).Select(c => c.CourseId);

            return await _context.UserProgress
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.RefType == refType && courseIds.Contains(x.RefId))
                .ToListAsync();
        }

        /* 
         * Lấy tiến độ của một Unit cụ thể 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<UserProgress?> GetUserUnitByUnitId(int userId, int unitId, string refType)
        {
            return await _context.UserProgress
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.RefType == refType && x.RefId == unitId);
        }

        /* 
         * Lấy danh sách tiến độ tổng quát của người dùng 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<UserProgress>> GetUserProgress(int userId, int courseId, string refType)
        {
            if (courseId == 0)
            {
                return await _context.UserProgress
                    .AsNoTracking()
                    .Where(x => x.UserId == userId)
                    .ToListAsync();
            }

            var unitIds = _context.Units.Where(u => u.CourseId == courseId).Select(u => u.UnitId);

            return await _context.UserProgress
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.RefType == refType && unitIds.Contains(x.RefId))
                .ToListAsync();
        }

        /* 
         * Kiểm tra người dùng đã có dữ liệu tiến độ chưa 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<bool> HasUserProgress(int userId, string refType)
        {
            return await _context.UserProgress
                .AsNoTracking()
                .AnyAsync(x => x.UserId == userId && x.RefType == refType);
        }

        /* 
         * Lấy chi tiết tiến độ theo RefId 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<UserProgress?> GetUserProgress(int userId, string refType, int refId)
        {
            return await _context.UserProgress
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.RefType == refType && x.RefId == refId);
        }
        /*
         * Lấy danh sách level progress của user
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<UserProgress>> GetUserLevels( int userId, string refType)
        {
            return await _context.UserProgress
                .Where(x =>
                    x.UserId == userId
                    && x.RefType == refType)
                .ToListAsync();
        }

        public async Task UpdateUserProgress(
    UserProgress progress
)
        {
            _context.Entry(progress).State =
                EntityState.Modified;

            await Task.CompletedTask;
        }
        public async Task<bool>
    ExistsProgress(
        int userId,
        string refType,
        int refId
    )
        {
            return await _context
                .UserProgress
                .AnyAsync(x =>
                    x.UserId == userId
                    &&
                    x.RefType == refType
                    &&
                    x.RefId == refId
                );
        }
    }
}