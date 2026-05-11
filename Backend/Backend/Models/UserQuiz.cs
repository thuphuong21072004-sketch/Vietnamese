using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("UserQuiz")]
    public class UserQuiz
    {
        public int UserQuizId { get; set; }

        public int UserId { get; set; }
        public int QuizId { get; set; }

        public decimal Score { get; set; }
        public DateTime CompletedDate { get; set; }

        public bool IsPassed { get; set; }
        public User? User { get; set; }
        public Quiz? Quiz { get; set; }

        public ICollection<UserAnswer>? UserAnswers { get; set; }
    }
}
