import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  permissions: string[];
  setSession: (user: User, accessToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  updateAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      permissions: [],

      setSession: (user, accessToken) =>
        set({
          isAuthenticated: true,
          user,
          accessToken,
          permissions: user.permissions || [],
        }),

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
          permissions: updatedUser.permissions || state.permissions,
        })),

      updateAccessToken: (accessToken) => set({ accessToken }),

      clearSession: () =>
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          permissions: [],
        }),

      hasPermission: (permission) => {
        const { permissions, user } = get();
        if (user?.role === 'ADMIN' || user?.role === 'FARM_OWNER') return true;
        return permissions.includes(permission);
      },

      hasRole: (requiredRoles) => {
        const { user } = get();
        if (!user || !user.role) return false;
        const rolesList = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return rolesList.includes(user.role);
      },
    }),
    {
      name: 'smartfarm-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        permissions: state.permissions,
      }),
    },
  ),
);
