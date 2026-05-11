using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class QuestionRepositoryImpl : QuestionRepository
    {
        private readonly AppDbContext _context;

        public QuestionRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách câu hỏi theo PartId 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Question>> GetQuestionsByPart(int partId)
        {
            return await _context.Questions
                .AsNoTracking()
                .Where(x => x.PartId == partId && x.PassageId == null)
                .Include(x => x.Answers)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync();
        }

        /* 
         * Lấy danh sách câu hỏi theo PassageId 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Question>> GetQuestionsByPassage(int passageId)
        {
            return await _context.Questions
                .AsNoTracking()
                .Where(x => x.PassageId == passageId)
                .Include(x => x.Answers)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync();
        }

        /* 
         * Lấy thông tin câu hỏi theo ID 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Question?> GetQuestionById(int id)
        {
            return await _context.Questions
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.QuestionId == id);
        }

        /* 
         * Thêm mới một câu hỏi 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddQuestion(Question question)
        {
            await _context.Questions.AddAsync(question);
            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy danh sách câu hỏi theo QuizId 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Question>> GetQuestionsByQuiz(int quizId)
        {
            return await _context.Questions
                .AsNoTracking()
                .Where(x => x.QuizId == quizId)
                .Include(x => x.Answers)
                .ToListAsync();
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
         * Xóa hàng loạt câu hỏi và dữ liệu liên quan (Answer, UserAnswer) 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteQuestions(List<int> ids)
        {
            if (ids == null || !ids.Any()) return;

            var answerIds = await _context.Answers
                .Where(x => ids.Contains(x.QuestionId))
                .Select(x => x.AnswerId)
                .ToListAsync();

            await _context.UserAnswer.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Answers.Where(x => ids.Contains(x.QuestionId)).ExecuteDeleteAsync();
            await _context.Questions.Where(x => ids.Contains(x.QuestionId)).ExecuteDeleteAsync();
        }
    }
}