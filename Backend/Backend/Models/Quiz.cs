using Backend.dto;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Models
{
    [Table("Quizzes")]
    public class Quiz
    {
        public int QuizId { get; set; }

        public string RefType { get; set; } = string.Empty;

        public int RefId { get; set; }

        public string QuizName { get; set; } = string.Empty;

        public int? TimeLimit { get; set; }

        public decimal? PassScore { get; set; }

        public DateTime CreatedDate { get; set; }
    = DateTime.Now;

        public bool IsActive { get; set; }

        public ICollection<Part>? Parts { get; set; }

        public ICollection<Question>? Questions { get; set; }

        public ICollection<UserQuiz>? UserQuizzes { get; set; }
    }
}