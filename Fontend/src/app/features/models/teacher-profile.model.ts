export interface TeacherProfileDTO {
  teacherProfileId: number;

  userId: number;

  teacherName?: string;

  country?: string;

  avatarUrl?: string;

  introVideoUrl?: string;

  specialty?: string;

  experienceYears: number;

  description?: string;

  englishCertificateUrl?: string;

  desiredPricePerHour: number;

  approvedPricePerHour?: number;

  ratingAverage: number;

  totalReviews: number;

  status: number;

  adminNote?: string;

  approvedBy?: string;

  createdDate: string;

  updatedDate?: string;
}
