using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;

namespace Backend.Common
{
    public class UserContextUtil
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserContextUtil(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        /*
         * Lấy Email của người dùng
         */
        public string GetEmail()
        {
            return _httpContextAccessor
                .HttpContext?
                .User
                .FindFirst(
                    ClaimTypes.Email
                )?.Value
                ?? throw new Exception(
                    "Email not found"
                );
        }
        /*
         * quyền
         */
        public string GetRole()
        {
            return User?.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }
        
    }
}