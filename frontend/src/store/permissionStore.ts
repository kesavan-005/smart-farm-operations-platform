import { create } from 'zustand';
import { apiClient } from '@/lib/apiClient';
import type { FarmModule, ModuleAccessLevel, SensitivePermission, FarmPermissionMatrix } from '@/types/permissions';

interface PermissionState {
  currentFarmId: string | null;
  role: string | null;
  isOwner: boolean;
  modules: Record<FarmModule, ModuleAccessLevel>;
  sensitivePermissions: SensitivePermission[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFarmPermissions: (farmId: string) => Promise<void>;
  clearPermissions: () => void;

  // Evaluation Helpers
  hasModuleAccess: (module: FarmModule, requiredLevel?: ModuleAccessLevel) => boolean;
  isFullAccess: (module: FarmModule) => boolean;
  isViewOnly: (module: FarmModule) => boolean;
  canAccess: (module: FarmModule) => boolean;
  hasSensitivePermission: (permission: SensitivePermission) => boolean;
}

const DEFAULT_MODULES: Record<FarmModule, ModuleAccessLevel> = {
  FARM_MANAGEMENT: 'NO_ACCESS',
  OPERATIONS: 'NO_ACCESS',
  MONITORING: 'NO_ACCESS',
  INVENTORY: 'NO_ACCESS',
  FINANCE: 'NO_ACCESS',
  AI_ADVISORY: 'NO_ACCESS',
  REPORTS: 'NO_ACCESS',
  NOTIFICATIONS: 'NO_ACCESS',
};

export const usePermissionStore = create<PermissionState>((set, get) => ({
  currentFarmId: null,
  role: null,
  isOwner: false,
  modules: { ...DEFAULT_MODULES },
  sensitivePermissions: [],
  isLoading: false,
  error: null,

  loadFarmPermissions: async (farmId: string) => {
    if (!farmId) {
      set({ currentFarmId: null, role: null, isOwner: false, modules: { ...DEFAULT_MODULES }, sensitivePermissions: [] });
      return;
    }

    set({ isLoading: true, error: null, currentFarmId: farmId });
    try {
      const response = await apiClient.get<FarmPermissionMatrix>(`/farms/${farmId}/permissions/me`);
      const data = response.data;
      set({
        role: data.role,
        isOwner: data.role === 'FARM_OWNER' || data.role === 'ADMIN',
        modules: data.modules || { ...DEFAULT_MODULES },
        sensitivePermissions: data.sensitivePermissions || [],
        isLoading: false,
      });

      // Local storage cache for offline rendering
      try {
        localStorage.setItem(`uzhavan_permissions_${farmId}`, JSON.stringify(data));
      } catch (e) {
        // ignore quota issues
      }
    } catch (err: any) {
      // Try offline cache fallback if available
      try {
        const cachedStr = localStorage.getItem(`uzhavan_permissions_${farmId}`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr) as FarmPermissionMatrix;
          set({
            role: cached.role,
            isOwner: cached.role === 'FARM_OWNER' || cached.role === 'ADMIN',
            modules: cached.modules || { ...DEFAULT_MODULES },
            sensitivePermissions: cached.sensitivePermissions || [],
            isLoading: false,
          });
          return;
        }
      } catch (e) {
        // ignore
      }

      set({
        isLoading: false,
        error: err?.message || 'Failed to load farm permissions',
      });
    }
  },

  clearPermissions: () => {
    set({
      currentFarmId: null,
      role: null,
      isOwner: false,
      modules: { ...DEFAULT_MODULES },
      sensitivePermissions: [],
      error: null,
    });
  },

  hasModuleAccess: (module: FarmModule, requiredLevel: ModuleAccessLevel = 'VIEW_ONLY') => {
    const { isOwner, modules } = get();
    if (isOwner) return true;
    const actual = modules[module] || 'NO_ACCESS';
    if (requiredLevel === 'VIEW_ONLY') return actual === 'VIEW_ONLY' || actual === 'FULL_ACCESS';
    if (requiredLevel === 'FULL_ACCESS') return actual === 'FULL_ACCESS';
    return false;
  },

  isFullAccess: (module: FarmModule) => get().hasModuleAccess(module, 'FULL_ACCESS'),
  isViewOnly: (module: FarmModule) => get().modules[module] === 'VIEW_ONLY',
  canAccess: (module: FarmModule) => get().hasModuleAccess(module, 'VIEW_ONLY'),
  hasSensitivePermission: (perm: SensitivePermission) => get().isOwner || get().sensitivePermissions.includes(perm),
}));
