using Backend.dto;

namespace Backend.Services
{
    public interface VideoRoomService
    {
        Task<VideoRoomDTO> Create(
    string refName,
    int refId);

        Task<string> JoinRoom(
            string refName,
            int refId);
    }
}