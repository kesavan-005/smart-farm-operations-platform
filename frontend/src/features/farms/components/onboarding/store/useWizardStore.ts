import { create } from 'zustand';
import type { OnboardingDraft, ProfileData, FarmData, FieldData, CropData } from '../types/OnboardingTypes';

export interface WizardState {
  // Temporary UI State
  currentStep: number;
  
  // Data State
  profile: ProfileData | null;
  farm: FarmData | null;
  fields: FieldData[];
  crops: CropData[];
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setProfile: (data: ProfileData) => void;
  setFarm: (data: FarmData) => void;
  addField: (field: FieldData) => void;
  updateField: (id: string, field: FieldData) => void;
  removeField: (id: string) => void;
  
  addCrop: (crop: CropData) => void;
  updateCrop: (id: string, crop: CropData) => void;
  removeCrop: (id: string) => void;
  
  // Initialize from a loaded draft
  loadDraft: (draft: OnboardingDraft) => void;
  
  // Clear everything after success
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  profile: null,
  farm: null,
  fields: [],
  crops: [],
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  setProfile: (profile) => set({ profile }),
  setFarm: (farm) => set({ farm }),
  
  addField: (field) => set((state) => ({ fields: [...state.fields, field] })),
  updateField: (id, updatedField) => set((state) => ({
    fields: state.fields.map(f => f.id === id ? updatedField : f)
  })),
  removeField: (id) => set((state) => ({
    fields: state.fields.filter(f => f.id !== id),
    // Also remove crops associated with this field
    crops: state.crops.filter(c => c.fieldId !== id)
  })),

  addCrop: (crop) => set((state) => ({ crops: [...state.crops, crop] })),
  updateCrop: (id, updatedCrop) => set((state) => ({
    crops: state.crops.map(c => c.id === id ? updatedCrop : c)
  })),
  removeCrop: (id) => set((state) => ({
    crops: state.crops.filter(c => c.id !== id)
  })),

  loadDraft: (draft) => set({
    currentStep: draft.step,
    profile: draft.profile,
    farm: draft.farm,
    fields: draft.fields || [],
    crops: draft.crops || [],
  }),

  reset: () => set(initialState),
}));
