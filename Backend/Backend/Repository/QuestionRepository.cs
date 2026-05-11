using Backend.Models;

namespace Backend.Repository
{
    public interface QuestionRepository
    {
        Task<List<Question>> GetQuestionsByPart(int partId);

        Task<List<Question>> GetQuestionsByPassage(int passageId);

        Task AddQuestion(Question question);
        Task<List<Question>> GetQuestionsByQuiz(int quizId);
        Task Save();
        Task DeleteQuestions(List<int> ids);
        Task<Question?>GetQuestionById(int id);
    }
}
