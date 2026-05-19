using Backend.Data;
using Backend.Models;
using Backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class NotificationRepositoryImpl : NotificationRepository
    {
        private readonly AppDbContext _context;

        public NotificationRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        public async Task Create(Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
        }

        public async Task<List<Notification>> GetByUserId(int userId)
        {
            return await _context.Notifications
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedDate)
                .ToListAsync();
        }

        public async Task<Notification?> GetById(int id)
        {
            return await _context.Notifications
                .FirstOrDefaultAsync(x => x.NotificationId == id);
        }

        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}