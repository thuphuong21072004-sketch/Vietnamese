using Backend.dto;
using Backend.Models;

namespace Backend.Repository
{
    public interface UserAnswerRepository
    {
        Task<List<UserAnswerDTO>> GetUserAnswers(int userId, int quizId);
        Task SaveUserAnswer(UserAnswer userAnswer);
        Task DeleteByUserQuizId(int userQuizId);
        Task Save();
    }
}