import { beforeEach, describe, it, expect, vi } from 'vitest';
import i18n from './i18n';

describe('lang del documento', () => {
  beforeEach(() => {
    document.documentElement.lang = 'es-ES';
    localStorage.clear();
  });

  it.each([
    ['en', 'en'],
    ['es', 'es'],
    ['en-US', 'en'],
    ['es-ES', 'es'],
    ['fr', 'es'],
  ])('al cambiar el idioma a %s, lang es %s', async (idioma, esperado) => {
    await i18n.changeLanguage(idioma);

    expect(document.documentElement.lang).toBe(esperado);
  });

  it.each([
    ['en-US', 'en'],
    ['fr', 'es'],
  ])('con idioma inicial detectado %s, lang es %s', async (detectado, esperado) => {
    localStorage.setItem('i18nextLng', detectado);
    vi.resetModules();

    await import('./i18n');

    expect(document.documentElement.lang).toBe(esperado);
  });
});
