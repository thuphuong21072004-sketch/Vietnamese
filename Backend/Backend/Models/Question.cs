using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Question
    {
        public int QuestionId { get; set; }

        public int QuizId { get; set; }

        public int? PartId { get; set; }

        public int? PassageId { get; set; }

        public string QuestionText { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }
        public string? AudioUrl { get; set; }

        public int OrderIndex { get; set; }

        public decimal Score { get; set; }

        public Quiz? Quiz { get; set; }

        public Part? Part { get; set; }

        public Passage? Passage { get; set; }

        public ICollection<Answer>? Answers { get; set; }
    }
}
