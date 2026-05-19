using Backend.dto;

namespace Backend.Services
{
    public interface VideoRoomService
    {
        Task<VideoRoomDTO>Create(int bookingId);

        Task<VideoRoomDTO?>GetByBookingId(int bookingId);
    }
}