namespace Backend.dto
{
    public class SendTravelRequestDto
    {
        public int ScheduleId { get; set; }
        public int TripId { get; set; }
        public byte RequestType { get; set; }
    }
}
