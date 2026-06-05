using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class VideoRoom
    {
        [Key]
        public int RoomId { get; set; }

        public int RefId { get; set; }
        public string RefName { get; set; }
        public string RoomCode { get; set; }
            = string.Empty;

        public string? HostToken { get; set; }

        public string? StudentToken { get; set; }

        public string? StartUrl { get; set; }

        public DateTime ExpiredAt { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

    }
}