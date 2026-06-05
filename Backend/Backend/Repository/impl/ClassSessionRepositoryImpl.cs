using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class ClassSessionRepositoryImpl
        : ClassSessionRepository
    {
        private readonly AppDbContext _context;

        public ClassSessionRepositoryImpl(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task AddRangeAsync( List<ClassSession> sessions)
        {
            await _context.ClassSessions
                .AddRangeAsync(sessions);
        }

        public async Task<List<ClassSession>> GetByClassIdAsync(
                int classId)
        {
            return await _context.ClassSessions
                .Where(x => x.ClassId == classId)
                .OrderBy(x => x.SessionNumber)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}