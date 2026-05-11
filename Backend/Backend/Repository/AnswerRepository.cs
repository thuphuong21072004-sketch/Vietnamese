using Backend.Models;

namespace Backend.Repository
{
    public interface AnswerRepository
    {
        Task AddAnswer(Answer answer);

        Task Save();
        Task<Answer?>GetAnswerById(int id);
        Task DeleteAnswers(List<int> ids);
        Task<List<Answer>> GetAnswersByIds(
            List<int> ids);
    }
}
