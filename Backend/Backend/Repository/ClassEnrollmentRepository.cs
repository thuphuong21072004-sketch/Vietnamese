using Backend.Models;

namespace Backend.Repository
{
    public interface ClassEnrollmentRepository
    {
        Task<ClassEnrollment?> GetByIdAsync(
            int enrollmentId);

        Task<ClassEnrollment?> GetEnrollmentAsync(
            int classId,
            int studentId);

        Task CreateAsync(
            ClassEnrollment enrollment);

        Task UpdateAsync(
            ClassEnrollment enrollment);

        Task<List<ClassEnrollment>>
            GetStudentEnrollmentsAsync(
                int studentId);

        Task<List<ClassEnrollment>>
            GetClassEnrollmentsAsync(
                int classId);
        Task<ClassEnrollment?> GetByClassAndStudent(
    int classId,
    int studentId);
    }
}