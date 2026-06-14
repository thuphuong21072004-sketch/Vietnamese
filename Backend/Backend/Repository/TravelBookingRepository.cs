using Backend.Models;

namespace Backend.Repository
{
    public interface TravelBookingRepository
    {
        Task<TravelBooking?> GetById(
            int bookingId);

        Task<List<TravelBooking>>
            GetByScheduleId(
                int scheduleId);

        Task<List<TravelBooking>>
            GetByTripId(
                int tripId);

        Task<List<TravelBooking>>
            GetConfirmedByScheduleId(
                int scheduleId);

        Task<bool>
            HasConflictBooking(
                int scheduleId,
                DateOnly startDate,
                DateOnly endDate);

        Task Create(
            TravelBooking booking);

        Task Update(
            TravelBooking booking);

        Task Delete(
            TravelBooking booking);

        Task Save();
    }
}