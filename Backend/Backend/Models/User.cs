using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Backend.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public int RoleId { get; set; }
        public int Status { get; set; }

        public Role? Role { get; set; }

        public ICollection<UserQuiz>? UserQuizzes { get; set; }
        public ICollection<UserProgress>? UserProgresses { get; set; }
    }
}
