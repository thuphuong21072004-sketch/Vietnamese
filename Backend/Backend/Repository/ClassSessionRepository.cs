using Backend.Models;

namespace Backend.Repository
{
    public interface ClassSessionRepository
    {
        Task AddRangeAsync(
            List<ClassSession> sessions);

        Task<List<ClassSession>>
            GetByClassIdAsync(
                int classId);

        Task<ClassSession?> GetByIdAsync(
            int sessionId);

        Task SaveChangesAsync();
    }
}