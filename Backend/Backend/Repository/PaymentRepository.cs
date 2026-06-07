using Backend.Models;

namespace Backend.Repository
{
    public interface PaymentRepository
    {
        Task<Payment?> GetById(int id);
        Task Create(Payment payment);
        Task Update(Payment payment);
        Task<Payment?> GetByRef(string refName, int refId);
        Task Save();
    }
}