using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class LevelRepositoryImpl : LevelRepository
    {
        private readonly AppDbContext _context;

        public LevelRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách tất cả các cấp độ
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Level>> GetAllLevels(bool? isActive)
        {
            var query = _context.Levels.AsNoTracking();

            if (isActive.HasValue)
                query = query.Where(l => l.IsActive == isActive.Value);

            return await query.OrderBy(x => x.OrderIndex).ToListAsync();
        }

        /* 
         * Thêm một cấp độ mới
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddLevel(Level level)
        {
            await _context.Levels.AddAsync(level);
        }

        /* 
         * Cập nhật thông tin cấp độ
         * O(1) 
         * thuphuong21072004 
         */
        public async Task UpdateLevel(Level level)
        {
            _context.Levels.Update(level);
        }

        /* 
         * Xóa hàng loạt cấp độ và toàn bộ dữ liệu liên quan (Course, Unit, Quiz...)
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteLevels(List<int> ids)
        {
            if (ids == null || !ids.Any()) return;

            var courseIds = await _context.Courses.Where(c => ids.Contains(c.LevelId)).Select(c => c.CourseId).ToListAsync();
            var unitIds = await _context.Units.Where(u => courseIds.Contains(u.CourseId)).Select(u => u.UnitId).ToListAsync();

            var quizIds = await _context.Quizzes.Where(q =>
                (q.RefType == "UNIT" && unitIds.Contains(q.RefId)) ||
                (q.RefType == "COURSE_JUMP" && courseIds.Contains(q.RefId)) ||
                (q.RefType == "LEVEL_JUMP" && ids.Contains(q.RefId)))
                .Select(q => q.QuizId).ToListAsync();

            var partIds = await _context.Parts.Where(p => quizIds.Contains(p.QuizId)).Select(p => p.PartId).ToListAsync();
            var passageIds = await _context.Passages.Where(p => partIds.Contains(p.PartId)).Select(p => p.PassageId).ToListAsync();

            var questionIds = await _context.Questions.Where(q =>
                quizIds.Contains(q.QuizId) ||
                (q.PartId != null && partIds.Contains(q.PartId.Value)) ||
                (q.PassageId != null && passageIds.Contains(q.PassageId.Value)))
                .Select(q => q.QuestionId).ToListAsync();

            var answerIds = await _context.Answers.Where(a => questionIds.Contains(a.QuestionId)).Select(a => a.AnswerId).ToListAsync();

            await _context.UserAnswer.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.UserQuiz.Where(x => quizIds.Contains(x.QuizId)).ExecuteDeleteAsync();
            await _context.Answers.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Questions.Where(x => questionIds.Contains(x.QuestionId)).ExecuteDeleteAsync();
            await _context.Passages.Where(x => passageIds.Contains(x.PassageId)).ExecuteDeleteAsync();
            await _context.Parts.Where(x => partIds.Contains(x.PartId)).ExecuteDeleteAsync();
            await _context.Quizzes.Where(x => quizIds.Contains(x.QuizId)).ExecuteDeleteAsync();
            await _context.Units.Where(x => unitIds.Contains(x.UnitId)).ExecuteDeleteAsync();
            await _context.Courses.Where(x => courseIds.Contains(x.CourseId)).ExecuteDeleteAsync();
            await _context.Levels.Where(x => ids.Contains(x.LevelId)).ExecuteDeleteAsync();
        }

        /* 
         * Lưu các thay đổi của cấp độ
         * O(1) 
         * thuphuong21072004 
         */
        public async Task SaveLevel()
        {
            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy chỉ số sắp xếp lớn nhất hiện tại
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<int> GetMaxOrderIndex()
        {
            return await _context.Levels.MaxAsync(x => (int?)x.OrderIndex) ?? 0;
        }

        /* 
         * Lấy Queryable để thực hiện các truy vấn linh hoạt
         * O(1) 
         * thuphuong21072004 
         */
        public IQueryable<Level> GetQueryable()
        {
            return _context.Levels.AsNoTracking();
        }

        /* 
         * Tìm kiếm cấp độ theo tên
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Level?> GetByName(string name)
        {
            return await _context.Levels.AsNoTracking().FirstOrDefaultAsync(x => x.LevelName == name);
        }

        /* 
         * Lấy thông tin cấp độ theo ID
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Level?> GetLevelById(int id)
        {
            return await _context.Levels.AsNoTracking().FirstOrDefaultAsync(x => x.LevelId == id);
        }

        /* 
         * Lấy cấp độ tiếp theo dựa trên chỉ số sắp xếp
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Level?> GetNextLevel(int levelId)
        {
            var currentOrder = await _context.Levels
                .Where(x => x.LevelId == levelId)
                .Select(x => x.OrderIndex)
                .FirstOrDefaultAsync();

            return await _context.Levels
                .AsNoTracking()
                .Where(x => x.OrderIndex > currentOrder && x.IsActive)
                .OrderBy(x => x.OrderIndex)
                .FirstOrDefaultAsync();
        }
    }
}