using Backend.Models;

namespace Backend.Repository
{
    public interface ReviewRepository
    {
        Task<Review?> GetById(int id);

        Task<Review?> GetByRef(
    string refName,
    int refId);

        Task<List<Review>>GetByTeacherId(int teacherId);

        Task Create(Review review);

        Task Save();
    }
}