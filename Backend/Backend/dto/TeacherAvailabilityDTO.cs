namespace Backend.dto
{
    public class TeacherAvailabilityDTO
    {
        public int AvailabilityId { get; set; }

        public int InstructorId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedDate { get; set; }

        public TeacherProfileDTO?
            InstructorProfile
        {
            get;
            set;
        }
        public UserDTO? Instructor
        {
            get;
            set;
        }
    }
}