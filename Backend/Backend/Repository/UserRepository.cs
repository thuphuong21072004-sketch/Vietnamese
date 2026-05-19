using Backend.dto;
using Backend.Models;

namespace Backend.Repository
{
    public interface UserRepository
    {
        Task<bool> IsEmailExist(string email);
        Task<User> Register(
    RegisterDTO dto,
    string hashedPassword
);

        Task<User?> GetUserById(int userId);
        
        Task Save();

        Task<List<User>> GetUsers( string? email, int? status, int? roleId, int page,int pageSize);
        Task<int> CountUsers(string? email, int? status, int? roleId);
        Task<dynamic?> GetUserWithRole(string email);
       
        Task<int?> GetUserIdByEmail(string email);
        Task<User?> GetUserByEmail(string email);
    }
}
