using Backend.Data;
using Backend.dto;
using Backend.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Backend.Repository.impl
{
    public class TeacherClassRepositoryImpl
        : TeacherClassRepository
    {
        private readonly AppDbContext _context;

        public TeacherClassRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<TeacherClass> CreateAsync( TeacherClass teacherClass)
        {
            await _context.TeacherClasses
                .AddAsync(teacherClass);

            return teacherClass;
        }

        public async Task<TeacherClass?> GetByIdAsync(int classId)
        {
            return await _context.TeacherClasses
                .Include(x => x.TeacherProfile)
                    .ThenInclude(x => x.User)
                .Include(x => x.ClassSessions.OrderBy(s => s.SessionNumber))
                .Include(x => x.ClassEnrollments)
                .FirstOrDefaultAsync(
                    x => x.ClassId == classId);
        }

        public async Task<List<TeacherClass>> GetAllAsync()
        {
            return await _context.TeacherClasses
                .Include(x => x.ClassScheduleDays)
                .Include(x => x.ClassSessions)
                .ToListAsync();
        }

        public Task UpdateAsync( TeacherClass teacherClass)
        {
            _context.Entry(teacherClass).State =
                Microsoft.EntityFrameworkCore.EntityState.Modified;

            return Task.CompletedTask;
        }

        public Task DeleteAsync( TeacherClass teacherClass)
        {
            _context.TeacherClasses
                .Remove(teacherClass);

            return Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<List<TeacherClass>> GetByTeacherProfileIdAsync( int teacherProfileId)
        {
            return await _context
                .TeacherClasses
                .Include(x => x.ClassScheduleDays)
                .Where(x =>
                    x.TeacherProfileId ==
                    teacherProfileId)
                .ToListAsync();
        }
        public async Task<decimal> CalculateMaxPrice(
    int teacherProfileId,
    int maxStudents,
    int totalSessions,
    TimeSpan startTime,
    TimeSpan endTime)
        {
            var connection =
                _context.Database
                    .GetDbConnection();

            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync();
            }

            using var command =
                connection.CreateCommand();

            command.CommandText =
                "CalculateCoursePrice";

            command.CommandType =
                CommandType.StoredProcedure;

            command.Parameters.Add(
                new SqlParameter(
                    "@TeacherProfileId",
                    teacherProfileId));

            command.Parameters.Add(
                new SqlParameter(
                    "@MaxStudents",
                    maxStudents));

            command.Parameters.Add(
                new SqlParameter(
                    "@TotalSessions",
                    totalSessions));

            command.Parameters.Add(
                new SqlParameter(
                    "@StartTime",
                    startTime));

            command.Parameters.Add(
                new SqlParameter(
                    "@EndTime",
                    endTime));

            var result =
                await command.ExecuteScalarAsync();

            return Convert.ToDecimal(result);
        }

        public async Task<List<TeacherClass>> SearchMyClassesAsync(
        ClassFilterDto filter,
        int teacherProfileId)
        {
            var query =
                _context.TeacherClasses
                    .Include(x => x.ClassScheduleDays)
                    .Include(x => x.ClassSessions)
                    .Where(x =>
                        x.TeacherProfileId ==
                        teacherProfileId);

            if (!string.IsNullOrWhiteSpace(filter.MainTopic))
            {
                query = query.Where(x =>
                    x.MainTopic ==
                    filter.MainTopic);
            }

            if (!string.IsNullOrWhiteSpace(filter.SubTopic))
            {
                query = query.Where(x =>
                    x.SubTopic ==
                    filter.SubTopic);
            }

            if (
                filter.StartTime != null &&
                filter.EndTime != null
            )
            {
                query = query.Where(x =>
                    x.StartTime <= filter.EndTime
                    &&
                    x.EndTime >= filter.StartTime);
            }

            if (
                filter.DaysOfWeek != null &&
                filter.DaysOfWeek.Any()
            )
            {
                query = query.Where(x =>
                    x.ClassScheduleDays.Any(
                        d =>
                            filter.DaysOfWeek.Contains(
                                d.DayOfWeek)));
            }

            var result =
                await query.ToListAsync();

            if (
                filter.StartDate != null ||
                filter.EndDate != null
            )
            {
                var filterStart =
                    DateOnly.FromDateTime(
                        filter.StartDate ??
                        DateTime.MinValue);

                var filterEnd =
                    filter.EndDate ??
                    DateOnly.MaxValue;

                result = result
                    .Where(x =>
                    {
                        if (!x.ClassSessions.Any())
                        {
                            return false;
                        }

                        var classStart =
                            x.ClassSessions
                                .Min(s => s.StudyDate);

                        var classEnd =
                            x.ClassSessions
                                .Max(s => s.StudyDate);

                        return
                            classStart <= filterEnd
                            &&
                            classEnd >= filterStart;
                    })
                    .ToList();
            }

            return result
                .OrderBy(x =>
                    x.ClassSessions.Any()
                        ? x.ClassSessions.Min(
                            s => s.StudyDate)
                        : DateOnly.MaxValue)
                .ThenBy(x => x.StartTime)
                .ToList();
        }

        public async Task<List<TeacherClass>>SearchClassesAsync(
        ClassFilterDto filter)
        {
            var query =
    _context.TeacherClasses
        .Include(x => x.TeacherProfile)
            .ThenInclude(x => x.User)
        .Include(x => x.ClassScheduleDays)
        .Include(x => x.ClassSessions)
        .AsQueryable();

            var today =
    DateOnly.FromDateTime(
        DateTime.Today);

            query = query.Where(x =>

                x.ClassSessions.Any()

                &&

                x.ClassSessions.Min(
                    s => s.StudyDate) > today
            );

            if (!string.IsNullOrWhiteSpace(
    filter.Country))
            {
                query = query.Where(x =>

                    x.TeacherProfile != null

                    &&

                    x.TeacherProfile.User != null

                    &&

                    x.TeacherProfile.User.Country ==
                    filter.Country
                );
            }
            if (filter.MinRating != null)
            {
                query = query.Where(x =>

                    x.TeacherProfile != null

                    &&

                    x.TeacherProfile.RatingAverage >=
                    filter.MinRating
                );
            }


            if (!string.IsNullOrWhiteSpace(
                filter.MainTopic))
            {
                query = query.Where(x =>
                    x.MainTopic ==
                    filter.MainTopic);
            }

            if (!string.IsNullOrWhiteSpace(
                filter.SubTopic))
            {
                query = query.Where(x =>
                    x.SubTopic ==
                    filter.SubTopic);
            }

            if (filter.MinPrice != null)
            {
                query = query.Where(x =>
                    x.Price >=
                    filter.MinPrice);
            }

            if (filter.MaxPrice != null)
            {
                query = query.Where(x =>
                    x.Price <=
                    filter.MaxPrice);
            }

            /*
             * Time filter
             * Class must be completely inside
             * selected time range
             */
            if (
                filter.StartTime != null
                &&
                filter.EndTime != null
            )
            {
                query = query.Where(x =>
                    x.StartTime >=
                    filter.StartTime
                    &&
                    x.EndTime <=
                    filter.EndTime);
            }
            else if (filter.StartTime != null)
            {
                query = query.Where(x =>
                    x.StartTime >=
                    filter.StartTime);
            }
            else if (filter.EndTime != null)
            {
                query = query.Where(x =>
                    x.EndTime <=
                    filter.EndTime);
            }

            /*
             * Day of week filter
             * All class days must belong
             * to selected days
             */
            if (
                filter.DaysOfWeek != null
                &&
                filter.DaysOfWeek.Any()
            )
            {
                query = query.Where(x =>

                    x.ClassScheduleDays.Any()

                    &&

                    x.ClassScheduleDays.All(
                        d =>
                            filter.DaysOfWeek
                                .Contains(
                                    d.DayOfWeek))
                );
            }

            var result =
                await query.ToListAsync();

            /*
             * Date range filter
             * Entire course duration must be
             * inside selected date range
             */
            if (
                filter.StartDate != null
                ||
                filter.EndDate != null
            )
            {
                var filterStart =
                    DateOnly.FromDateTime(
                        filter.StartDate ??
                        DateTime.MinValue);

                var filterEnd =
                    filter.EndDate ??
                    DateOnly.MaxValue;

                result = result
                    .Where(x =>
                    {
                        if (
                            !x.ClassSessions.Any()
                        )
                        {
                            return false;
                        }

                        var classStart =
                            x.ClassSessions
                                .Min(
                                    s =>
                                    s.StudyDate);

                        var classEnd =
                            x.ClassSessions
                                .Max(
                                    s =>
                                    s.StudyDate);

                        return
                            classStart >=
                            filterStart
                            &&
                            classEnd <=
                            filterEnd;
                    })
                    .ToList();
            }

            return result
                .OrderBy(x =>
                    x.ClassSessions.Any()
                        ? x.ClassSessions
                            .Min(
                                s =>
                                s.StudyDate)
                        : DateOnly.MaxValue)
                .ThenBy(x =>
                    x.StartTime)
                .ToList();
        }

        public async Task<TeacherClass?> GetClassWithSessionsAsync( int classId)
        {
            return await _context
                .TeacherClasses
                .Include(x => x.ClassSessions)
                .Include(x => x.ClassEnrollments)
                .FirstOrDefaultAsync(x =>
                    x.ClassId == classId);
        }

        public async Task<List<TeacherClass>> GetTeacherClassesAsync( int teacherProfileId)
        {
            return await _context.TeacherClasses
                .Include(x => x.ClassSessions)
                .Where(x =>
                    x.TeacherProfileId ==
                    teacherProfileId)
                .ToListAsync();
        }

        public async Task<TeacherClass?> GetById(
    int classId)
        {
            return await _context.TeacherClasses
                .Include(x => x.TeacherProfile)
                .FirstOrDefaultAsync(
                    x => x.ClassId == classId);
        }
    }
}