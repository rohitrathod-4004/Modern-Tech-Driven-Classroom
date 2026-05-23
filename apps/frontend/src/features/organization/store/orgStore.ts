import { create } from 'zustand';
import { api } from '../../../infrastructure/api';
import type { OrganizationDto, CreditWalletDto, CreditUsageDto } from '@classroom/shared';

interface OrgState {
  organization: OrganizationDto | null;
  wallet: CreditWalletDto | null;
  recentUsage: CreditUsageDto[];
  isLoading: boolean;
  error: string | null;

  fetchDashboard: (orgId: string) => Promise<void>;
  createOrganization: (name: string) => Promise<OrganizationDto>;
  createInvite: (orgId: string, email: string, role: 'teacher' | 'org_admin') => Promise<{ token: string; email: string }>;
  acceptInvite: (token: string) => Promise<void>;
  allocateCredits: (orgId: string, teacherId: string, amount: number) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set, get) => ({
  organization: null,
  wallet: null,
  recentUsage: [],
  isLoading: false,
  error: null,

  fetchDashboard: async (orgId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ data: { organization: OrganizationDto, wallet: CreditWalletDto, recentUsage: CreditUsageDto[] } }>(`/api/organizations/${orgId}/dashboard`);
      set({ 
        organization: response.data.data.organization, 
        wallet: response.data.data.wallet,
        recentUsage: response.data.data.recentUsage,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch dashboard', isLoading: false });
    }
  },

  createOrganization: async (name) => {
    try {
      const response = await api.post<{ data: OrganizationDto }>('/api/organizations', { name });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create organization');
    }
  },

  createInvite: async (orgId, email, role) => {
    try {
      const response = await api.post<{ data: { token: string, email: string } }>(`/api/organizations/${orgId}/invites`, { email, role });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create invite');
    }
  },

  acceptInvite: async (token) => {
    try {
      await api.post('/api/organizations/invites/accept', { token });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to accept invite');
    }
  },

  allocateCredits: async (orgId, teacherId, amount) => {
    try {
      await api.post(`/api/organizations/${orgId}/allocate`, { teacherId, amount });
      await get().fetchDashboard(orgId); // Refresh wallet balances
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to allocate credits');
    }
  }
}));
