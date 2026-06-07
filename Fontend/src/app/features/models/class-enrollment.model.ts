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

  scheduleDays?: string[];
}
