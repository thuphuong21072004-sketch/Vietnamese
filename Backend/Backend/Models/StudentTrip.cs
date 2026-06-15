using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class StudentTrip
    {
        public int TripId { get; set; }

        public int StudentId { get; set; }

        public string Destination { get; set; } = string.Empty;

        public string? SpecificLocation { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public DateTime CreatedAt { get; set; }

        public byte Status { get; set; }

        public string? PhoneNumber { get; set; }

        public User? Student { get; set; }
    }
}
