using Backend.Models;

namespace Backend.Repository
{
    public interface UserSpecialAnswerRepository
    {
        Task SaveAsync(UserSpecialAnswer answer);
        Task DeleteByUserQuizIdAsync(int userQuizId);
        Task<List<UserSpecialAnswer>> GetByUserQuizIdAsync(int userQuizId);
    }
}
