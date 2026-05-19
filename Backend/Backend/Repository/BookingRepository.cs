using Backend.Models;

namespace Backend.Repository
{
    public interface BookingRepository
    {
        Task<Booking?> GetById(int id);

        Task<List<Booking>>GetByStudentId(int studentId);

        Task<List<Booking>>GetByTeacherId(int teacherId);

        Task Create(Booking booking);

        Task Update(Booking booking);
        Task<bool> HasOverlapBooking( int studentId, DateTime startTime, DateTime endTime);
        Task Save();
    }
}