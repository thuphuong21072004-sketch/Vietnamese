using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using static Backend.common.Constant;

namespace Backend.Repository.impl
{
    public class TeacherScheduleRepositoryImpl
        : TeacherScheduleRepository
    {
        private readonly AppDbContext _context;

        public TeacherScheduleRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<TeacherSchedule?>
            GetById(
                int scheduleId)
        {
            return await _context.TeacherSchedules
                .Include(x => x.Teacher)
                .ThenInclude(x => x.TeacherProfile)
                .FirstOrDefaultAsync(
                    x => x.ScheduleId ==
                         scheduleId);
        }

        public async Task<List<TeacherSchedule>>
            GetAll()
        {
            return await _context.TeacherSchedules
                .Include(x => x.Teacher)
                .ThenInclude(x => x.TeacherProfile)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<TeacherSchedule>>
            GetByTeacherId(
                int teacherId)
        {
            return await _context.TeacherSchedules
                .Include(x => x.Teacher)
                .ThenInclude(x => x.TeacherProfile)
                .Where(x =>
                    x.TeacherId ==
                    teacherId)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<TeacherSchedule>>
            GetSuggestedTeachers(
                string destination,
                DateOnly startDate,
                DateOnly endDate)
        {
            return await _context.TeacherSchedules
                .Include(x => x.Teacher)
                .ThenInclude(x => x.TeacherProfile)
                .Where(x =>

                    x.Status ==
                    TeacherScheduleStatus.Open

                    &&

                    (x.Destination.ToLower().Contains(destination.ToLower())
                     || destination.ToLower().Contains(x.Destination.ToLower()))

                    &&

                    x.AvailableFrom <=
                    startDate

                    &&

                    x.AvailableTo >=
                    endDate)
                .OrderByDescending(
                    x => x.Teacher.TeacherProfile != null
                        ? x.Teacher.TeacherProfile.RatingAverage
                        : 0m)
                .Take(10)
                .ToListAsync();
        }

        public async Task Create(
            TeacherSchedule schedule)
        {
            await _context
                .TeacherSchedules
                .AddAsync(schedule);
        }

        public async Task Update(
            TeacherSchedule schedule)
        {
            _context
                .TeacherSchedules
                .Update(schedule);

            await Task.CompletedTask;
        }

        public async Task Delete(
            TeacherSchedule schedule)
        {
            _context
                .TeacherSchedules
                .Remove(schedule);

            await Task.CompletedTask;
        }

        public async Task Save()
        {
            await _context
                .SaveChangesAsync();
        }
    }
}