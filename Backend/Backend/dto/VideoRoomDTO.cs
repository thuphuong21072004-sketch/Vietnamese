namespace Backend.dto
{
    public class VideoRoomDTO
    {
        public int RoomId { get; set; }

        public int BookingId { get; set; }

        public string RoomCode { get; set; }
            = string.Empty;

        public string? Token { get; set; }

        public DateTime ExpiredAt { get; set; }
    }
}