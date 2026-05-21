using Backend.dto;

namespace Backend.Services
{
    public interface BookingService
    {
        Task<BookingDTO> Create(int availabilityId);

        Task<List<BookingDTO>> GetMyBookings();

        Task<List<BookingDTO>> GetTeacherBookings();

        Task Cancel(int bookingId);
        Task<BookingDTO> GetDetail(int bookingId);
        
    }
}