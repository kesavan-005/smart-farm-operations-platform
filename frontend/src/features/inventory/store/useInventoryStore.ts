import { create } from 'zustand';

interface InventoryState {
  search: string;
  categoryId: string;
  warehouseId: string;
  status: string;
  selectedItems: string[];
  simulatedTankLevel: number; // For IoT sensor real-time water tank level simulation
  simulatedFertilizerLevel: number; // For real-time nutrient depletion events
  setSearch: (search: string) => void;
  setCategoryId: (categoryId: string) => void;
  setWarehouseId: (warehouseId: string) => void;
  setStatus: (status: string) => void;
  resetFilters: () => void;
  setSelectedItems: (items: string[]) => void;
  toggleSelectedItem: (id: string) => void;
  clearSelectedItems: () => void;
  simulateDepletion: (waterLiters: number, fertilizerKg: number) => void;
  resetSimulation: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  search: '',
  categoryId: '',
  warehouseId: '',
  status: '',
  selectedItems: [],
  simulatedTankLevel: 12500, // Starts at 12,500 liters
  simulatedFertilizerLevel: 450, // Starts at 450 kg

  setSearch: (search) => set({ search }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setWarehouseId: (warehouseId) => set({ warehouseId }),
  setStatus: (status) => set({ status }),
  resetFilters: () => set({ search: '', categoryId: '', warehouseId: '', status: '' }),
  
  setSelectedItems: (selectedItems) => set({ selectedItems }),
  toggleSelectedItem: (id) => set((state) => {
    const exists = state.selectedItems.includes(id);
    return {
      selectedItems: exists
        ? state.selectedItems.filter((item) => item !== id)
        : [...state.selectedItems, id]
    };
  }),
  clearSelectedItems: () => set({ selectedItems: [] }),

  simulateDepletion: (waterLiters, fertilizerKg) => set((state) => ({
    simulatedTankLevel: Math.max(0, state.simulatedTankLevel - waterLiters),
    simulatedFertilizerLevel: Math.max(0, state.simulatedFertilizerLevel - fertilizerKg)
  })),

  resetSimulation: () => set({
    simulatedTankLevel: 12500,
    simulatedFertilizerLevel: 450
  })
}));
