namespace Backend.dto
{
    public class VideoRoomDTO
    {
        public int RoomId { get; set; }

        public int BookingId { get; set; }

        public string RoomCode { get; set; }
            = string.Empty;

        public string? HostToken { get; set; }

        public string? StudentToken { get; set; }

        public string? StartUrl { get; set; }

        public DateTime ExpiredAt { get; set; }

        public DateTime CreatedDate { get; set; }

        public string JoinUrl { get; set; } = string.Empty;
    }
}