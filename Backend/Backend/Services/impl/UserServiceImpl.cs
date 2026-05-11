using Backend.Common;
using Backend.dto;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.impl
{
    public class UserServiceImpl : UserService
    {
        private readonly UserRepository _userrepository;

        private readonly JwtService _jwtService;
        private readonly UserContextUtil _userContext;

        public UserServiceImpl(UserRepository userrepository, JwtService jwtService, UserContextUtil userContext)
        {
            _userrepository = userrepository;
            _jwtService = jwtService;
            _userContext = userContext;
        }
        // validate
        /*
         * kiểm tra quyền là admin
         * 
         * thuphuong21072004
         */
        private bool ValidateAdmin()
        {
            string role = _userContext.GetRole();
            if (role == common.Constant.Role.Admin)
            {
                return true;
            }
            return false;
        }
        /*
         * kiem tra quyen user
         * 
         * thuphuong21072004
         */
        private bool ValidateUser()
        {
            string role = _userContext.GetRole();
            if (role == common.Constant.Role.User) { return true; }
            return false;
        }
        /*
         * kiêm tra cong tac vien
         * 
         * thuphuong21072004
         */
        private bool ValidateModerator()
        {
            string role = _userContext.GetRole();
            if (role == common.Constant.Role.Moderator) { return true; }
            return false;
        }
        /*
         * xác thực đăng nhập và tạo token cho user 
         * 08/03/2026
         * thuphuong21072004
         */
        public async Task<object?> Login(LoginDTO request)
        {
            var userData = await _userrepository.GetUserWithRole(request.Email);

            if (userData == null) return null;

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                (string)userData.PasswordHash
            );

            if (!isPasswordValid) return null;

            var userDto = new UserDTO
            {
                Id = userData.UserId,
                Name = userData.Name,
                Email = userData.Email
            };

            return new
            {
                token = _jwtService.GenerateToken(userDto, (string)userData.RoleName)
            };
        }
        /*
         * ăng ký tài khoản mới và tạo token cho user
         * 08/03/2026
         * thuphuong21072004
         */
        public async Task<object> Register(RegisterDTO request)
        {
            var email = request.Email.Trim().ToLower();

            var isExist = await _userrepository.IsEmailExist(email);
            if (isExist) throw new Exception("Email already exists");

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = await _userrepository.Register(
                request.Name,
                email,
                hashedPassword
            );

            var userDto = new UserDTO { Id = user.UserId, Email = user.Email, Name = user.Name, RoleId = user.RoleId };

            return new { token = _jwtService.GenerateToken(userDto, "User") };
        }
        /*
         * đổi mật khẩu cho user (kiểm tra mật khẩu cũ và validate)
         * 08/03/2026
         * thuphuong21072004
         */
        public async Task ChangePassword(int userId, ChangePasswordDTO dto)
        {
            var user = await _userrepository.GetUserById(userId);
            if (user == null) throw new Exception("User not found");

            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
                throw new Exception("The old password is incorrect.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            await _userrepository.Update(user);
            await _userrepository.Save();
        }
        /*
         * cập nhật thông tin cá nhân
         * 
         * thuphuong21072004
         */
        public async Task UpdateProfile(int userId, UserDTO dto)
        {
            if (string.IsNullOrEmpty(dto.Name) || string.IsNullOrEmpty(dto.Email))
                throw new Exception("Name and Email cannot be empty");

            var user = await _userrepository.GetUserById(userId);
            if (user == null)
                throw new Exception("User not found");

            var isExist = await _userrepository.IsEmailExist(dto.Email);
            if (isExist && user.Email != dto.Email)
                throw new Exception("Email already exists");

            user.Name = dto.Name;
            user.Email = dto.Email;

            await _userrepository.Update(user);
            await _userrepository.Save();
        }
        /*
         * lấy danh sách người dùng theo trạng thái, email, quyền
         * 
         * thuphuong21072004
         */
        public async Task<object> GetUsers(string? email, int? status, int? roleId, int page, int pageSize)
        {
            var users = await _userrepository.GetUsers(email, status, roleId, page, pageSize);
            var total = await _userrepository.CountUsers(email, status, roleId);

            return new
            {
                total,
                page,
                pageSize,
                data = users
            };
        }
        /*
         * cập nhật trạng thái tài khoản người dùng
         * 
         * thuphuong21072004
         */
        public async Task UpdateUserStatus(int userId, int status)
        {
            if (!ValidateAdmin() )
            {
                throw new UnauthorizedAccessException("You do not have permission to edit the status.");
            }
            var user = await _userrepository.GetUserById(userId);

            if (user == null)
                throw new Exception("User not found");

            if (status != 1 && status != 0 && status != -1)
                throw new Exception("Invalid status");

            user.Status = status;

            await _userrepository.Update(user);
            await _userrepository.Save();
        }
        /*
         * cập nhật quyền người dùng
         * 
         * thuphuong21072004
         */
        public async Task UpdateUserRole(int userId, UserDTO dto)
        {
            if (!ValidateAdmin() )
            {
                throw new UnauthorizedAccessException("You do not have the authority to change user permissions.");
            }
            var user = await _userrepository.GetUserById(userId);

            if (user == null)
                throw new Exception("User not found");
            user.RoleId = dto.RoleId;

            await _userrepository.Update(user);
            await _userrepository.Save();
        }
   
    }
}