using Backend.Common;
using Backend.dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/account")]
    public class AccountController : Controller
    {
        private readonly UserService _userService;

        public AccountController(UserService userservice)
        {
            _userService = userservice;
        }

        /* 
         *  xác thực đăng nhập và trả về token 
         * (thuphuong21072004) */
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            return Ok(await _userService.Login(dto));
        }

        /* 
         *  đăng ký tài khoản
         * (thuphuong21072004) */
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            return Ok(await _userService.Register(dto));
        }

        /* 
         * lấy thông tin user hiện tại từ token (
         * thuphuong21072004) */
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var user = await _userService.GetCurrentUser();
            return Ok(user);
        }

        /* 
         * đổi mật khẩu tài khoản 
         * (thuphuong21072004) */
        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO dto)
        {
            await _userService.ChangePassword(dto);
            return Ok("Changed password");
        }

        /* 
         * cập nhật thông tin cá nhân của user 
         * (thuphuong21072004) */
        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserDTO dto)
        {
            await _userService.UpdateProfile(dto);
            return Ok();
        }

        /* 
         * lấy danh sách người dùng theo điều kiện tìm kiếm và phân trang
         * (thuphuong21072004) */
        [Authorize]
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? email, [FromQuery] int? status, [FromQuery] int? roleId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            return Ok(await _userService.GetUsers(email, status, roleId, page, pageSize));
        }

        /* 
         * cập nhật trạng thái người dùng
         * O(...)
         * (thuphuong21072004) 
         */
        [Authorize]
        [HttpPut("users/{email}/status")]
        public async Task<IActionResult> UpdateStatus(string email, [FromQuery] int status)
        {
            await _userService.UpdateUserStatus(email, status);
            return Ok(new { message = "Updated status" });
        }

        /* 
         * cập nhật vai trò người dùng 
         * (thuphuong21072004) */
        [Authorize]
        [HttpPut("users/{email}/role")]
        public async Task<IActionResult> UpdateRole(string email, [FromQuery] string roleName)
        {
            await _userService.UpdateUserRole(email, roleName);
            return Ok(new { message = "Updated role" });
        }

        /* * up ảnh (thuphuong21072004) */
        [Authorize]
        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Invalid file");
            }

            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            var filePath = Path.Combine(uploadFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { avatarUrl = fileName });
        }
    }
}