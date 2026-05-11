using AutoMapper;
using Backend.Data;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class UserAnswerRepositoryImpl : UserAnswerRepository
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public UserAnswerRepositoryImpl(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        /* 
         * Lưu câu trả lời của người dùng 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task SaveUserAnswer(UserAnswer userAnswer)
        {
            await _context.UserAnswer.AddAsync(userAnswer);
            await _context.SaveChangesAsync();
        }

        /* 
         * Lấy danh sách câu trả lời của người dùng theo UserId và QuizId 
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<UserAnswerDTO>> GetUserAnswers(int userId, int quizId)
        {
            var data = await _context.UserAnswer
                .AsNoTracking()
                .Include(x => x.Question)
                .Include(x => x.Answer)
                .Include(x => x.UserQuiz)
                .Where(x => x.UserQuiz.UserId == userId && x.Question.QuizId == quizId)
                .ToListAsync();

            return _mapper.Map<List<UserAnswerDTO>>(data);
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
         * Xóa các câu trả lời dựa trên UserQuizId 
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeleteByUserQuizId(int userQuizId)
        {
            await _context.UserAnswer
                .Where(x => x.UserQuizId == userQuizId)
                .ExecuteDeleteAsync();
        }
    }
}