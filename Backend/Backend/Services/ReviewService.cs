using Backend.dto;

namespace Backend.Services
{
    public interface ReviewService
    {
        Task Create(ReviewDTO dto);
        Task<List<ReviewDTO>> GetByTeacherId(int teacherId);
        Task<ReviewDTO?> GetByBookingId(int bookingId);
    }
}