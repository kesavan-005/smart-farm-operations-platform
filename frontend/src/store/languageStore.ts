// Language Store — Zustand (persisted to localStorage)
// Drives i18next language switching

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n/config';

export type AppLanguage = 'en' | 'ta';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',

      setLanguage: (language) => {
        i18n.changeLanguage(language);
        document.documentElement.setAttribute('lang', language);
        set({ language });
      },

      toggleLanguage: () => {
        const next = get().language === 'en' ? 'ta' : 'en';
        i18n.changeLanguage(next);
        document.documentElement.setAttribute('lang', next);
        set({ language: next });
      },
    }),
    {
      name: 'smartfarm-language',
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          i18n.changeLanguage(state.language);
          document.documentElement.setAttribute('lang', state.language);
        }
      },
    },
  ),
);
