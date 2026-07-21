import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  setSession: (user: User, accessToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null, // We keep the token in memory/persisted state. In high-security environments, keep it out of persist. For this demo, it simplifies hydration.
      
      setSession: (user, accessToken) => set({
        isAuthenticated: true,
        user,
        accessToken,
      }),
      
      updateAccessToken: (accessToken) => set({ accessToken }),
      
      clearSession: () => set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
      }),
    }),
    {
      name: 'smartfarm-auth',
      // We explicitly persist user data to prevent flash of login screen on refresh
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken 
      }),
    }
  )
);
