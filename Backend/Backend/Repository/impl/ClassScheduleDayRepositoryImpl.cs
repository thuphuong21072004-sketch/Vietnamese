using Backend.Data;
using Backend.Models;

namespace Backend.Repository.impl
{
    public class ClassScheduleDayRepositoryImpl
        : ClassScheduleDayRepository
    {
        private readonly AppDbContext _context;

        public ClassScheduleDayRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task AddRangeAsync(
            List<ClassScheduleDay> days)
        {
            await _context.ClassScheduleDays
                .AddRangeAsync(days);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}