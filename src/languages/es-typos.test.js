import { describe, it, expect } from 'vitest';
import es from './es/translation.json';

describe('es/translation.json: typos corregidos', () => {
  it('login.unauthorizedLabel está bien escrito', () => {
    expect(es.login.unauthorizedLabel).toBe('Verifica el usuario y/o contraseña');
    expect(es.login.unauthorizedLabel).not.toContain('contraeña');
  });
});
