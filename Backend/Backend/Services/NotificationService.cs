using Backend.Models;

namespace Backend.Services.Interfaces
{
    public interface NotificationService
    {
        Task CreateNotification(
            int userId,
            string title,
            string content,
            string type);

        Task<List<Notification>> GetMyNotifications(
            int userId);

        Task ReadNotification(int id);
    }
}