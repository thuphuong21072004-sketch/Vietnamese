using Backend.dto;
using Backend.Models;

namespace Backend.Services
{
    public interface ClassEnrollmentService
    {
        Task<int> EnrollAsync(int classId);

        Task CancelAsync(
            int enrollmentId);

        Task<List<ClassEnrollmentDto>> GetMyClassesAsync();

        Task<List<ClassEnrollmentDto>> GetClassStudentsAsync(
                int classId);

        Task<List<UpcomingScheduleDto>> GetStudentUpcomingScheduleAsync();

        Task<List<UpcomingScheduleDto>> GetTeacherUpcomingScheduleAsync();
        Task<ClassEnrollment> GetDetailAsync(
    int enrollmentId);
    }
}