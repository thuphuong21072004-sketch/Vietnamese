export interface BookingDTO {
  BookingId: number;

  TeacherName: string;
  StudentName: string;
  AvailabilityId: number;
  StartTime: Date;
  EndTime: Date;
  Status: number;
  CreatedDate: Date;
}
