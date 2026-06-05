namespace Backend.dto
{
    public class ClassAttendanceDto
    {
        public int AttendanceId { get; set; }

        public int SessionId { get; set; }

        public int StudentId { get; set; }

        public bool IsPresent { get; set; }

        public DateTime? CheckedAt { get; set; }
    }
}