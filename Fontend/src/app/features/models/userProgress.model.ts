export interface UserProgressDTO {
  userId: number;
  completedLessons: number[];
  currentLessonId: number;
  progressPercent: number;
}
