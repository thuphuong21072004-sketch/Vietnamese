using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.dto
{
    public class StudentTripDto
    {
        public int TripId { get; set; }

        public int StudentId { get; set; }

        public string Destination { get; set; }
            = string.Empty;

        public string? SpecificLocation { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public string? StudentName { get; set; }

        public string? StudentAvatarUrl { get; set; }

        public string? StudentCountry { get; set; }

        public int? MatchedTeacherId { get; set; }

        public string? MatchedTeacherName { get; set; }

        public int? ClassId { get; set; }
    }
}
