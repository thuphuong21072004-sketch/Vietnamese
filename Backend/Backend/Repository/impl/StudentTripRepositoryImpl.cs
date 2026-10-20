using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using static Backend.common.Constant;

namespace Backend.Repository.impl
{
    public class StudentTripRepositoryImpl
        : StudentTripRepository
    {
        private readonly AppDbContext _context;

        public StudentTripRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<StudentTrip?>
            GetById(
                int tripId)
        {
            return await _context.StudentTrips
                .Include(x => x.Student)
                .FirstOrDefaultAsync(
                    x => x.TripId ==
                         tripId);
        }

        public async Task<List<StudentTrip>>
            GetByStudentId(
                int studentId)
        {
            return await _context.StudentTrips
                .Include(x => x.Student)
                .Where(x =>
                    x.StudentId ==
                    studentId)
                .OrderByDescending(
                    x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<StudentTrip>>
            GetSuggestedStudents(
                string destination,
                DateOnly availableFrom,
                DateOnly availableTo)
        {
            return await _context.StudentTrips
                .Include(x => x.Student)
                .Where(x =>

                    x.Status ==
                    StudentTripStatus
                        .FindingTeacher

                    &&

                    (x.Destination.ToLower().Contains(destination.ToLower())
                     || destination.ToLower().Contains(x.Destination.ToLower()))

                    &&

                    x.StartDate >=
                    availableFrom

                    &&

                    x.EndDate <=
                    availableTo)

                .OrderByDescending(
                    x => x.CreatedAt)

                .Take(10)

                .ToListAsync();
        }

        public async Task<List<StudentTrip>>
            GetAllOpen(string? destination)
        {
            var today = common.VnTime.Today; // ngày chuyến đi theo lịch Việt Nam

            var query = _context.StudentTrips
                .Include(x => x.Student)
                .Where(x =>
                    x.Status == StudentTripStatus.FindingTeacher &&
                    x.StartDate >= today)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(destination))
                query = query.Where(x =>
                    x.Destination.ToLower().Contains(destination.ToLower()));

            return await query
                .OrderBy(x => x.StartDate)
                .ToListAsync();
        }

        public async Task Create(
            StudentTrip trip)
        {
            await _context.StudentTrips
                .AddAsync(trip);
        }

        public async Task Update(
            StudentTrip trip)
        {
            _context.StudentTrips
                .Update(trip);

            await Task.CompletedTask;
        }

        public async Task Delete(
            StudentTrip trip)
        {
            _context.StudentTrips
                .Remove(trip);

            await Task.CompletedTask;
        }

        public async Task Save()
        {
            await _context
                .SaveChangesAsync();
        }
    }
}