namespace Backend.Models
{
    public class Booking
    {
        
        public int BookingId { get; set; }

        public int StudentId { get; set; }

        public int TeacherId { get; set; }

        public int AvailabilityId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedDate { get; set; }

        public User? Student { get; set; }

        public User? Teacher { get; set; }

        public TeacherAvailability? Availability { get; set; }
    }
}