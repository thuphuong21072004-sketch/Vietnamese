using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class PassageRepositoryImpl : PassageRepository
    {
        private readonly AppDbContext _context;

        public PassageRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách đoạn văn theo PartId 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<Passage>> GetPassagesByPart(int partId)
        {
            return await _context.Passages
                .AsNoTracking()
                .Where(x => x.PartId == partId)
                .OrderBy(x => x.OrderIndex)
                .ToListAsync();
        }

        /* 
         * Thêm mới một đoạn văn 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddPassage(Passage passage)
        {
            await _context.Passages.AddAsync(passage);
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
         * Xóa hàng loạt đoạn văn và dữ liệu liên quan (Question, Answer...) 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeletePassages(List<int> ids)
        {
            if (ids == null || !ids.Any()) return;

            var questionIds = await _context.Questions
                .Where(x => x.PassageId != null && ids.Contains(x.PassageId.Value))
                .Select(x => x.QuestionId)
                .ToListAsync();

            var answerIds = await _context.Answers
                .Where(x => questionIds.Contains(x.QuestionId))
                .Select(x => x.AnswerId)
                .ToListAsync();

            
            await _context.UserAnswer.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Answers.Where(x => answerIds.Contains(x.AnswerId)).ExecuteDeleteAsync();
            await _context.Questions.Where(x => questionIds.Contains(x.QuestionId)).ExecuteDeleteAsync();
            await _context.Passages.Where(x => ids.Contains(x.PassageId)).ExecuteDeleteAsync();
        }

        /* 
         * Lấy thông tin đoạn văn theo ID 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<Passage?> GetPassageById(int id)
        {
            return await _context.Passages
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.PassageId == id);
        }
    }
}