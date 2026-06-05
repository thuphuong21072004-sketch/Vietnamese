using Backend.dto;

namespace Backend.Services
{
    public interface PaymentService
    {
        Task<PaymentDTO> Create(PaymentDTO dto);
        Task<PaymentDTO?> GetByBooking(int bookingId);
       
        Task<string> CreateStripeUrl(
    int paymentId,
    string currency);
        Task Success(int paymentId, string transactionCode);
        Task Failed(int paymentId);
       

       
    }
}