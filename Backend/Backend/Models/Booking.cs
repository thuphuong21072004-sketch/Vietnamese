namespace Backend.Models
{
    public class Booking
    {
        public int BookingId { get; set; }

        public int StudentId { get; set; }

        public int InstructorId { get; set; }

        public int AvailabilityId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public decimal TotalPrice { get; set; }

        public string? Note { get; set; }

        public byte Status { get; set; } = 0;

        public DateTime? CompletedAt { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;



        public User? Student { get; set; }

        public User? Instructor { get; set; }

        public TeacherAvailability? Availability { get; set; }

    }
}