namespace Backend.dto
{
    public class MonthlyAmountDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal Amount { get; set; }
    }

    public class MonthlyStudentBreakdownDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal CompletedLearning { get; set; }
        public decimal ActiveLearning { get; set; }
        public decimal CancelledUnrefunded { get; set; }
        public decimal Refunded { get; set; }
    }

    public class MonthlyTeacherBreakdownDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal TotalFromStudents { get; set; }
        public decimal CompletedEarnings { get; set; }
        public decimal ActiveEarnings { get; set; }
        public decimal CancelledUnrefunded { get; set; }
    }

    public class MonthlyAdminBreakdownDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal CompletedLearning { get; set; }
        public decimal ActiveLearning { get; set; }
        public decimal CancelledUnrefunded { get; set; }
        public decimal Refunded { get; set; }
    }

    /*
     * doanh thu theo từng lớp nhóm (lọc theo kỳ PaidAt)
     */
    public class ClassRevenueDto
    {
        public int ClassId { get; set; }
        public string Title { get; set; } = "";
        public string TeacherName { get; set; } = "";
        // Upcoming | Ongoing | Completed — tính theo buổi học đầu / cuối
        public string Status { get; set; } = "";
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public decimal Price { get; set; }
        public int MaxStudents { get; set; }
        // học viên còn hiệu lực (Confirmed / InProgress / Completed) có thanh toán thành công
        public int StudentCount { get; set; }
        public int CancelledCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal CancelledUnrefunded { get; set; }
    }

    /*
     * khóa học (lớp nhóm) học viên đã thanh toán
     */
    public class StudentCourseDto
    {
        public int ClassId { get; set; }
        public string Title { get; set; } = "";
        public string TeacherName { get; set; } = "";
        public string Status { get; set; } = "";
        public byte EnrollmentStatus { get; set; }
        public DateTime? PaidAt { get; set; }
        public decimal Amount { get; set; }
    }

    public class PayoutRecordDto
    {
        public int PayoutId { get; set; }
        public int TeacherUserId { get; set; }
        public string TeacherName { get; set; } = "";
        public decimal Amount { get; set; }
        public DateTime PaidAt { get; set; }
        public string? Note { get; set; }
        public string? CreatedBy { get; set; }
    }

    public class CreatePayoutDto
    {
        public int TeacherUserId { get; set; }
        public decimal Amount { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Note { get; set; }
    }

    public class StudentPaymentStatsDto
    {
        public decimal TotalPaid { get; set; }
        public decimal CompletedLearning { get; set; }
        public decimal ActiveLearning { get; set; }
        public decimal CancelledUnrefunded { get; set; }
        public decimal Refunded { get; set; }
        public List<MonthlyStudentBreakdownDto> MonthlyBreakdown { get; set; } = new();
        public int CourseCount { get; set; }
        public decimal CourseTotal { get; set; }
        public List<StudentCourseDto> Courses { get; set; } = new();
    }

    public class TeacherEarningsStatsDto
    {
        public decimal TotalFromStudents { get; set; }
        public decimal CompletedEarnings { get; set; }
        public decimal ActiveEarnings { get; set; }
        public decimal CancelledUnrefunded { get; set; }
        public List<MonthlyTeacherBreakdownDto> MonthlyBreakdown { get; set; } = new();
        public int ClassCount { get; set; }
        public int StudentCount { get; set; }
        public List<ClassRevenueDto> Classes { get; set; } = new();
        // lũy kế, không theo kỳ
        public decimal TotalOwed { get; set; }
        public decimal TotalPaidOut { get; set; }
        public decimal Balance { get; set; }
    }

    public class TeacherPayoutDto
    {
        public int UserId { get; set; }
        public string TeacherName { get; set; } = "";
        public string Email { get; set; } = "";
        public decimal TotalFromStudents { get; set; }
        public decimal CompletedEarnings { get; set; }
        public decimal ActiveEarnings { get; set; }
        public decimal CancelledUnrefunded { get; set; }

        // theo kỳ
        public int ClassCount { get; set; }
        public int StudentCount { get; set; }
        public List<ClassRevenueDto> Classes { get; set; } = new();

        // đối soát lũy kế: Balance > 0 còn thiếu, < 0 trả thừa
        public decimal GroupOwed { get; set; }
        public decimal PrivateOwed { get; set; }
        public decimal TotalOwed { get; set; }
        public decimal TotalPaidOut { get; set; }
        public decimal Balance { get; set; }
        public DateTime? LastPaidAt { get; set; }
    }

    public class AdminPaymentStatsDto
    {
        public decimal TotalStudentPayments { get; set; }
        public decimal TotalCompletedLearning { get; set; }
        public decimal TotalActiveLearning { get; set; }
        public decimal TotalCancelledUnrefunded { get; set; }
        public decimal TotalRefunded { get; set; }
        public List<MonthlyAdminBreakdownDto> MonthlyBreakdown { get; set; } = new();
        public List<TeacherPayoutDto> TeacherPayouts { get; set; } = new();
        // học viên không trùng của các lớp trong kỳ (một người học nhiều giáo viên chỉ tính 1)
        public int UniqueStudentCount { get; set; }
    }
}
