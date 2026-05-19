using AutoMapper;
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
        private readonly RoleRepository _rolerepository;
        private readonly JwtService _jwtService;
        private readonly UserContextUtil _userContext;
        private readonly IMapper _mapper;

        public UserServiceImpl(UserRepository userrepository,RoleRepository roleRepository, JwtService jwtService, UserContextUtil userContext, IMapper mapper)
        {
            _userrepository = userrepository;
            _rolerepository = roleRepository;
            _jwtService = jwtService;
            _userContext = userContext;
            _mapper = mapper;
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
        public async Task<object?> Login( LoginDTO request)
        {
            var userData =
                await _userrepository
                    .GetUserWithRole(
                        request.Email
                    );

            if (userData == null)
            {
                return null;
            }

            if (userData.Status != 1)
            {
                throw new Exception(
                    "Account inactive"
                );
            }

            bool isPasswordValid =
                BCrypt.Net.BCrypt.Verify(
                    request.Password,
                    (string)userData.PasswordHash
                );

            if (!isPasswordValid)
            {
                return null;
            }

            var userDto = new UserDTO
            {
                Name = userData.Name,

                Email = userData.Email,

                RoleName =
                    userData.RoleName
            };

            return new
            {
                token =
                    _jwtService.GenerateToken(
                        userDto,
                        (string)userData.RoleName
                    )
            };
        }
        public async Task<object> Register(RegisterDTO request)
        {
            var email =
                request.Email
                    .Trim()
                    .ToLower();

            var isExist =
                await _userrepository
                    .IsEmailExist(email);

            if (isExist)
            {
                throw new Exception(
                    "Email already exists"
                );
            }

            string hashedPassword =
                BCrypt.Net.BCrypt
                    .HashPassword(
                        request.Password
                    );

            request.Email = email;

            var user =
                await _userrepository
                    .Register(
                        request,
                        hashedPassword
                    );

            var userDto = new UserDTO
            {
                Name = user.Name,

                Email = user.Email,

                RoleName =
                    common.Constant
                        .Role
                        .User
            };

            return new
            {
                token =
                    _jwtService.GenerateToken(
                        userDto,
                        common.Constant
                            .Role
                            .User
                    )
            };
        }
        /*
         * đổi mật khẩu cho user (kiểm tra mật khẩu cũ và validate)
         * 08/03/2026
         * thuphuong21072004
         */
        public async Task ChangePassword( ChangePasswordDTO dto)
        {
            var email =
                _userContext.GetEmail();

            var user =
                await _userrepository
                    .GetUserByEmail(email);

            if (user == null)
            {
                throw new Exception(
                    "User not found"
                );
            }

            if (
                !BCrypt.Net.BCrypt.Verify(
                    dto.OldPassword,
                    user.PasswordHash
                )
            )
            {
                throw new Exception(
                    "The old password is incorrect."
                );
            }

            if (dto.NewPassword.Length < 6)
            {
                throw new Exception(
                    "Password too short"
                );
            }

            user.PasswordHash =
                BCrypt.Net.BCrypt
                    .HashPassword(
                        dto.NewPassword
                    );

            await _userrepository
                .Save();
        }
        /*
         * cập nhật thông tin cá nhân
         * 
         * thuphuong21072004
         */
        public async Task UpdateProfile(UserDTO dto)
        {
            var email = _userContext.GetEmail();

            var user = await _userrepository
                .GetUserByEmail(email);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                user.Name = dto.Name;
            }

            if (!string.IsNullOrWhiteSpace(dto.Country))
            {
                user.Country = dto.Country;
            }

            if (!string.IsNullOrWhiteSpace(dto.Bio))
            {
                user.Bio = dto.Bio;
            }

            if (!string.IsNullOrWhiteSpace(dto.AvatarUrl))
            {
                user.AvatarUrl = dto.AvatarUrl;
            }

            await _userrepository.Save();
        }
        /*
         * lấy danh sách người dùng theo trạng thái, email, quyền
         * 
         * thuphuong21072004
         */
        public async Task<object> GetUsers( string? email, int? status, int? roleId, int page, int pageSize)
        {
            var users =
                await _userrepository
                    .GetUsers(
                        email,
                        status,
                        roleId,
                        page,
                        pageSize
                    );

            var total =
                await _userrepository
                    .CountUsers(
                        email,
                        status,
                        roleId
                    );

            var data =
                users.Select(x => new UserDTO
                {
                    Name = x.Name,

                    Email = x.Email,

                    Status = x.Status,

                    Country = x.Country,

                    Bio = x.Bio,

                    RoleName =
                        x.Role != null
                            ? x.Role.RoleName
                            : ""
                }).ToList();

            return new
            {
                total,

                page,

                pageSize,

                data
            };
        }
        /*
         * cập nhật trạng thái tài khoản người dùng
         * 
         * thuphuong21072004
         */
        public async Task UpdateUserStatus(string email, int status)
        {
            if (!ValidateAdmin() )
            {
                throw new UnauthorizedAccessException("You do not have permission to edit the status.");
            }
            int userId = (await _userrepository.GetUserIdByEmail(email))!.Value;
            var user = await _userrepository.GetUserById(userId);

            if (user == null)
                throw new Exception("User not found");

            if (status != 1 && status != 0 && status != -1)
                throw new Exception("Invalid status");

            user.Status = status;

            await _userrepository.Save();
        }
        /*
         * cập nhật quyền người dùng
         * 
         * thuphuong21072004
         */
        public async Task UpdateUserRole(string email, string roleName)
        {
            if (!ValidateAdmin())
            {
                throw new UnauthorizedAccessException(
                    "You do not have permission"
                );
            }
            int userId = (await _userrepository.GetUserIdByEmail(email))!.Value;
            var user =
                await _userrepository
                    .GetUserById(userId);

            if (user == null)
            {
                throw new Exception(
                    "User not found"
                );
            }

            var role =
                await _rolerepository
                    .GetByName(roleName);

            if (role == null)
            {
                throw new Exception(
                    "Role not found"
                );
            }

            user.RoleId = role.RoleId;

            await _userrepository
                .Save();
        }
        public async Task<UserDTO?> GetCurrentUser()
        {
            var email =
                _userContext.GetEmail();

            var user =
                await _userrepository
                    .GetUserByEmail(email);

            if (user == null)
            {
                return null;
            }

            return _mapper.Map<
                UserDTO
            >(user);
        }

    }
}