using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class RoleRepositoryImpl
        : RoleRepository
    {
        private readonly
            AppDbContext _context;

        public RoleRepositoryImpl(
            AppDbContext context
        )
        {
            _context = context;
        }

        public async Task<Role?> GetByName(string name)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(x =>
                    x.RoleName == name
                );
        }
    }
}