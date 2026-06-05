namespace Backend.Models
{
    public class TeacherClass
    {
        public int ClassId { get; set; }

        public int TeacherProfileId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public int MaxStudents { get; set; }

        public int CurrentStudents { get; set; }

        public int TotalSessions { get; set; }

        public string MainTopic { get; set; }
        = string.Empty;

        public string? SubTopic { get; set; }

        public DateTime StartDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedDate { get; set; }

        public TeacherProfile? TeacherProfile { get; set; }

        public ICollection<ClassScheduleDay> ClassScheduleDays
            = new List<ClassScheduleDay>();

        public ICollection<ClassSession> ClassSessions
            = new List<ClassSession>();

        public ICollection<ClassEnrollment> ClassEnrollments
            = new List<ClassEnrollment>();
    }
}