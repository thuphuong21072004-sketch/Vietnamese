namespace Backend.dto
{
    public class ReviewDTO
    {
        public int ReviewId { get; set; }

        public int BookingId { get; set; }

        public int StudentId { get; set; }

        public string? StudentName { get; set; }

        public int InstructorId { get; set; }

        public string? InstructorName { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }

        public string? Reply { get; set; }

        public DateTime CreatedDate { get; set; }



        public UserDTO? Student { get; set; }

        public UserDTO? Instructor { get; set; }
    }
}