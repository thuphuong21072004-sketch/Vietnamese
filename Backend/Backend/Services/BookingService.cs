using Backend.dto;

namespace Backend.Services
{
    public interface BookingService
    {
        Task<BookingDTO> Create(int availabilityId);
        Task<BookingDTO> GetDetail(int bookingId);
        Task<List<BookingDTO>> GetMyBookings(byte? status, DateOnly? date);
        Task<List<BookingDTO>> GetTeacherBookings(byte? status, DateOnly? date);
        Task Cancel(int bookingId);
        Task<object> GetMyStatistics(int month, int year);
        Task<object> GetTeacherStatistics(int month, int year);
        Task<object> GetTopTeachers(int month, int year);
        Task<object> GetTopStudents(int month, int year);
    }
}