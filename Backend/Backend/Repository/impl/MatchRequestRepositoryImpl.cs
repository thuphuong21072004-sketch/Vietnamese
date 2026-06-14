using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using static Backend.common.Constant;

namespace Backend.Repository.impl
{
    public class MatchRequestRepositoryImpl
        : MatchRequestRepository
    {
        private readonly AppDbContext _context;

        public MatchRequestRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<MatchRequest?>
            GetById(
                int requestId)
        {
            return await _context.MatchRequests
                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)
                .FirstOrDefaultAsync(
                    x => x.MatchRequestId ==
                         requestId);
        }

        public async Task<MatchRequest?>
            GetByScheduleAndTrip(
                int scheduleId,
                int tripId)
        {
            return await _context.MatchRequests
                .FirstOrDefaultAsync(
                    x =>
                        x.ScheduleId ==
                        scheduleId
                        &&
                        x.TripId ==
                        tripId);
        }

        public async Task<List<MatchRequest>>
            GetByTeacherId(
                int teacherId)
        {
            return await _context.MatchRequests
                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)
                .Where(x =>
                    x.Schedule.TeacherId ==
                    teacherId)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<MatchRequest>>
            GetByStudentId(
                int studentId)
        {
            return await _context.MatchRequests
                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)
                .Where(x =>
                    x.Trip.StudentId ==
                    studentId)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<MatchRequest>>
            GetPendingByTeacherId(
                int teacherId)
        {
            return await _context.MatchRequests
                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)
                .Where(x =>
                    x.Schedule.TeacherId ==
                    teacherId
                    &&
                    x.Status ==
                    MatchRequestStatus.Pending)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<MatchRequest>>
            GetPendingByStudentId(
                int studentId)
        {
            return await _context.MatchRequests
                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)
                .Where(x =>
                    x.Trip.StudentId ==
                    studentId
                    &&
                    x.Status ==
                    MatchRequestStatus.Pending)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<MatchRequest>>
            GetByScheduleId(
                int scheduleId)
        {
            return await _context.MatchRequests
                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)
                .Where(x =>
                    x.ScheduleId ==
                    scheduleId)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<MatchRequest>>
            GetByTripId(
                int tripId)
        {
            return await _context.MatchRequests
                .Include(x => x.Schedule)
                .ThenInclude(x => x.Teacher)
                .Include(x => x.Trip)
                .ThenInclude(x => x.Student)
                .Where(x =>
                    x.TripId ==
                    tripId)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task Create(
            MatchRequest request)
        {
            await _context.MatchRequests
                .AddAsync(request);
        }

        public async Task Update(
            MatchRequest request)
        {
            _context.MatchRequests
                .Update(request);

            await Task.CompletedTask;
        }

        public async Task Delete(
            MatchRequest request)
        {
            _context.MatchRequests
                .Remove(request);

            await Task.CompletedTask;
        }

        public async Task Save()
        {
            await _context
                .SaveChangesAsync();
        }
    }
}