using Backend.Models;

namespace Backend.Repository
{
    public interface ReviewRepository
    {
        Task<Review?> GetById(int id);

        Task<Review?> GetByBookingId( int bookingId);

        Task<List<Review>>GetByTeacherId(int teacherId);

        Task Create(Review review);

        Task Save();
    }
}