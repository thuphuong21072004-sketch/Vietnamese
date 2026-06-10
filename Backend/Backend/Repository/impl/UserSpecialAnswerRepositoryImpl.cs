using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class UserSpecialAnswerRepositoryImpl : UserSpecialAnswerRepository
    {
        private readonly AppDbContext _context;

        public UserSpecialAnswerRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        public async Task SaveAsync(UserSpecialAnswer answer)
        {
            await _context.UserSpecialAnswers.AddAsync(answer);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteByUserQuizIdAsync(int userQuizId)
        {
            await _context.UserSpecialAnswers
                .Where(x => x.UserQuizId == userQuizId)
                .ExecuteDeleteAsync();
        }

        public async Task<List<UserSpecialAnswer>> GetByUserQuizIdAsync(int userQuizId)
        {
            return await _context.UserSpecialAnswers
                .AsNoTracking()
                .Where(x => x.UserQuizId == userQuizId)
                .ToListAsync();
        }
    }
}
