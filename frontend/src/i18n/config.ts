import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Statically bundled English and Tamil translation resources
import translationEn from './locales/en/translation.json';
import translationTa from './locales/ta/translation.json';

// Separate namespace files
import financeEn from './en/finance.json';
import financeTa from './ta/finance.json';
import advisoryEn from './en/advisory.json';
import advisoryTa from './ta/advisory.json';

const resources = {
  en: {
    translation: translationEn,
    common: translationEn,
    auth: translationEn.auth,
    nav: translationEn.nav,
    inventory: translationEn.inventory,
    finance: financeEn,
    activities: translationEn.activity,
    tasks: translationEn.task,
    advisory: advisoryEn,
  },
  ta: {
    translation: translationTa,
    common: translationTa,
    auth: translationTa.auth,
    nav: translationTa.nav,
    inventory: translationTa.inventory,
    finance: financeTa,
    activities: translationTa.activity,
    tasks: translationTa.task,
    advisory: advisoryTa,
  },
};

const initialLang = localStorage.getItem('smartfarm-language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    defaultNS: 'translation',
    fallbackNS: 'translation',
    ns: ['translation', 'common', 'auth', 'nav', 'inventory', 'finance', 'activities', 'tasks', 'advisory'],
    interpolation: {
      escapeValue: false, // React escapes HTML by default
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

