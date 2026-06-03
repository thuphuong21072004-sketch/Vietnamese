using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class TeacherAvailability
    {
        [Key]
        public int AvailabilityId { get; set; }

        public int InstructorId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public byte Status { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public decimal PricePerHour { get; set; }


        public User? Instructor { get; set; }
    }
}