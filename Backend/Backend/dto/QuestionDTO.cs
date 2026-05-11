namespace Backend.dto
{
    public class QuestionDTO
    {
        public int QuestionId { get; set; }

        public int? PartId { get; set; }

        public int? PassageId { get; set; }

        public string QuestionText { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        public string? AudioUrl { get; set; }
        public int? OrderIndex { get; set; }

        public decimal Score { get; set; }

        public bool IsDelete { get; set; }

        public List<AnswerDTO>? Answers { get; set; }
    }
}