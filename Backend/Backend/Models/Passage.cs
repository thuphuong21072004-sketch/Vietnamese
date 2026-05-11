namespace Backend.Models
{
    public class Passage
    {
        public int PassageId { get; set; }
        public int PartId { get; set; }

        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? AudioUrl { get; set; }

        public int OrderIndex { get; set; }
        public Part? Part { get; set; }
        public ICollection<Question>? Questions { get; set; }
    }
}
