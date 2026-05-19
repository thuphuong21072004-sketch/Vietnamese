namespace Backend.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public int BookingId { get; set; }

        public decimal Amount { get; set; }

        public string? PaymentMethod { get; set; }

        public string? TransactionCode { get; set; }

        public byte Status { get; set; }

        public DateTime? PaidAt { get; set; }

        public Booking? Booking { get; set; }
    }
}