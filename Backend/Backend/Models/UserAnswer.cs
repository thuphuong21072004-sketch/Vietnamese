using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("UserAnswer")]
    public class UserAnswer
    {
        public int UserAnswerId { get; set; }

        public int UserQuizId { get; set; }
        public int QuestionId { get; set; }
        public int AnswerId { get; set; }

        public UserQuiz? UserQuiz { get; set; }
        public Question? Question { get; set; }
        public Answer? Answer { get; set; }
    }
}