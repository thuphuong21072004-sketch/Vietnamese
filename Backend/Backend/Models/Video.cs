using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Video
    {
        public int VideoId { get; set; }
        public string YoutubeId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;

        public string CreatedBy { get; set; }
        public int Status { get; set; }

        public ICollection<Transcript>? Transcripts { get; set; }
    }
}
