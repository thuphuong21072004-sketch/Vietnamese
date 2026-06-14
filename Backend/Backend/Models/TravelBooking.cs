namespace Backend.Models
{
    public class TravelBooking
    {
        public int TravelBookingId { get; set; }

        public int ScheduleId { get; set; }

        public int TripId { get; set; }

        public string Destination { get; set; }
            = string.Empty;

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public byte Status { get; set; }

        public DateTime CreatedAt { get; set; }

        public TeacherSchedule? Schedule { get; set; }

        public StudentTrip? Trip { get; set; }
    }
}