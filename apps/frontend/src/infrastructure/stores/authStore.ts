import { create } from 'zustand';
import type { UserDto } from '@classroom/shared';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

import { persist } from 'zustand/middleware';
import { api } from '../api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      setAuth: (user, accessToken) => 
        set({ user, accessToken, isAuthenticated: true }),
        
      setAccessToken: (accessToken) => 
        set({ accessToken }),
        
      fetchProfile: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        const res = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        set({ user: res.data.data.user });
      },

      logout: () => 
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // unique name
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // don't persist token, let refresh handle it
    }
  )
);
