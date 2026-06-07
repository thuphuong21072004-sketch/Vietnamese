namespace Backend.dto
{
    public class UpcomingScheduleDto
    {
        public int ClassId { get; set; }

        public string ClassTitle { get; set; } = string.Empty;

        public int SessionId { get; set; }

        public int SessionNumber { get; set; }

        public string Topic { get; set; } = string.Empty;

        public DateOnly StudyDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public string TeacherName { get; set; } = string.Empty;

        public string StudentName { get; set; } = string.Empty;
    }
}