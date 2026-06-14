using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Backend.Models
{
    public class TeacherSchedule
    {
        public int ScheduleId { get; set; }

        public int TeacherId { get; set; }

        public string Destination { get; set; } = string.Empty;

        public DateOnly AvailableFrom { get; set; }

        public DateOnly AvailableTo { get; set; }

        public DateTime CreatedAt { get; set; }

        public byte Status { get; set; }

        public User? Teacher { get; set; }
    }
}
