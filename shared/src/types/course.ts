export interface CourseDto {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  enrollmentCode: string;
  students: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  description?: string;
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface JoinCourseDto {
  enrollmentCode: string;
}
