export interface DashboardStatsDto {
  totalCourses: number;
  totalStudents?: number;
  totalLectures: number;
  totalHoursRecorded: number;
  totalStudyMaterials: number; // For now: total generated topics/flashcards
  aiProcessingReady: number; // Completed lectures
}
