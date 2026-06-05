namespace Backend.Models
{
    public class ClassAttendance
    {
        public int AttendanceId { get; set; }

        public int SessionId { get; set; }

        public int StudentId { get; set; }

        public bool IsPresent { get; set; }

        public DateTime? CheckedAt { get; set; }

        public ClassSession? ClassSession { get; set; }

        public User? Student { get; set; }
    }
}