using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class PartRepositoryImpl : PartRepository
    {
        private readonly AppDbContext _context;

        public PartRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách Part theo QuizId 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Part>> GetPartsByQuiz(int quizId)
        {
            return await _context.Parts
                .AsNoTracking()
                .Where(x => x.QuizId == quizId)
                .OrderBy(x => x.PartNumber)
                .ToListAsync();
        }

        /* 
         * Thêm mới một Part 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddPart(Part part)
        {
            await _context.Parts.AddAsync(part);
            await _context.SaveChangesAsync();
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
         * Xóa hàng loạt Part và các dữ liệu liên quan (Passage, Question, Answer...) 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteParts(List<int> ids)
        {
            if (ids == null || !ids.Any()) return;

            var passageIds = await _context.Passages
                .Where(x => ids.Contains(x.PartId))
                .Select(x => x.PassageId)
                .ToListAsync();

            var questionIds = await _context.Questions
                .Where(x => (x.PassageId != null && passageIds.Contains(x.PassageId.Value)) ||
                            (x.PartId != null && ids.Contains(x.PartId.Value)))
                .Select(x => x.QuestionId)
                .ToListAsync();

            var answerIds = await _context.Answers
                .Where(x => questionIds.Contains(x.QuestionId))
                .Select(x => x.AnswerId)
                .ToListAsync();

            await _context.UserAnswer.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Answers.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Questions.Where(x => questionIds.Contains(x.QuestionId)).ExecuteDeleteAsync();
            await _context.Passages.Where(x => passageIds.Contains(x.PassageId)).ExecuteDeleteAsync();
            await _context.Parts.Where(x => ids.Contains(x.PartId)).ExecuteDeleteAsync();
        }

        /* 
         * Lấy thông tin Part theo ID 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Part?> GetPartById(int id)
        {
            return await _context.Parts
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.PartId == id);
        }
    }
}