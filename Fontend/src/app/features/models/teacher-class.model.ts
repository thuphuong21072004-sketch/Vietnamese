export interface ClassScheduleDayDto {
  id: number;

  classId: number;

  dayOfWeek: string;
}

export interface ClassSessionDto {
  sessionId: number;

  classId: number;

  studyDate: string;

  startTime: string;

  endTime: string;

  topic: string;

  sessionNumber: number;

  status: string;
}

export interface TeacherClassDto {
  classId: number;

  teacherProfileId: number;

  title: string;

  description: string;

  price: number;

  maxStudents: number;

  currentStudents: number;

  status: number;

  mainTopic: string;

  subTopic: string;

  totalSessions: number;

  startDate: string;

  startTime: string;

  endTime: string;

  scheduleDays: ClassScheduleDayDto[];

  sessions: ClassSessionDto[];

  teacherName?: string;

  country?: string;

  ratingAverage?: number;
  avatarUrl?: string;
  teacherProfile?: TeacherProfileDTO;
}
import { TeacherProfileDTO } from './teacher-profile.model';