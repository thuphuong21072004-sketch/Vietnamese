export interface PaymentDTO {
  RoomId: number;

  BookingId: number;
  RoomCode: string;
  Token: string;
  ExpiredAt: Date;
}