using Backend.DTO;

namespace Backend.dto
{
    public class TeacherClassDto
    {
        public int ClassId { get; set; }

        public int TeacherProfileId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public int MaxStudents { get; set; }

        public int CurrentStudents { get; set; }

        public byte Status { get; set; }

        public string MainTopic { get; set; }
    = string.Empty;

        public string? SubTopic { get; set; }

        public int TotalSessions { get; set; }

        public DateTime StartDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public List<ClassScheduleDayDto> ScheduleDays { get; set; }
        = new();

        public List<ClassSessionDto> Sessions { get; set; }
            = new();

        public string? TeacherName { get; set; }

        public string? Country { get; set; }

        public decimal RatingAverage { get; set; }
        public string? AvatarUrl { get; set; }
        public TeacherProfileDTO? TeacherProfile { get; set; }
    }
}