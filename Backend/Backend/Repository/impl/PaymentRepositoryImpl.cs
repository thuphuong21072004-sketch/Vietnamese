using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repository.impl
{
    public class PaymentRepositoryImpl : PaymentRepository
    {
        private readonly AppDbContext _context;

        public PaymentRepositoryImpl(AppDbContext context)
        {
            _context = context;
        }

        /* 
         * lấy thông tin thanh toán theo id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<Payment?> GetById(int id)
        {
            return await _context.Payments.FirstOrDefaultAsync(x => x.PaymentId == id);
        }

        /* 
         * lấy thông tin thanh toán theo booking id
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task<Payment?> GetByBookingId(int bookingId)
        {
            return await _context.Payments.FirstOrDefaultAsync(x => x.BookingId == bookingId);
        }

        /* 
         * tạo mới thông tin thanh toán
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Create(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
        }

        /* 
         * cập nhật thông tin thanh toán
         * O(1)
         * (thuphuong21072004) 
         */
        public async Task Update(Payment payment)
        {
            _context.Payments.Update(payment);
            await Task.CompletedTask;
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