export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  walletId: string;
  createdBy: string;
  admins: string[];
  teachers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationInviteDto {
  id: string;
  email: string;
  role: 'teacher' | 'org_admin';
  token: string;
  expiresAt: string;
  organizationId: string;
  createdAt: string;
}
