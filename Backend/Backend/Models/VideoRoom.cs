using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class VideoRoom
    {
        [Key]
        public int RoomId { get; set; }

        public int BookingId { get; set; }

        public string RoomCode { get; set; }
            = string.Empty;

        public string? Token { get; set; }

        public DateTime ExpiredAt { get; set; }

        public Booking? Booking { get; set; }
    }
}