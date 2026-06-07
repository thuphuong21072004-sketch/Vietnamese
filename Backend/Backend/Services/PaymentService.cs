using Backend.dto;

namespace Backend.Services
{
    public interface PaymentService
    {
        Task<PaymentDTO> Create(PaymentDTO dto);
        Task<PaymentDTO?> GetByRef(string refName, int refId);
       
        Task<string> CreateStripeUrl( int paymentId, string currency);
        Task Success(int paymentId, string transactionCode);
        
    }
}