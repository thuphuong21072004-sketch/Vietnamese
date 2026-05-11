using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("UserProgress")]
    public class UserProgress
    {
        public int UserProgressId { get; set; }

        public int UserId { get; set; }
        public string RefType { get; set; }
        public int RefId { get; set; }

        public DateTime AssignedDate { get; set; }
        public DateTime? CompletedDate { get; set; }

        public bool Status { get; set; }

        public User? User { get; set; }
    }

}
