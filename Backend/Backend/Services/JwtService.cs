using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.dto;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;

namespace Backend.Services
{
    public class JwtService
    {
        private readonly IConfiguration _configuration;
        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /* Sửa lỗi RuntimeBinderException bằng cách ép kiểu chuẩn
 * thuphuong21072004 - 13/04/2026
 */
        public string GenerateToken(UserDTO user, string roleName)
        {
            var secretKey = _configuration["AppSettings:SecretKey"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var authClaims = new List<Claim>
{
    new Claim(
        ClaimTypes.Email,
        user.Email ?? ""
    ),

    new Claim(
        ClaimTypes.Role,
        roleName
    ),

    new Claim(
        JwtRegisteredClaimNames.Jti,
        Guid.NewGuid().ToString()
    ),
};

            var token = new JwtSecurityToken(
                issuer: "VietnameseLearningApp",
                audience: "VietnameseLearningClient",
                claims: authClaims,
                expires: DateTime.Now.AddHours(3),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}