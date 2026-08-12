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

        // 1. If currently stored activeFarmId is valid in available farms list, keep it
        if (currentActive && farms && farms.some((f) => f.id === currentActive)) {
          return currentActive;
        }

        // 2. Fallback to user.farmId if valid in farms list
        if (userFarmId && farms && farms.some((f) => f.id === userFarmId)) {
          set({ activeFarmId: userFarmId });
          return userFarmId;
        }

        // 3. Fallback to first available farm
        if (farms && farms.length > 0) {
          const firstFarmId = farms[0]!.id;
          set({ activeFarmId: firstFarmId });
          return firstFarmId;
        }

        return null;
      },
    }),
    {
      name: 'smartfarm_active_farm_id',
    }
  )
);
