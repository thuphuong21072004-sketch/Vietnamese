using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class UnitRepositoryImpl : UnitRepository
    {
        private readonly AppDbContext _context;

        public UnitRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách các Unit theo CourseId và trạng thái
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Unit>> GetAllUnits(int courseId, bool? isActive)
        {
            var query = _context.Units.AsNoTracking().Where(u => u.CourseId == courseId);

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            return await query.OrderBy(u => u.OrderIndex).ToListAsync();
        }

        /* 
         * Lấy chi tiết một Unit theo ID
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Unit?> GetUnitById(int unitId)
        {
            return await _context.Units
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UnitId == unitId);
        }

        /* 
         * Thêm một Unit mới
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddUnit(Unit unit)
        {
            await _context.Units.AddAsync(unit);
        }

        /* 
         * Cập nhật thông tin Unit
         * O(1) 
         * thuphuong21072004 
         */
        public async Task UpdateUnit(Unit unit)
        {
            _context.Units.Update(unit);
        }

        /* 
         * Xóa hàng loạt Unit và các dữ liệu liên quan (Quiz, Part, Question, Answer...)
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteUnits(List<int> ids, string refType)
        {
            if (ids == null || !ids.Any()) return;

            var quizIds = await _context.Quizzes
                .Where(x => x.RefType == refType && ids.Contains(x.RefId))
                .Select(x => x.QuizId)
                .ToListAsync();

            var partIds = await _context.Parts
                .Where(x => quizIds.Contains(x.QuizId))
                .Select(x => x.PartId)
                .ToListAsync();

            var passageIds = await _context.Passages
                .Where(x => partIds.Contains(x.PartId))
                .Select(x => x.PassageId)
                .ToListAsync();

            var questionIds = await _context.Questions
                .Where(x => quizIds.Contains(x.QuizId) ||
                            (x.PartId != null && partIds.Contains(x.PartId.Value)) ||
                            (x.PassageId != null && passageIds.Contains(x.PassageId.Value)))
                .Select(x => x.QuestionId)
                .ToListAsync();

            var answerIds = await _context.Answers
                .Where(x => questionIds.Contains(x.QuestionId))
                .Select(x => x.AnswerId)
                .ToListAsync();

            await _context.UserAnswer.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.UserQuiz.Where(x => quizIds.Contains(x.QuizId)).ExecuteDeleteAsync();
            await _context.Answers.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Questions.Where(x => questionIds.Contains(x.QuestionId)).ExecuteDeleteAsync();
            await _context.Passages.Where(x => passageIds.Contains(x.PassageId)).ExecuteDeleteAsync();
            await _context.Parts.Where(x => partIds.Contains(x.PartId)).ExecuteDeleteAsync();
            await _context.Quizzes.Where(x => quizIds.Contains(x.QuizId)).ExecuteDeleteAsync();
            await _context.Units.Where(x => ids.Contains(x.UnitId)).ExecuteDeleteAsync();
        }

        /* 
         * Lưu các thay đổi của Unit
         * O(1) 
         * thuphuong21072004 
         */
        public async Task SaveUnit()
        {
            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy chỉ số sắp xếp lớn nhất theo CourseId
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<int> GetMaxOrderIndex(int courseId)
        {
            return await _context.Units
                .Where(x => x.CourseId == courseId)
                .MaxAsync(x => (int?)x.OrderIndex) ?? 0;
        }

        /* 
         * Lấy danh sách các Unit theo danh sách ID
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Unit>> GetUnitsByIds(List<int> ids)
        {
            return await _context.Units
                .AsNoTracking()
                .Where(x => ids.Contains(x.UnitId))
                .ToListAsync();
        }

        /* 
         * Lấy danh sách Unit theo CourseId và trạng thái (Overload)
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Unit>> GetAllUnits(int courseId, bool isActive)
        {
            return await _context.Units
                .AsNoTracking()
                .Where(x => x.CourseId == courseId && x.IsActive == isActive)
                .ToListAsync();
        }
    }
}