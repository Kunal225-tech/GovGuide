import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

// Retrieve stored language or default to English ('en')
// Strictly allow only 'en' or 'hi'
const storedLang = typeof window !== 'undefined' ? localStorage.getItem('govguide_language') : 'en';
const initialLanguage = storedLang === 'hi' ? 'hi' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Keep localStorage and HTML lang attribute in sync
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

i18n.on('languageChanged', (lng: string) => {
  const safeLang = lng === 'hi' ? 'hi' : 'en';
  if (typeof window !== 'undefined') {
    localStorage.setItem('govguide_language', safeLang);
    document.documentElement.lang = safeLang;
  }
});

export default i18n;
