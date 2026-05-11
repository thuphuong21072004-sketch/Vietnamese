using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class AnswerRepositoryImpl : AnswerRepository
    {
        private readonly AppDbContext _context;

        public AnswerRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách câu trả lời theo câu hỏi 
         * O(N)
         * thuphuong21072004 
         */
        public async Task<List<Answer>> GetAnswersByQuestion(int questionId)
        {
            return await _context.Answers
                .AsNoTracking()
                .Where(x => x.QuestionId == questionId)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync();
        }

        /* 
         * Thêm mới một câu trả lời 
         *  O(1)
         * thuphuong21072004 
         */
        public async Task AddAnswer(Answer answer)
        {
            await _context.Answers.AddAsync(answer);
            await _context.SaveChangesAsync();
        }

        /* 
         * Lưu các thay đổi 
         * O(1)
         * thuphuong21072004 
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy thông tin câu trả lời theo ID 
         *  O(1)
         * thuphuong21072004 
         */
        public async Task<Answer?> GetAnswerById(int id)
        {
            return await _context.Answers
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.AnswerId == id);
        }

        /* 
         * Xóa câu trả lời
         *  O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteAnswers(List<int> ids)
        {
            if (ids == null || !ids.Any()) return;

            await _context.UserAnswer
                .Where(x => ids.Contains(x.AnswerId))
                .ExecuteDeleteAsync();

            await _context.Answers
                .Where(x => ids.Contains(x.AnswerId))
                .ExecuteDeleteAsync();
        }
        /*
         * Lấy danh sách answer theo ids
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<Answer>> GetAnswersByIds(
            List<int> ids)
        {
            return await _context.Answers
                .Where(x => ids.Contains(x.AnswerId))
                .ToListAsync();
        }
    }
}