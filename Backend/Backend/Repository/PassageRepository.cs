using Backend.Models;

namespace Backend.Repository
{
    public interface PassageRepository
    {
        Task<List<Passage>> GetPassagesByPart(int partId);
        Task<List<Passage>> GetPassagesByQuiz(int quizId);

        Task AddPassage(Passage passage);

        Task Save();
        Task DeletePassages(List<int> ids);
        Task<Passage?>GetPassageById(int id);
    }
}
