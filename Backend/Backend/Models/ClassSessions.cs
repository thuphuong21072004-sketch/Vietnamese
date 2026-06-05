using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class ClassSession
    {
        [Key]
        public int SessionId { get; set; }

        public int ClassId { get; set; }

        public DateOnly StudyDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public string? Topic { get; set; }

        public int SessionNumber { get; set; }

        public string Status { get; set; } = "Upcoming";

        public TeacherClass? TeacherClass { get; set; }

        public ICollection<ClassAttendance> ClassAttendances { get; set; }
            = new List<ClassAttendance>();
    }
}