import { create } from 'zustand';
import type { UserDto } from '@classroom/shared';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      setAuth: (user, accessToken) => 
        set({ user, accessToken, isAuthenticated: true }),
        
      setAccessToken: (accessToken) => 
        set({ accessToken }),
        
      logout: () => 
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // unique name
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // don't persist token, let refresh handle it
    }
  )
);
