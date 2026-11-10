import { describe, it, expect } from 'vitest';
import { meetsPasswordPolicy } from './passwordPolicy';

describe('meetsPasswordPolicy', () => {
  it('acepta una contraseña de 14 caracteres con las cuatro clases', () => {
    expect(meetsPasswordPolicy('Abcdefghij1!kl')).toBe(true);
  });

  it('rechaza 13 caracteres aunque tenga las cuatro clases', () => {
    expect(meetsPasswordPolicy('Abcdefghij1!k')).toBe(false);
  });

  it.each([
    ['sin minúsculas', 'ABCDEFGHIJ1!KL'],
    ['sin mayúsculas', 'abcdefghij1!kl'],
    ['sin números', 'Abcdefghijk!lmn'],
    ['sin símbolos', 'Abcdefghijk1lmn'],
  ])('rechaza una contraseña %s', (_name, password) => {
    expect(meetsPasswordPolicy(password)).toBe(false);
  });
});
