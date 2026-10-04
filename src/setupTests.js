import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Las traducciones se sustituyen por su clave para que los tests no dependan del idioma.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));
