using Backend.Data;
using Backend.Models;
using Backend.Repository;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class PlacementRepositoryImpl : PlacementRepository
    {
        private readonly AppDbContext _context;

        public PlacementRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * Lấy danh sách bài kiểm tra đầu vào
         * O(N) 
         * thuphuong21072004 
         */
        public async Task<List<PlacementTest>> GetPlacements()
        {
            return await _context.PlacementTests
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ToListAsync();
        }

        /* 
         * Lấy bài kiểm tra đầu vào theo ID
         * O(1) 
         * thuphuong21072004 
         */
        public async Task<PlacementTest?> GetPlacementById(int id)
        {
            return await _context.PlacementTests
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.PlacementId == id);
        }

        /* 
         * Thêm mới một bài kiểm tra đầu vào
         * O(1) 
         * thuphuong21072004 
         */
        public async Task AddPlacement(PlacementTest placement)
        {
            await _context.PlacementTests.AddAsync(placement);
        }

        /* 
         * Xóa bài kiểm tra đầu vào
         * O(1) 
         * thuphuong21072004 
         */
        public async Task DeletePlacement(PlacementTest placement)
        {
            // Sử dụng ID từ object để thực hiện ExecuteDeleteAsync giúp đạt hiệu suất cao nhất
            await _context.PlacementTests
                .Where(x => x.PlacementId == placement.PlacementId)
                .ExecuteDeleteAsync();
        }
        /* 
         * Lưu các thay đổi vào cơ sở dữ liệu
         * O(1) 
         * thuphuong21072004 
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}