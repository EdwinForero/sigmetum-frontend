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

  it('incluye las claves de los errores 401, 429, 400 y 404 del backend', () => {
    const keys = [
      'login.tooManyAttemptsLabel',
      'dialogAdvice.errorEmailRateLimit',
      'dialogAdvice.errorEmailInvalid',
      'dialogAdvice.errorDraftNotFound',
      'dialogAdvice.adviceInvalidImageTitle',
    ];

    expect(keys.filter((key) => !(key in spanish) || !(key in english))).toEqual([]);
  });

  it('ninguna traducción está vacía', () => {
    const empty = [...flatten(es), ...flatten(en)].filter(([, value]) => String(value).trim() === '');

    expect(empty).toEqual([]);
  });
});
