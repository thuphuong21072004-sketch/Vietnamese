using Backend.dto;

namespace Backend.Services
{
    public interface PaymentService
    {
        Task<PaymentDTO> Create(PaymentDTO dto);
        Task<PaymentDTO?> GetByBooking(int bookingId);
        Task<string> CreateVNPayUrl(int paymentId);
        Task Success(int paymentId, string transactionCode);
        Task Failed(int paymentId);
       

        Task<object> GetMyPaymentHistory(int month, int year, int page, int pageSize);
        Task<object> GetMyStatistics(int month, int year);

        Task<object> GetMySalaryStatistics(int month, int year);
        Task<object> GetMySalaryHistory(int month, int year, int page, int pageSize);

        Task<object> GetAdminFinanceOverview(int month, int year);
        Task<object> GetStudentFinanceReport(int month, int year, int page, int pageSize);
        Task<object> GetTeacherFinanceReport(int month, int year, int page, int pageSize);
    }
}