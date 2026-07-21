import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English locale files
import commonEn from './en/common.json';
import authEn from './en/auth.json';
import navEn from './en/nav.json';
import inventoryEn from './en/inventory.json';
import financeEn from './en/finance.json';
import activitiesEn from './en/activities.json';
import tasksEn from './en/tasks.json';

// Tamil locale files
import commonTa from './ta/common.json';
import authTa from './ta/auth.json';
import navTa from './ta/nav.json';
import inventoryTa from './ta/inventory.json';
import financeTa from './ta/finance.json';
import activitiesTa from './ta/activities.json';
import tasksTa from './ta/tasks.json';

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    nav: navEn,
    inventory: inventoryEn,
    finance: financeEn,
    activities: activitiesEn,
    tasks: tasksEn,
  },
  ta: {
    common: commonTa,
    auth: authTa,
    nav: navTa,
    inventory: inventoryTa,
    finance: financeTa,
    activities: activitiesTa,
    tasks: tasksTa,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('smartfarm-language') ?? 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'nav', 'inventory', 'finance', 'activities'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
