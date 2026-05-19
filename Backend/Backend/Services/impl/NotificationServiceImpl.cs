using Backend.Models;
using Backend.Repositories;
using Backend.Services.Interfaces;

namespace Backend.Services
{
    public class NotificationServiceImpl : NotificationService
    {
        private readonly NotificationRepository _repository;

        public NotificationServiceImpl(
            NotificationRepository repository)
        {
            _repository = repository;
        }

        public async Task CreateNotification(
            int userId,
            string title,
            string content,
            string type)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Content = content,
                Type = type,
                IsRead = false,
                CreatedDate = DateTime.Now
            };

            await _repository.Create(notification);

            await _repository.Save();
        }

        public async Task<List<Notification>> GetMyNotifications(
            int userId)
        {
            return await _repository.GetByUserId(userId);
        }

        public async Task ReadNotification(int id)
        {
            var notification = await _repository.GetById(id);

            if (notification == null)
                return;

            notification.IsRead = true;

            await _repository.Save();
        }
    }
}