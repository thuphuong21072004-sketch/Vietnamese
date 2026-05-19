export interface PaymentDTO {
  PaymentId: number;

  BookingId: number;
  Amount: number;
  PaymentMethod: string;
  TransactionCode: string;
  Status: number;
  PaidAt: Date;
}
