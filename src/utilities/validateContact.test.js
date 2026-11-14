import { describe, it, expect } from 'vitest';
import validateContact, { MESSAGE_MIN_LENGTH } from './validateContact';
import validateRecipientEmail from './validateRecipientEmail';

const valid = {
  username: 'Ana',
  email: 'ana@example.com',
  subject: 'Consulta',
  message: 'Un mensaje con más de veinte caracteres.',
};

describe('validateContact', () => {
  it('con datos válidos no devuelve errores', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('el mínimo del mensaje es 20 caracteres', () => {
    expect(MESSAGE_MIN_LENGTH).toBe(20);
  });

  it('con todo vacío pide los cuatro campos', () => {
    expect(validateContact({ username: '', email: '', subject: '', message: '' })).toEqual({
      username: { key: 'form.errors.required' },
      email: { key: 'form.errors.required' },
      subject: { key: 'form.errors.required' },
      message: { key: 'form.errors.required' },
    });
  });

  it('solo espacios cuenta como vacío', () => {
    const errors = validateContact({ username: '   ', email: ' ', subject: '\t', message: '  \n ' });

    expect(Object.keys(errors)).toEqual(['username', 'email', 'subject', 'message']);
    expect(Object.values(errors).every((error) => error.key === 'form.errors.required')).toBe(true);
  });

  it.each([
    ['juan.perez', 'form.errors.email'],
    ['a@b', 'form.errors.email'],
    ['a b@c.es', 'form.errors.email'],
    ['@b.es', 'form.errors.email'],
    ['ana\u200B@x.es', 'form.errors.email'],
    ['ana\u200E@x.es', 'form.errors.email'],
    ['ana@exa\u202Emple.com', 'form.errors.email'],
    ['josé@x.es', undefined],
    ['a@b.es', undefined],
    ['  a@b.es  ', undefined],
    ["o'brien@example.com", 'form.errors.email'],
    ['a"b@x.es', 'form.errors.email'],
    ['a\\b@x.es', 'form.errors.email'],
    ['a,b@x.es', 'form.errors.email'],
    ['a;b@x.es', 'form.errors.email'],
    ['a:b@x.es', 'form.errors.email'],
    ['a<b>@x.es', 'form.errors.email'],
    ['a(b)@x.es', 'form.errors.email'],
    ['ana\u0007@x.es', 'form.errors.email'],
    [`${'a'.repeat(243)}@example.com`, 'form.errors.email'],
    [`${'a'.repeat(242)}@example.com`, undefined],
    ['a.b+tag@sub.example.org', undefined],
  ])('el correo %j da %s', (email, key) => {
    const errors = validateContact({ ...valid, email });

    expect(errors.email?.key).toBe(key);
  });

  // Una sola copia de la regla: lo que el formulario público rechaza es lo que rechaza el panel de destinatarios.
  it.each([
    'ana@example.com',
    "o'brien@example.com",
    'a"b@x.es',
    'a\\b@x.es',
    'a,b@x.es',
    'a;b@x.es',
    'a:b@x.es',
    'a<b>@x.es',
    'a(b)@x.es',
    'ana\u0007@x.es',
    'ana\u200B@x.es',
    'a\u2028b@x.es',
    'juan.perez',
    'a@b',
    'josé@x.es',
    `${'a'.repeat(243)}@example.com`,
    `${'a'.repeat(242)}@example.com`,
  ])('equivale al servidor para %j', (email) => {
    const rejectedByContact = validateContact({ ...valid, email }).email?.key === 'form.errors.email';

    expect(rejectedByContact).toBe(validateRecipientEmail(email) === 'email');
  });

  it('un mensaje de 19 caracteres es corto y de 20 vale, contando tras trim', () => {
    expect(validateContact({ ...valid, message: 'a'.repeat(19) }).message).toEqual({
      key: 'form.errors.minLength',
      count: 20,
    });
    expect(validateContact({ ...valid, message: 'a'.repeat(20) }).message).toBeUndefined();
    expect(validateContact({ ...valid, message: `  ${'a'.repeat(19)}  ` }).message?.key).toBe('form.errors.minLength');
  });

  it('un error por campo: el vacío manda sobre el formato', () => {
    expect(validateContact({ ...valid, email: '' }).email).toEqual({ key: 'form.errors.required' });
  });

  it('no muta la entrada', () => {
    const input = Object.freeze({ ...valid, email: ' juan.perez ' });

    expect(() => validateContact(input)).not.toThrow();
    expect(input.email).toBe(' juan.perez ');
  });
});
