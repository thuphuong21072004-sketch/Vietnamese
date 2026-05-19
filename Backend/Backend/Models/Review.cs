namespace Backend.Models
{
    public class Review
    {
        public int ReviewId { get; set; }

        public int BookingId { get; set; }

        public int StudentId { get; set; }

        public int TeacherId { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }

        public DateTime CreatedDate { get; set; }

        public Booking? Booking { get; set; }

        public User? Student { get; set; }

        public User? Teacher { get; set; }
    }
}