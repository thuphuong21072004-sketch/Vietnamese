using Backend.dto;
using Backend.Models;

namespace Backend.Repository
{
    public interface UserRepository
    {
        Task<bool> IsEmailExist(string email);
        Task<User> Register(string name, string email, string password);

        Task<User?> GetUserById(int userId);
        Task Update(User user);
        Task Save();

        Task<List<UserDTO>> GetUsers(string? email, int? status, int? roleId, int page, int pageSize);
        Task<int> CountUsers(string? email, int? status, int? roleId);
        Task<dynamic?> GetUserWithRole(string email);
    }
}
