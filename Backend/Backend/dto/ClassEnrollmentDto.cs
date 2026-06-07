public class ClassEnrollmentDto
{
    public int EnrollmentId { get; set; }

    public int ClassId { get; set; }

    public int StudentId { get; set; }

    public byte Status { get; set; }

    public DateTime EnrolledDate { get; set; }

    public string? StudentName { get; set; }

    public string? StudentAvatarUrl { get; set; }

    public string? StudentCountry { get; set; }

    public string? TeacherName { get; set; }

    public string? TeacherAvatarUrl { get; set; }

    public string? TeacherCountry { get; set; }

    public string? ClassTitle { get; set; }

    public decimal Price { get; set; }

    public string? Description { get; set; }

    public string? MainTopic { get; set; }

    public string? SubTopic { get; set; }

    public int TotalSessions { get; set; }

    public int CurrentStudents { get; set; }

    public int MaxStudents { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public List<string> ScheduleDays { get; set; } = new();
}