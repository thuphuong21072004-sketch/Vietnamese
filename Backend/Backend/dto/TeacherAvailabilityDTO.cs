namespace Backend.dto
{
    public class TeacherAvailabilityDTO
    {
        public int AvailabilityId { get; set; }

        public int TeacherId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public bool IsBooked { get; set; }

        public DateTime CreatedDate { get; set; }
        public TeacherProfileDTO?TeacherProfile { get; set; }
    }
}