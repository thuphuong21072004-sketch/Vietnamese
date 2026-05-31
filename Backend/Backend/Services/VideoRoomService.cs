using Backend.dto;

namespace Backend.Services
{
    public interface VideoRoomService
    {
        Task<VideoRoomDTO>Create(int bookingId);

        Task<string> JoinRoom(int bookingId);
    }
}