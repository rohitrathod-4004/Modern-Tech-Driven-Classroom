import { create } from 'zustand';
import { api } from '../api';
import type { DashboardStatsDto } from '@classroom/shared';

interface DashboardState {
  stats: DashboardStatsDto | null;
  isLoading: boolean;
  error: string | null;

  fetchStats: () => Promise<void>;
  clearStats: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/api/dashboard/stats');
      set({ stats: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch dashboard stats', isLoading: false });
    }
  },

  clearStats: () => set({ stats: null, error: null })
}));
