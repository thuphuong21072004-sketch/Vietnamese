namespace Backend.dto
{
    public class PassageDTO
    {
        public int PassageId { get; set; }

        public int? PartId { get; set; }

        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        public string? AudioUrl { get; set; }

        public int OrderIndex { get; set; }
        public bool IsDelete { get; set; }
        public List<QuestionDTO>? Questions { get; set; }
    }
}