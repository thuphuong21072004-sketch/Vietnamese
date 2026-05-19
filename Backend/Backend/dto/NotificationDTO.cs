namespace Backend.dto
{
    public class NotificationDTO
    {
        public int NotificationId { get; set; }

        public string Title { get; set; }

        public string Content { get; set; }

        public string Type { get; set; }

        public bool IsRead { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}