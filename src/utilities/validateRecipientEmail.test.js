import { describe, it, expect } from 'vitest';
import validateRecipientEmail, {
  RECIPIENT_EMAIL_PATTERN,
  EMAIL_MAX_LENGTH,
  RECIPIENTS_MIN,
  RECIPIENTS_MAX,
  normalizeEmail,
  isValidEmailAddress,
} from './validateRecipientEmail';

const lista = [{ email: 'Ana@Example.com' }, { email: 'luis@example.com' }];

describe('validateRecipientEmail', () => {
  it('exporta los límites del servidor', () => {
    expect([EMAIL_MAX_LENGTH, RECIPIENTS_MIN, RECIPIENTS_MAX]).toEqual([254, 1, 5]);
  });

  it('el patrón es el literal de EMAIL_PATTERN del backend (validateContactMessage.js)', () => {
    expect(RECIPIENT_EMAIL_PATTERN.source).toBe(String.raw`^[^\s@,;:<>()'"\\]+@[^\s@,;:<>()'"\\]+\.[^\s@,;:<>()'"\\]+$`);
  });

  it.each([
    ['nombre+tag@sub.dominio.es'],
    ['  ana@example.com  '],
    ['a@b.co'],
    ['josé@x.es'],
    [`${'a'.repeat(241)}@example.com`],
  ])('acepta %s', (valor) => {
    expect(validateRecipientEmail(valor, [])).toBeNull();
  });

  it.each([
    ['', 'required'],
    ['   ', 'required'],
    [undefined, 'required'],
    [null, 'required'],
    [5, 'required'],
    ['sin-arroba', 'email'],
    ['sin@punto', 'email'],
    ['a(b)@example.com', 'email'],
    ["o'brien@example.com", 'email'],
    ['a,b@example.com', 'email'],
    ['a;b@example.com', 'email'],
    ['a b@example.com', 'email'],
    ['a\\b@example.com', 'email'],
    ['a<b>@example.com', 'email'],
    ['a\u0085b@example.com', 'email'],
    ['a\u2028b@example.com', 'email'],
    ['ana\u200b@x.es', 'email'],
    ['ana\u200e@x.es', 'email'],
    ['ana@exa\u202emple.com', 'email'],
    [`${'a'.repeat(243)}@example.com`, 'email'],
  ])('rechaza %j con %s', (valor, esperado) => {
    expect(validateRecipientEmail(valor, [])).toBe(esperado);
  });

  it('un duplicado no distingue mayúsculas ni espacios en los extremos', () => {
    expect(validateRecipientEmail('  ana@example.COM ', lista)).toBe('duplicate');
    expect(validateRecipientEmail('LUIS@example.com', lista)).toBe('duplicate');
    expect(validateRecipientEmail('otra@example.com', lista)).toBeNull();
  });

  it('el formato se comprueba antes que el duplicado y lo vacío antes que ambos', () => {
    expect(validateRecipientEmail('', lista)).toBe('required');
    expect(validateRecipientEmail('ana@example', [{ email: 'ana@example' }])).toBe('email');
  });

  it('sin lista, o con entradas que no son correos, no hay duplicado', () => {
    expect(validateRecipientEmail('ana@example.com')).toBeNull();
    expect(validateRecipientEmail('ana@example.com', [{}, null, { email: 5 }])).toBeNull();
  });

  it('no muta la lista', () => {
    const copia = JSON.parse(JSON.stringify(lista));
    validateRecipientEmail('ana@example.com', lista);
    expect(lista).toEqual(copia);
  });

  it.each([
    ['ana@example.com', true],
    ['josé@x.es', true],
    ['a.b+tag@sub.example.org', true],
    [`${'a'.repeat(242)}@example.com`, true],
    [`${'a'.repeat(243)}@example.com`, false],
    ["o'brien@example.com", false],
    ['a"b@x.es', false],
    ['a:b@x.es', false],
    ['ana\u0007@x.es', false],
    ['ana\u200B@x.es', false],
    ['a\u2029b@x.es', false],
    ['sin@punto', false],
  ])('isValidEmailAddress(%j) da %s', (valor, esperado) => {
    expect(isValidEmailAddress(valor)).toBe(esperado);
  });

  it('normalizeEmail recorta y pasa a minúsculas', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });
});
