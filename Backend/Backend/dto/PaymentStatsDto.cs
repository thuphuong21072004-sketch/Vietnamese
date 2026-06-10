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

    public class StudentPaymentStatsDto
    {
        public decimal TotalPaid { get; set; }
        public decimal CompletedLearning { get; set; }
        public decimal ActiveLearning { get; set; }
        public decimal CancelledUnrefunded { get; set; }
        public decimal Refunded { get; set; }
        public List<MonthlyStudentBreakdownDto> MonthlyBreakdown { get; set; } = new();
    }

    public class TeacherEarningsStatsDto
    {
        public decimal TotalFromStudents { get; set; }
        public decimal CompletedEarnings { get; set; }
        public decimal ActiveEarnings { get; set; }
        public decimal CancelledUnrefunded { get; set; }
        public List<MonthlyTeacherBreakdownDto> MonthlyBreakdown { get; set; } = new();
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
    }

    public class StudentPaymentSummaryDto
    {
        public int UserId { get; set; }
        public string StudentName { get; set; } = "";
        public string Email { get; set; } = "";
        public decimal TotalPaid { get; set; }
        public decimal CompletedLearning { get; set; }
        public decimal ActiveLearning { get; set; }
        public decimal CancelledUnrefunded { get; set; }
        public decimal Refunded { get; set; }
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
        public List<StudentPaymentSummaryDto> StudentSummaries { get; set; } = new();
    }
}
