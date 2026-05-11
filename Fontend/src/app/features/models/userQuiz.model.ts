export interface UserQuizDTO {
  userQuizId: number;

  userId: number;

  quizId: number;

  score: number;

  totalScore: number;

  earnedScore: number;

  completedDate: Date;

  isPassed: boolean;

  quizName?: string;

  passScore?: number;
}
