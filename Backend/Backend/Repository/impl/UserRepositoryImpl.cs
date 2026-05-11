using Backend.Data;
using Backend.dto;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class UserRepositoryImpl : UserRepository
    {
        private readonly AppDbContext _context;

        public UserRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /*
         * Kiểm tra email đã tồn tại
         * O(n)
         * thuphuong21072004
         */
        public async Task<bool> IsEmailExist(string email)
        {
            return await _context.Users
                .AnyAsync(u => u.Email == email);
        }

        /*
         * Đăng ký người dùng mới
         * O(n)
         * thuphuong21072004
         */
        public async Task<User> Register(string name, string email, string password)
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "User");

            if (role == null)
            {
                throw new Exception("Role 'User' không tồn tại trong Database");
            }

            var user = new User
            {
                Name = name,
                Email = email,
                PasswordHash = password,
                RoleId = role.RoleId,
                Status = 1
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return user;
        }

        /*
         * Lấy thông tin người dùng theo id
         * O(n)
         * thuphuong21072004
         */
        public async Task<User?> GetUserById(int userId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId);
        }

        /*
         * Cập nhật thông tin người dùng
         * O(1)
         * thuphuong21072004
         */
        public async Task Update(User user)
        {
            _context.Users.Update(user);

            await Task.CompletedTask;
        }

        /*
         * Lưu thay đổi vào database
         * O(1)
         * thuphuong21072004
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }

        /*
         * Đếm số lượng người dùng
         * O(n)
         * thuphuong21072004
         */
        public async Task<int> CountUsers(string? email, int? status, int? roleId)
        {
            IQueryable<User> query = _context.Users;

            if (!string.IsNullOrWhiteSpace(email))
            {
                query = query.Where(u => u.Email.Contains(email));
            }

            if (status.HasValue)
            {
                query = query.Where(u => u.Status == status.Value);
            }

            if (roleId.HasValue)
            {
                query = query.Where(u => u.RoleId == roleId.Value);
            }

            return await query.CountAsync();
        }

        /*
         * Lấy danh sách người dùng phân trang
         * O(n)
         * thuphuong21072004
         */
        public async Task<List<UserDTO>> GetUsers(
            string? email,
            int? status,
            int? roleId,
            int page,
            int pageSize)
        {
            IQueryable<User> query = _context.Users;

            if (!string.IsNullOrWhiteSpace(email))
            {
                query = query.Where(u => u.Email.Contains(email));
            }

            if (status.HasValue)
            {
                query = query.Where(u => u.Status == status.Value);
            }

            if (roleId.HasValue)
            {
                query = query.Where(u => u.RoleId == roleId.Value);
            }

            return await query
                .OrderByDescending(u => u.UserId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserDTO
                {
                    Id = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Status = u.Status,
                    RoleId = u.RoleId
                })
                .ToListAsync();
        }

        /*
         * Lấy thông tin người dùng kèm quyền
         * O(n)
         * thuphuong21072004
         */
        public async Task<dynamic?> GetUserWithRole(string email)
        {
            return await (
                from user in _context.Users
                join role in _context.Roles
                    on user.RoleId equals role.RoleId
                where user.Email == email
                select new
                {
                    UserId = user.UserId,
                    Name = user.Name,
                    Email = user.Email,
                    PasswordHash = user.PasswordHash,
                    RoleName = role.RoleName
                })
                .FirstOrDefaultAsync();
        }
    }
}