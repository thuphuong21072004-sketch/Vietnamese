namespace Backend.dto
{
    public class VideoDTO
    {
        public int VideoId { get; set; }
        public string YoutubeId { get; set; } = "";
        public string Title { get; set; } = "";
        public string? CreatedBy { get; set; }
        public int Status { get; set; }
    }
}
