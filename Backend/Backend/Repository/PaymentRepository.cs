using Backend.Models;

namespace Backend.Repository
{
    public interface PaymentRepository
    {
        Task<Payment?> GetById(int id);
        Task<Payment?> GetByBookingId(int bookingId);
        Task Create(Payment payment);
        Task Update(Payment payment);
        Task<List<Payment>> GetByMonth(int month, int year);
        Task Save();
    }
}