using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{

    public class Answer
    {
        public int AnswerId { get; set; }
        public int QuestionId { get; set; }

        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }

        public string? ImageUrl { get; set; }
        public string? AudioUrl { get; set; }

        public int OrderIndex { get; set; }

        public Question Question { get; set; }
        public ICollection<UserAnswer>? UserAnswers { get; set; }
    }
}
