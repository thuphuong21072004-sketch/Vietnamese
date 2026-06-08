using Backend.Models;

namespace Backend.Repository
{
    public interface ReviewRepository
    {
        Task<Review?> GetById(int id);

        Task<Review?> GetByRef(
    string refName,
    int refId);

        Task<Review?> GetByRefAndStudent(
    string refName,
    int refId,
    int studentId);

        Task<List<Review>> GetByTeacherId(int teacherId);

        Task<List<Review>> GetByClassId(int classId);

        Task Create(Review review);

        Task Save();
    }
}