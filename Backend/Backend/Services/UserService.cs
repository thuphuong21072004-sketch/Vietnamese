using Backend.dto;

namespace Backend.Services
{
    public interface UserService
    {
        Task<object?> Login(LoginDTO request);
        Task<object> Register(RegisterDTO request);
        Task ChangePassword(ChangePasswordDTO dto);
        Task UpdateProfile(UserDTO dto);
        Task<object> GetUsers(string? email, int? status, int? roleId, int page, int pageSize);
        Task UpdateUserStatus(string email, int status);
        Task UpdateUserRole(string email, string roleName);
        Task<UserDTO?> GetCurrentUser();
    }
}
