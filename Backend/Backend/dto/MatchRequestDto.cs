using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.dto
{
    public class MatchRequestDto
    {
        public int MatchRequestId { get; set; }

        public int ScheduleId { get; set; }

        public int TripId { get; set; }

        public byte RequestType { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? RespondedAt { get; set; }

        public int? TeacherId { get; set; }

        public string? TeacherName { get; set; }

        public string? TeacherAvatarUrl { get; set; }

        public int? StudentId { get; set; }

        public string? StudentName { get; set; }

        public string? StudentAvatarUrl { get; set; }

        public string? Destination { get; set; }

        public string? SpecificLocation { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public int? ClassId { get; set; }
    }
}
