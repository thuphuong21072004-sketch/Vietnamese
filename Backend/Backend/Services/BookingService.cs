using Backend.dto;

namespace Backend.Services
{
    public interface BookingService
    {
        Task Create(int availabilityId);

        Task<List<BookingDTO>> GetMyBookings();

        Task<List<BookingDTO>> GetTeacherBookings();

        Task Cancel(int bookingId);
        Task Complete(int bookingId);
        Task<BookingDTO> GetDetail(int bookingId);
        Task Confirm(int bookingId);
    }
}