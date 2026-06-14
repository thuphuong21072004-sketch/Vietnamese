export interface TeacherScheduleDto {
  scheduleId: number;
  teacherId: number;
  destination: string;
  availableFrom: string;
  availableTo: string;
  status: number;
  createdAt: string;
  teacherName?: string;
  teacherAvatarUrl?: string;
  teacherCountry?: string;
  hasActiveRequest?: boolean;
}

export interface StudentTripDto {
  tripId: number;
  studentId: number;
  destination: string;
  specificLocation?: string;
  startDate: string;
  endDate: string;
  status: number;
  createdAt: string;
  studentName?: string;
  studentAvatarUrl?: string;
  studentCountry?: string;
  matchedTeacherId?: number;
  matchedTeacherName?: string;
  classId?: number;
}

export interface MatchRequestDto {
  matchRequestId: number;
  scheduleId: number;
  tripId: number;
  requestType: number;
  status: number;
  createdAt: string;
  respondedAt?: string;
  teacherId?: number;
  teacherName?: string;
  teacherAvatarUrl?: string;
  studentId?: number;
  studentName?: string;
  studentAvatarUrl?: string;
  destination?: string;
  specificLocation?: string;
  startDate: string;
  endDate: string;
  classId?: number;
}

export interface TravelBookingDto {
  travelBookingId: number;
  scheduleId: number;
  tripId: number;
  destination: string;
  startDate: string;
  endDate: string;
  status: number;
  createdAt: string;
  teacherName?: string;
  studentName?: string;
}
