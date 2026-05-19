using Backend.Models;

namespace Backend.Repository
{
    public interface RoleRepository
    {
        Task<Role?> GetByName( string name);
    }
}