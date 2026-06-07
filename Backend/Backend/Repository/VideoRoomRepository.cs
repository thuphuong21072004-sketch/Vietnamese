using Backend.Models;

namespace Backend.Repository
{
    public interface VideoRoomRepository
    {
        Task<VideoRoom?> GetById(int id);

        Task<VideoRoom?> GetByRef( string refName, int refId);

        Task Create(VideoRoom room);

        Task Update(VideoRoom room);

        Task Save();
    }
}