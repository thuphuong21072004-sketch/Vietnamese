namespace Backend.Models
{
    public class Notification
    {
        public int NotificationId { get; set; }

        public int UserId { get; set; }

        public string Title { get; set; }

        public string Content { get; set; }

        public string Type { get; set; }

        public bool IsRead { get; set; }

        public DateTime CreatedDate { get; set; }

        public User User { get; set; }
    }
}