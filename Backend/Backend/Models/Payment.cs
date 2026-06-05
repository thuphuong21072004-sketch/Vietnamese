namespace Backend.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public int RefId  { get; set; }
        public string RefName { get; set; }

        public decimal Amount { get; set; }

        public byte PaymentMethod { get; set; }

        public string? TransactionCode { get; set; }

        public byte Status { get; set; } = 0;

        public DateTime? PaidAt { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

    }
}