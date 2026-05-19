export interface PaymentDTO {
  PaymentId: number;

  AvailabilityId: number;
  TeacherId: number;
  StartTime: Date;
  EndTime: Date;
  IsBooked: boolean;
  CreatedDate: Date;
}