namespace Backend.dto
{
    public class PaymentDTO
    {
        public int PaymentId { get; set; }

        public int BookingId { get; set; }

        public decimal Amount { get; set; }

        public string? PaymentMethod { get; set; }

        public string? TransactionCode { get; set; }

        public int Status { get; set; }

        public DateTime? PaidAt { get; set; }
    }
}