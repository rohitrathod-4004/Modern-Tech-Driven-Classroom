export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  enrolledCourses: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserDto;
}
