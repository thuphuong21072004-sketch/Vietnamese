using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class MatchRequest
    {
        public int MatchRequestId { get; set; }

        public int ScheduleId { get; set; }

        public int TripId { get; set; }

        public byte RequestType { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? RespondedAt { get; set; }

        public int? ClassId { get; set; }

        public TeacherSchedule? Schedule { get; set; }

        public StudentTrip? Trip { get; set; }
    }
}
