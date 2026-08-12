import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Farm } from '@/types/domain';

interface FarmState {
  activeFarmId: string | null;
  setActiveFarmId: (id: string | null) => void;
  initializeActiveFarm: (farms?: Farm[], userFarmId?: string | null) => string | null;
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      activeFarmId: null,

      setActiveFarmId: (id: string | null) => {
        set({ activeFarmId: id });
      },

      initializeActiveFarm: (farms?: Farm[], userFarmId?: string | null) => {
        const currentActive = get().activeFarmId;

        // 1. If currently stored activeFarmId is valid and synced in available farms list, keep it
        if (currentActive && farms) {
          const activeFarm = farms.find((f) => f.id === currentActive);
          if (activeFarm && (activeFarm as any)._synced !== false) {
            return currentActive;
          }
        }

        // 2. Fallback to user.farmId if valid in farms list
        if (userFarmId && farms && farms.some((f) => f.id === userFarmId)) {
          set({ activeFarmId: userFarmId });
          return userFarmId;
        }

        // 3. Fallback to first available synced farm, or first farm overall
        if (farms && farms.length > 0) {
          const syncedFarm = farms.find((f) => (f as any)._synced !== false);
          const selectedId = syncedFarm ? syncedFarm.id : farms[0]!.id;
          set({ activeFarmId: selectedId });
          return selectedId;
        }

        return null;
      },
    }),
    {
      name: 'smartfarm_active_farm_id',
    }
  )
);
