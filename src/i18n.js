import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './languages/en/translation.json';
import translationES from './languages/es/translation.json';

const resources = {
  es: { translation: translationES },
  en: { translation: translationEN }
};

const FALLBACK_LANGUAGE = 'es';

// El lang del documento sigue al idioma realmente mostrado (en-US da en, fr da es por el respaldo).
const setDocumentLang = () => {
  document.documentElement.lang = i18n.resolvedLanguage || FALLBACK_LANGUAGE;
};

// Antes de init: con recursos en línea, init emite languageChanged de forma síncrona.
i18n.on('languageChanged', setDocumentLang);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;