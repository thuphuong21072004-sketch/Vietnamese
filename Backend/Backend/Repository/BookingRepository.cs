using Backend.Models;

namespace Backend.Repository
{
    public interface BookingRepository
    {
        Task<Booking?> GetById(int id);

        Task<List<Booking>>
GetByStudentId(
    int studentId,
    byte? status,
    DateOnly? date);

        Task<List<Booking>>
        GetByTeacherId(
            int instructorId,
            byte? status,
            DateOnly? date);

        Task Create(Booking booking);

        Task Update(Booking booking);
        Task<Booking?> GetActiveBookingByAvailabilityId(int availabilityId, DateTime activeSince);
        Task<List<Booking>> GetPendingBookingsBefore(int availabilityId, DateTime threshold);
        Task<bool> HasOverlapBooking( int studentId, DateTime startTime, DateTime endTime);
        Task<bool> HasBookingByAvailabilityId(
    int availabilityId);
        Task Save();
    }
}