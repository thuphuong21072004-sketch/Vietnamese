using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class TeacherAvailability
    {
        [Key]
        public int AvailabilityId { get; set; }

        public int TeacherId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public bool IsBooked { get; set; }

        public DateTime CreatedDate { get; set; }

        public User? Teacher { get; set; }
    }
}