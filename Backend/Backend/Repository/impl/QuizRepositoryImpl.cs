using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class QuizRepositoryImpl : QuizRepository
    {
        private readonly AppDbContext _context;

        public QuizRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy thông tin bài kiểm tra theo RefId và RefType 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<Quiz?> GetQuiz(int refId, string refType)
        {
            return await _context.Quizzes
                .AsNoTracking()
                .Include(x => x.Questions)
                    .ThenInclude(x => x.Answers)
                .Include(x => x.Parts)
                    .ThenInclude(x => x.Questions)
                        .ThenInclude(x => x.Answers)
                .Include(x => x.Parts)
                    .ThenInclude(x => x.Passages)
                        .ThenInclude(x => x.Questions)
                            .ThenInclude(x => x.Answers)
                .FirstOrDefaultAsync(x => x.RefId == refId && x.RefType == refType);
        }

        /* 
         * Thêm mới một bài kiểm tra 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddQuiz(Quiz quiz)
        {
            await _context.Quizzes.AddAsync(quiz);
        }

        /* 
         * Xóa bài kiểm tra và toàn bộ dữ liệu liên quan phân tầng 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteQuiz(Quiz quiz)
        {
            int quizId = quiz.QuizId;

            var partIds = await _context.Parts.Where(x => x.QuizId == quizId).Select(x => x.PartId).ToListAsync();
            var passageIds = await _context.Passages.Where(x => partIds.Contains(x.PartId)).Select(x => x.PassageId).ToListAsync();

            var questionIds = await _context.Questions
                .Where(x => x.QuizId == quizId || (x.PartId != null && partIds.Contains(x.PartId.Value)) || (x.PassageId != null && passageIds.Contains(x.PassageId.Value)))
                .Select(x => x.QuestionId)
                .ToListAsync();

            var answerIds = await _context.Answers.Where(x => questionIds.Contains(x.QuestionId)).Select(x => x.AnswerId).ToListAsync();

            await _context.UserAnswer.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Answers.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Questions.Where(x => questionIds.Contains(x.QuestionId)).ExecuteDeleteAsync();
            await _context.Passages.Where(x => passageIds.Contains(x.PassageId)).ExecuteDeleteAsync();
            await _context.Parts.Where(x => partIds.Contains(x.PartId)).ExecuteDeleteAsync();
            await _context.Quizzes.Where(x => x.QuizId == quizId).ExecuteDeleteAsync();
        }

        /* 
         * Lấy bài kiểm tra chi tiết theo ID 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<Quiz?> GetQuizById(int quizId)
        {
            return await _context.Quizzes
                .AsNoTracking()
                .Include(x => x.Questions)
                    .ThenInclude(x => x.Answers)
                .Include(x => x.Parts)
                    .ThenInclude(x => x.Questions)
                        .ThenInclude(x => x.Answers)
                .Include(x => x.Parts)
                    .ThenInclude(x => x.Passages)
                        .ThenInclude(x => x.Questions)
                            .ThenInclude(x => x.Answers)
                .FirstOrDefaultAsync(x => x.QuizId == quizId);
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
    }
}