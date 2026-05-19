using Backend.dto;

namespace Backend.Services
{
    public interface PaymentService
    {
        Task<PaymentDTO> Create(PaymentDTO dto);

        Task Success(int paymentId, string transactionCode);
        Task Failed(int paymentId);
        Task<PaymentDTO?> GetByBooking(int bookingId);
    }
}