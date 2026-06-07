using Backend.dto;
using Backend.Models;

namespace Backend.Repository
{
    public interface TeacherClassRepository
    {
        Task<TeacherClass> CreateAsync(
            TeacherClass teacherClass);

        Task<TeacherClass?> GetByIdAsync(int classId);

        Task<List<TeacherClass>> GetAllAsync();

        Task UpdateAsync(
            TeacherClass teacherClass);

        Task DeleteAsync(
            TeacherClass teacherClass);

        Task SaveChangesAsync();
        Task<List<TeacherClass>>  GetByTeacherProfileIdAsync( int teacherProfileId);
        Task<decimal> CalculateMaxPrice(
    int teacherProfileId,
    int maxStudents,
    int totalSessions,
    TimeSpan startTime,
    TimeSpan endTime);
        Task<List<TeacherClass>> SearchMyClassesAsync(ClassFilterDto filter, int teacherProfileId);
        Task<List<TeacherClass>>SearchClassesAsync(ClassFilterDto filter);
        Task<TeacherClass?> GetClassWithSessionsAsync( int classId);

        Task<List<TeacherClass>> GetTeacherClassesAsync( int teacherProfileId);
        Task<TeacherClass?> GetById(int classId);

    }
}