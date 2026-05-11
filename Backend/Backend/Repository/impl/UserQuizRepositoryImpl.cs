using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class UserQuizRepositoryImpl : UserQuizRepository
    {
        private readonly AppDbContext _context;

        public UserQuizRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lưu hoặc cập nhật kết quả làm bài của người dùng 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task SaveUserQuiz(UserQuiz userQuiz)
        {
            
            var oldUserQuiz = await _context.UserQuiz
                .FirstOrDefaultAsync(x => x.UserId == userQuiz.UserId && x.QuizId == userQuiz.QuizId);

            if (oldUserQuiz != null)
            {
                
                oldUserQuiz.Score = userQuiz.Score;
                oldUserQuiz.CompletedDate = userQuiz.CompletedDate;
                oldUserQuiz.IsPassed = userQuiz.IsPassed;

                userQuiz.UserQuizId = oldUserQuiz.UserQuizId;
            }
            else
            {
                
                await _context.UserQuiz.AddAsync(userQuiz);
            }

            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy thông tin kết quả làm bài kèm danh sách câu trả lời 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<UserQuiz?> GetUserQuiz(int userId, int quizId)
        {
            return await _context.UserQuiz
                .AsNoTracking()
                .Include(x => x.UserAnswers)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.QuizId == quizId);
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