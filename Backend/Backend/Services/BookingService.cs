using Backend.dto;

namespace Backend.Services
{
    public interface BookingService
    {
        Task<BookingDTO> Create(int availabilityId);

        Task<List<BookingDTO>>
GetMyBookings(
    byte? status,
    DateOnly? date);

        Task<List<BookingDTO>>
        GetTeacherBookings(
            byte? status,
            DateOnly? date);

        Task Cancel(int bookingId);
        Task<BookingDTO> GetDetail(int bookingId);
        
    }
}