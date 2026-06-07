export type UserRole = 'student' | 'teacher' | 'admin' | 'org_admin';
export type AccountType = 'individual' | 'organization_member';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accountType?: AccountType;
  organizationId?: string;
  walletId?: string;
  enrolledCourses: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserDto;
}
