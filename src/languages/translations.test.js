import { describe, it, expect } from 'vitest';
import es from './es/translation.json';
import en from './en/translation.json';

const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]]
  );

const placeholders = (text) => (String(text).match(/{{\s*\w+\s*}}/g) || []).sort();

const spanish = Object.fromEntries(flatten(es));
const english = Object.fromEntries(flatten(en));

describe('traducciones', () => {
  it('el inglés y el español tienen exactamente las mismas claves', () => {
    const missingInEnglish = Object.keys(spanish).filter((key) => !(key in english));
    const missingInSpanish = Object.keys(english).filter((key) => !(key in spanish));

    expect({ missingInEnglish, missingInSpanish }).toEqual({ missingInEnglish: [], missingInSpanish: [] });
  });

  it('cada clave usa los mismos marcadores de interpolación en ambos idiomas', () => {
    const mismatched = Object.keys(spanish)
      .filter((key) => key in english)
      .filter((key) => placeholders(spanish[key]).join() !== placeholders(english[key]).join());

    expect(mismatched).toEqual([]);
  });

  it('incluye las claves de los errores 503, 429, 400 y 404 del backend', () => {
    const keys = [
      'login.serviceUnavailable',
      'dialogAdvice.errorEmailRateLimit',
      'dialogAdvice.errorEmailInvalid',
      'dialogAdvice.errorDraftNotFound',
      'dialogAdvice.adviceInvalidImageTitle',
    ];

    expect(keys.filter((key) => !(key in spanish) || !(key in english))).toEqual([]);
  });

  it('incluye las claves de los errores y retos del login con formulario propio', () => {
    const keys = [
      'login.credentialsError',
      'login.sessionExpired',
      'login.codeSessionLost',
      'login.codeError',
      'login.passwordRejected',
      'login.serviceUnavailable',
      'login.mfaSetupAgain',
    ];

    expect(keys.filter((key) => !(key in spanish) || !(key in english))).toEqual([]);
  });

  it('el login ya no tiene las claves del Hosted UI', () => {
    expect(Object.keys(spanish).concat(Object.keys(english)).filter((key) => /^login\.callback/.test(key))).toEqual([]);
  });

  it('incluye los textos de la galería vacía y del título del 404', () => {
    expect({
      es: [spanish['gallery.noDataFoundPlaceholder'], spanish['notFound.title']],
      en: [english['gallery.noDataFoundPlaceholder'], english['notFound.title']],
    }).toEqual({
      es: ['No hay datos disponibles.', 'Página no encontrada'],
      en: ['No data available.', 'Page not found'],
    });
  });

  it('incluye los nombres accesibles de los botones de icono', () => {
    const pick = (dictionary) =>
      Object.fromEntries(
        Object.entries(dictionary)
          .filter(([key]) => key.startsWith('iconButton.'))
          .map(([key, value]) => [key.replace('iconButton.', ''), value])
      );

    expect({ es: pick(spanish), en: pick(english) }).toEqual({
      es: {
        delete: 'Eliminar',
        add: 'Añadir',
        menu: 'Menú',
        close: 'Cerrar',
        previousPage: 'Página anterior',
        nextPage: 'Página siguiente',
        info: 'Información',
        scrollDown: 'Bajar',
      },
      en: {
        delete: 'Delete',
        add: 'Add',
        menu: 'Menu',
        close: 'Close',
        previousPage: 'Previous page',
        nextPage: 'Next page',
        info: 'Information',
        scrollDown: 'Scroll down',
      },
    });
  });

  it('ninguna traducción está vacía', () => {
    const empty = [...flatten(es), ...flatten(en)].filter(([, value]) => String(value).trim() === '');

    expect(empty).toEqual([]);
  });
});
