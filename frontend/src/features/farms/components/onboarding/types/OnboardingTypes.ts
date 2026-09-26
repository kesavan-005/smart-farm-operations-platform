import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  language: z.enum(['en', 'ta']),
});

export const FarmSchema = z.object({
  name: z.string().min(2, 'Farm name is required'),
  district: z.string().min(2, 'District is required'),
  taluk: z.string().min(2, 'Taluk is required'),
  village: z.string().min(2, 'Village is required'),
  state: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  boundary: z.any().optional(),
  area: z.number().min(0.1, 'Area must be greater than 0'),
  soilType: z.string().optional(),
  irrigationSource: z.string().optional(),
});

export const FieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'onboarding.fieldNameRequired'),
  area: z.number().min(0.1, 'onboarding.fieldAreaRequired'),
  areaUnit: z.string().optional(),
  address: z.string().optional(),
  village: z.string().min(1, 'onboarding.villageRequired'),
  taluk: z.string().min(1, 'onboarding.talukRequired'),
  district: z.string().min(1, 'onboarding.districtRequired'),
  state: z.string().min(1, 'onboarding.stateRequired'),
  pincode: z.string().min(1, 'onboarding.pincodeInvalid').regex(/^\d{6}$/, 'onboarding.pincodeInvalid'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  boundary: z.any().optional(),
});

export const CropSchema = z.object({
  id: z.string(),
  fieldId: z.string().min(1, 'Field selection is required'),
  name: z.string().min(1, 'Crop name is required'),
  variety: z.string().optional(),
  sowingDate: z.string().min(1, 'Sowing date is required'),
  expectedHarvestDate: z.string().min(1, 'Expected harvest date is required'),
});

export type ProfileData = z.infer<typeof ProfileSchema>;
export type FarmData = z.infer<typeof FarmSchema>;
export type FieldData = z.infer<typeof FieldSchema>;
export type CropData = z.infer<typeof CropSchema>;

export interface OnboardingDraft {
  id: string; // Typically a single known ID like 'current-draft' or user ID
  userId: string;
  step: number;
  profile: ProfileData;
  farm: FarmData;
  fields: FieldData[];
  crops: CropData[];
  
  // Partial sync state
  syncedFarmId?: string;
  syncedFieldIds?: Record<string, string>; // Maps local fieldId to server fieldId
  syncedCropIds?: Record<string, string>; // Maps local cropId to server cropId
  
  updatedAt: string;
}
