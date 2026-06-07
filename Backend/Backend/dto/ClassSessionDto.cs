namespace Backend.dto
{
    public class ClassSessionDto
    {
        public int SessionId { get; set; }

        public int ClassId { get; set; }

        public DateOnly StudyDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public string? Topic { get; set; }

        public int SessionNumber { get; set; }

        public string Status { get; set; } = string.Empty;
        public string? TeacherName { get; set; }

    }
}