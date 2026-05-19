using Backend.Models;

namespace Backend.Repositories
{
    public interface NotificationRepository
    {
        Task Create(Notification notification);

        Task<List<Notification>> GetByUserId(int userId);

        Task<Notification?> GetById(int id);

        Task Save();
    }
}