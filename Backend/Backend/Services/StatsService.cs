using Backend.dto;

namespace Backend.Services
{
    public interface StatsService
    {
        Task<StudentPaymentStatsDto> GetStudentStats(int? year, int? month);
        Task<TeacherEarningsStatsDto> GetTeacherStats(int? year, int? month);
        Task<AdminPaymentStatsDto> GetAdminStats(int? year, int? month);

        Task<List<PayoutRecordDto>> GetPayouts(int? teacherUserId);
        Task<PayoutRecordDto> CreatePayout(CreatePayoutDto request);
        Task DeletePayout(int payoutId);
    }
}
