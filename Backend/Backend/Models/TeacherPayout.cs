namespace Backend.Models
{
    /*
     * khoản tiền admin đã chuyển cho giáo viên (đối soát thừa / thiếu)
     */
    public class TeacherPayout
    {
        public int PayoutId { get; set; }

        public int TeacherUserId { get; set; }

        public decimal Amount { get; set; }

        public DateTime PaidAt { get; set; } = DateTime.UtcNow;

        public string? Note { get; set; }

        public string? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // xoá mềm: giữ lại bản ghi để đối soát (ai xoá, khi nào)
        public DateTime? DeletedAt { get; set; }

        public string? DeletedBy { get; set; }

        public User? Teacher { get; set; }
    }
}
