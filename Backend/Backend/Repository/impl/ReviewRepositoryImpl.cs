using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class ReviewRepositoryImpl : ReviewRepository
    {
        private readonly AppDbContext _context;

        public ReviewRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * lấy đánh giá theo id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<Review?> GetById(int id)
        {
            return await _context.Reviews.FirstOrDefaultAsync(x => x.ReviewId == id);
        }

        /* 
         * lấy đánh giá theo booking id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<Review?> GetByBookingId(int bookingId)
        {
            return await _context.Reviews.Include(x => x.Student).Include(x => x.Teacher).FirstOrDefaultAsync(x => x.BookingId == bookingId);
        }

        /* 
         * lấy danh sách đánh giá của giáo viên
         * O(n)
         * (thuphuong21072004) 
         */
        public async Task<List<Review>> GetByTeacherId(int teacherId)
        {
            return await _context.Reviews.Include(x => x.Student).Include(x => x.Teacher).Where(x => x.TeacherId == teacherId).OrderByDescending(x => x.CreatedDate).ToListAsync();
        }

        /* 
         * tạo mới đánh giá
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(Review review)
        {
            await _context.Reviews.AddAsync(review);
        }

        /* 
         * lưu thay đổi vào cơ sở dữ liệu
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Save()
        {
            await _context.SaveChangesAsync();
        }
    }
}