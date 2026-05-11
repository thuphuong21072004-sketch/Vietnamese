namespace Backend.dto
{
    public class AnswerDTO
    {
        public int AnswerId { get; set; }

        public string AnswerText { get; set; } = string.Empty;

        public bool IsCorrect { get; set; }

        public string? ImageUrl { get; set; }

        public string? AudioUrl { get; set; }

        public int? OrderIndex { get; set; }
        
        public bool IsDelete { get; set; }
    }
}