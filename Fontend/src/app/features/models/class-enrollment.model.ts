export interface ClassEnrollmentDto {
  enrollmentId: number;
  classId: number;
  studentId: number;
  status: number;
  enrolledDate: string;

  studentName?: string;
  studentAvatarUrl?: string;
  studentCountry?: string;

  teacherName?: string;
  teacherAvatarUrl?: string;
  teacherCountry?: string;

  classTitle?: string;

  price?: number;

  description?: string;

  mainTopic?: string;

  subTopic?: string;

  totalSessions?: number;

  currentStudents?: number;

  maxStudents?: number;

  startTime?: string;

  endTime?: string;

  scheduleDays?: { id: number; classId: number; dayOfWeek: string }[];

  sessions?: { sessionId: number; studyDate: string; startTime: string; endTime: string; topic: string; sessionNumber: number }[];

  hasReview?: boolean;
}
