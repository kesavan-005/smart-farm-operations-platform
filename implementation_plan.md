# Implementation Plan — Phase 1 Offline Tamil/English UI Localization

Provide complete offline bilingual (English ↔ Tamil) UI localization for Project Uzhavan using `i18next` and `react-i18next`, with static local JSON resources, Zustand state persistence, immediate UI language switching, Workbox PWA offline support, and natural, farmer-friendly Tamil terminology.

## User Review Required

> [!NOTE]
> All changes are strictly confined to the React frontend UI layer. No backend, database, business logic, or external translation APIs will be touched or introduced.

## Proposed Changes

### 1. Translation Resources & i18n Configuration

#### [NEW] [translation.json (English)](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/i18n/locales/en/translation.json)
- Create standardized English translation resource containing all UI sections: `nav`, `common`, `auth`, `dashboard`, `farm`, `field`, `crop`, `activity`, `inventory`, `finance`, `task`, `weather`, `forms`, `validation`, `offline`, `onboarding`, `settings`, `help`.

#### [NEW] [translation.json (Tamil)](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/i18n/locales/ta/translation.json)
- Create standardized Tamil translation resource containing matching keys for all UI sections using clear, natural agricultural Tamil suitable for farmers:
  - Farm → பண்ணை
  - Field → வயல்
  - Crop → பயிர்
  - Soil Type → மண் வகை
  - Weather → வானிலை
  - Activity → செயல்பாடு
  - Inventory → சரக்கு
  - Expense → செலவு
  - Save → சேமி
  - Cancel → ரத்து செய்

#### [MODIFY] [config.ts](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/i18n/config.ts)
- Statically import `src/i18n/locales/en/translation.json` and `src/i18n/locales/ta/translation.json` into Vite bundle.
- Configure `i18n` with `en` and `ta` resources, fallback language `en`, and default namespace `translation` alongside legacy namespace mappings to ensure full backward compatibility.

---

### 2. Language Store & Switcher

#### [MODIFY] [languageStore.ts](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/i18n/store/languageStore.ts)
- Ensure language switching (`setLanguage`, `toggleLanguage`) updates `i18n.changeLanguage()`, `document.documentElement.lang`, and persists seamlessly in `localStorage` under `smartfarm-language`.

#### [MODIFY] [AuthLayout.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/layouts/AuthLayout.tsx) & [AppLayout.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/layouts/AppLayout.tsx) & [SettingsScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/auth/components/SettingsScreen.tsx)
- Ensure language toggle buttons display `English` / `தமிழ்` clearly and trigger language switching without page reloads.

---

### 3. UI Component Text Replacement

#### [MODIFY] Layouts & Navigation
- [AppLayout.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/layouts/AppLayout.tsx): Translate sidebar links, mobile navigation, headers, sync status badge, and profile menu.
- [AuthLayout.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/layouts/AuthLayout.tsx): Translate hero panel, feature chips, and subtext.

#### [MODIFY] Authentication Screens
- [LoginScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/auth/components/LoginScreen.tsx), [RegisterScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/auth/components/RegisterScreen.tsx), [OtpScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/auth/components/OtpScreen.tsx): Replace hardcoded labels, placeholdes, buttons, and helper text with `t(...)` keys.

#### [MODIFY] Dashboard & Attention Items
- [DashboardScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/dashboard/components/DashboardScreen.tsx): Replace inline `isTa ? ... : ...` ternary conditionals and hardcoded strings with standardized `t(...)` calls for greetings, action cards, KPI cards, and empty state setup.

#### [MODIFY] Farm, Field & Crop Screens
- [FarmListScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/farms/components/FarmListScreen.tsx), [FarmDetailScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/farms/components/FarmDetailScreen.tsx), [FarmForm.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/farms/components/FarmForm.tsx), [FarmHealthScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/farms/components/FarmHealthScreen.tsx), [FieldDetailScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/fields/components/FieldDetailScreen.tsx), [FieldForm.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/fields/components/FieldForm.tsx), [CropDetailScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/crops/components/CropDetailScreen.tsx), [CropForm.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/crops/components/CropForm.tsx): Localize titles, form labels, soil types, irrigation types, empty states, and action buttons.

#### [MODIFY] Activities, Inventory, Finance, Tasks & Onboarding
- Localize [ActivityScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/activities/components/ActivityScreen.tsx), [ActivityForm.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/activities/components/ActivityForm.tsx), [InventoryScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/inventory/components/InventoryScreen.tsx), [InventoryForm.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/inventory/components/InventoryForm.tsx), [FinanceScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/finance/components/FinanceScreen.tsx), [FinanceForm.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/finance/components/FinanceForm.tsx), [TaskScreen.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/tasks/components/TaskScreen.tsx), [TaskForm.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/tasks/components/TaskForm.tsx), [FarmerOnboardingWizard.tsx](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/src/features/farms/components/onboarding/FarmerOnboardingWizard.tsx), and Step 1-5 subcomponents.

---

### 4. Workbox / PWA Offline Verification

#### [MODIFY] [vite.config.ts](file:///c:/Users/Dell/Desktop/smart-farm-operations-platform-version-2-updated/frontend/vite.config.ts)
- Confirm that VitePWA precaches the JavaScript bundle containing the statically imported JSON locale files, ensuring 100% offline availability without external network calls.

---

## Verification Plan

### Automated Tests
- `npm run type-check` (verify zero TypeScript compilation errors)
- `npm run build` (verify production Vite PWA build passes cleanly)

### Manual Verification & Offline Testing
1. Launch application (`npm run dev`).
2. Toggle between **English** and **தமிழ்** in the header/settings and verify instant UI translation update.
3. Reload page and restart browser to verify language persistence in `localStorage`.
4. Open Chrome DevTools -> Network -> Select **Offline**.
5. Navigate across Phase 1 screens (Dashboard, Farms, Fields, Crops, Activities, Inventory, Finance, Tasks, Settings).
6. Toggle language while offline and verify that all UI elements switch between English and Tamil instantly with zero network requests.
