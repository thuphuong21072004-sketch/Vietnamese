using Backend.Models;

namespace Backend.Repository
{
    public interface ClassScheduleDayRepository
    {
        Task AddRangeAsync(
            List<ClassScheduleDay> days);

        Task SaveChangesAsync();
    }
}