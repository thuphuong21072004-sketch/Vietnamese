using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class TeacherAvailabilityRepositoryImpl : TeacherAvailabilityRepository
    {
        private readonly AppDbContext _context;

        public TeacherAvailabilityRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TeacherAvailability?> GetById(int id)
        {
            return await _context.TeacherAvailabilities
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.Role)
                .FirstOrDefaultAsync(x => x.AvailabilityId == id);
        }

        public async Task<bool> HasOverlapSchedule(int instructorId, DateTime start, DateTime end, int? excludeId = null)
        {
            return await _context.TeacherAvailabilities
                .AnyAsync(x => x.InstructorId == instructorId
                    && x.EndTime > DateTime.UtcNow
                    && (excludeId == null || x.AvailabilityId != excludeId)
                    && (start < x.EndTime && end > x.StartTime));
        }

        public async Task Create(TeacherAvailability availability)
        {
            await _context.TeacherAvailabilities.AddAsync(availability);
        }

        public async Task Update(TeacherAvailability availability)
        {
            _context.TeacherAvailabilities.Update(availability);
            await Task.CompletedTask;
        }

        public async Task Delete(TeacherAvailability availability)
        {
            _context.TeacherAvailabilities.Remove(availability);
            await Task.CompletedTask;
        }

        public async Task<List<TeacherAvailability>> GetAvailableSchedules(DateOnly? date)
        {
            var query = _context.TeacherAvailabilities
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.Role)
                .Where(x => x.StartTime > DateTime.UtcNow
                    && x.Status == common.Constant.StatusTeacherAvailability.Available
                    && x.Instructor != null
                    && x.Instructor.TeacherProfile != null
                    && x.Instructor.TeacherProfile.Status == common.Constant.StatusTeacherProfile.ApprovedTeacher);

            if (date != null)
            {
                query = query.Where(x => DateOnly.FromDateTime(x.StartTime) == date);
            }

            return await query
                .OrderBy(x => x.StartTime)
                .ToListAsync();
        }

        public async Task<List<TeacherAvailability>> GetTeacherSchedules(int instructorId, byte? status, DateOnly? date)
        {
            var query = _context.TeacherAvailabilities
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.TeacherProfile)
                .Include(x => x.Instructor)
                    .ThenInclude(x => x.Role)
                .Where(x => x.InstructorId == instructorId && x.EndTime >= DateTime.UtcNow);

            if (status.HasValue)
            {
                query = query.Where(x => x.Status == status.Value);
            }

            if (date.HasValue)
            {
                query = query.Where(x => DateOnly.FromDateTime(x.StartTime) == date.Value);
            }

            return await query
                .OrderBy(x => x.StartTime)
                .ToListAsync();
        }

        public async Task<bool> Exists(int id)
        {
            return await _context.TeacherAvailabilities.AnyAsync(x => x.AvailabilityId == id);
        }

        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}