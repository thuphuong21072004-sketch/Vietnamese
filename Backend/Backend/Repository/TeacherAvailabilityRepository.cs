using Backend.Models;

namespace Backend.Repository
{
    public interface TeacherAvailabilityRepository
    {
        Task<TeacherAvailability?> GetById(int id);

        Task<bool> HasOverlapSchedule(int teacherId, DateTime start, DateTime end, int? excludeId = null);

        Task Create(TeacherAvailability availability);

        Task Update(TeacherAvailability availability);

        Task Delete(TeacherAvailability availability);

        Task<List<TeacherAvailability>> GetAvailableSchedules( DateOnly? date);
        Task<List<TeacherAvailability>> GetTeacherSchedules(int teacherId);

        Task<bool> Exists(int id);
        Task Save();
    }
}