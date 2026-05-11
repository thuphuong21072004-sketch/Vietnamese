using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class CourseRepositoryImpl : CourseRepository
    {
        private readonly AppDbContext _context;

        public CourseRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách khóa học theo Level và trạng thái 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Course>> GetAllCourses(int levelId, bool? isActive)
        {
            var query = _context.Courses.AsNoTracking().Where(c => c.LevelId == levelId);

            if (isActive.HasValue)
            {
                query = query.Where(c => c.IsActive == isActive.Value);
            }

            return await query.OrderBy(c => c.OrderIndex).ToListAsync();
        }

        /* 
         * Thêm một khóa học mới 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddCourse(Course course)
        {
            await _context.Courses.AddAsync(course);
        }

        /* 
         * Cập nhật thông tin khóa học 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task UpdateCourse(Course course)
        {
            _context.Courses.Update(course);
        }

        /* 
         * Xóa các khóa học và dữ liệu liên quan (Unit, Quiz, Question, Answer...) 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteCourses(List<int> ids)
        {
            if (ids == null || !ids.Any()) return;

            // Truy vấn các IDs cần thiết để xóa phân tầng mà không cần tải toàn bộ Object
            var unitIds = await _context.Units.Where(u => ids.Contains(u.CourseId)).Select(u => u.UnitId).ToListAsync();
            var quizIds = await _context.Quizzes.Where(q => q.RefType == "UNIT" && unitIds.Contains(q.RefId)).Select(q => q.QuizId).ToListAsync();
            var partIds = await _context.Parts.Where(p => quizIds.Contains(p.QuizId)).Select(p => p.PartId).ToListAsync();
            var passageIds = await _context.Passages.Where(p => partIds.Contains(p.PartId)).Select(p => p.PassageId).ToListAsync();

            var questionIds = await _context.Questions
                .Where(q => quizIds.Contains(q.QuizId) || (q.PartId != null && partIds.Contains(q.PartId.Value)) || (q.PassageId != null && passageIds.Contains(q.PassageId.Value)))
                .Select(q => q.QuestionId)
                .ToListAsync();

            var answerIds = await _context.Answers.Where(a => questionIds.Contains(a.QuestionId)).Select(a => a.AnswerId).ToListAsync();

            // Thực hiện xóa trực tiếp tại DB theo thứ tự ngược để tránh lỗi ràng buộc (nếu không có Cascade)
            await _context.UserAnswer.Where(ua => answerIds.Contains(ua.AnswerId)).ExecuteDeleteAsync();
            await _context.UserQuiz.Where(uq => quizIds.Contains(uq.QuizId)).ExecuteDeleteAsync();
            await _context.Answers.Where(a => answerIds.Contains(a.AnswerId)).ExecuteDeleteAsync();
            await _context.Questions.Where(q => questionIds.Contains(q.QuestionId)).ExecuteDeleteAsync();
            await _context.Passages.Where(p => passageIds.Contains(p.PassageId)).ExecuteDeleteAsync();
            await _context.Parts.Where(p => partIds.Contains(p.PartId)).ExecuteDeleteAsync();
            await _context.Quizzes.Where(q => quizIds.Contains(q.QuizId)).ExecuteDeleteAsync();
            await _context.Units.Where(u => unitIds.Contains(u.UnitId)).ExecuteDeleteAsync();
            await _context.Courses.Where(c => ids.Contains(c.CourseId)).ExecuteDeleteAsync();
        }

        /* 
         * Lưu các thay đổi của khóa học 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task SaveCourse()
        {
            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy chỉ số sắp xếp lớn nhất theo Level 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<int> GetMaxOrderIndex(int levelId)
        {
            return await _context.Courses
                .Where(x => x.LevelId == levelId)
                .MaxAsync(x => (int?)x.OrderIndex) ?? 0;
        }

        /* 
         * Lấy thông tin khóa học theo ID 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Course?> GetCourseById(int id)
        {
            return await _context.Courses.AsNoTracking().FirstOrDefaultAsync(x => x.CourseId == id);
        }

        /* 
         * Lấy tất cả khóa học theo Level và trạng thái (Overload) 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Course>> GetAllCourses(int levelId, bool isActive)
        {
            return await _context.Courses
                .AsNoTracking()
                .Where(x => x.LevelId == levelId && x.IsActive == isActive)
                .ToListAsync();
        }

        /* 
         * Lấy khóa học tiếp theo dựa trên OrderIndex 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Course?> GetNextCourse(int courseId)
        {
            
            var current = await _context.Courses
                .AsNoTracking()
                .Where(c => c.CourseId == courseId)
                .Select(c => new { c.LevelId, c.OrderIndex })
                .FirstOrDefaultAsync();

            if (current == null) return null;

            return await _context.Courses
                .AsNoTracking()
                .Where(x => x.LevelId == current.LevelId && x.OrderIndex > current.OrderIndex && x.IsActive)
                .OrderBy(x => x.OrderIndex)
                .FirstOrDefaultAsync();
        }
    }
}