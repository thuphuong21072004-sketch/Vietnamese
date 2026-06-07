using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using static Backend.common.Constant;

namespace Backend.Repository.impl
{
    public class ClassEnrollmentRepositoryImpl
        : ClassEnrollmentRepository
    {
        private readonly AppDbContext _context;

        public ClassEnrollmentRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<ClassEnrollment?> GetByIdAsync(
    int enrollmentId)
        {
            return await _context.ClassEnrollments

                .Include(x => x.TeacherClass)

                    .ThenInclude(x => x.TeacherProfile)

                        .ThenInclude(x => x.User)

                .Include(x => x.TeacherClass)

                    .ThenInclude(x => x.ClassSessions)

                .FirstOrDefaultAsync(x =>
                    x.EnrollmentId == enrollmentId);
        }

        public async Task<ClassEnrollment?> GetEnrollmentAsync( int classId, int studentId)
        {
            return await _context.ClassEnrollments
                .FirstOrDefaultAsync(x =>
                    x.ClassId == classId
                    &&
                    x.StudentId == studentId);
        }

        public async Task CreateAsync( ClassEnrollment enrollment)
        {
            _context.ClassEnrollments
                .Add(enrollment);

            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync( ClassEnrollment enrollment)
        {
            _context.ClassEnrollments
                .Update(enrollment);

            await _context.SaveChangesAsync();
        }

        public async Task<List<ClassEnrollment>> GetStudentEnrollmentsAsync(
    int studentId)
        {
            return await _context.ClassEnrollments

    .Include(x => x.TeacherClass)
        .ThenInclude(x => x.TeacherProfile)
            .ThenInclude(x => x.User)

    .Include(x => x.TeacherClass)
        .ThenInclude(x => x.ClassSessions)

    .Where(x => x.StudentId == studentId)

    .ToListAsync();
        }

        public async Task<List<ClassEnrollment>> GetClassEnrollmentsAsync(
    int classId)
        {
            return await _context.ClassEnrollments

                .Include(x => x.Student)

                .Where(x =>
    x.ClassId == classId
    &&
    (
        x.Status == StatusBooking.Confirmed
        || x.Status == StatusBooking.InProgress
        || x.Status == StatusBooking.Completed
    ))

                .ToListAsync();
        }

        public async Task<ClassEnrollment?> GetByClassAndStudent(int classId, int studentId) { return await _context.ClassEnrollments.FirstOrDefaultAsync(x => x.ClassId == classId && x.StudentId == studentId); }
    }
}