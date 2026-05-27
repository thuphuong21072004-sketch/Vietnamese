namespace Backend.Models
{
    public class Review
    {
        public int ReviewId { get; set; }

        public int BookingId { get; set; }

        public int StudentId { get; set; }

        public int InstructorId { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }

        public string? Reply { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;



        public Booking? Booking { get; set; }

        public User? Student { get; set; }

        public User? Instructor { get; set; }
    }
}