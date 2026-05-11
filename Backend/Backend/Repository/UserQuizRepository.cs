using Backend.Models;

namespace Backend.Repository
{
    public interface UserQuizRepository
    {
        Task SaveUserQuiz(UserQuiz userQuiz);

        Task<UserQuiz?> GetUserQuiz(int userId, int quizId);
        Task Save();
    }
}
