using Backend.Models;

namespace Backend.Repository
{
    public interface PartRepository
    {
        Task<List<Part>> GetPartsByQuiz(int quizId);

        Task AddPart(Part part);

        Task Save();
        Task DeleteParts(List<int> ids);
        Task<Part?> GetPartById(int id);
    }
}
