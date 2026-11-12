import { describe, it, expect } from 'vitest';
import validateContact, { MESSAGE_MIN_LENGTH } from './validateContact';

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
    ['a@b.es', undefined],
    ['  a@b.es  ', undefined],
  ])('el correo %j da %s', (email, key) => {
    const errors = validateContact({ ...valid, email });

    expect(errors.email?.key).toBe(key);
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
