import { describe, it, expect } from 'vitest';
import formatSecret from './formatSecret';

describe('formatSecret', () => {
  it('parte una clave de 16 caracteres en 4 grupos de 4 separados por un espacio', () => {
    expect(formatSecret('JBSWY3DPEHPK3PXP')).toBe('JBSW Y3DP EHPK 3PXP');
  });

  it('deja el resto en el último grupo', () => {
    expect(formatSecret('ABCDEFGHI')).toBe('ABCD EFGH I');
  });

  it('una clave vacía o ausente da una cadena vacía', () => {
    expect(formatSecret('')).toBe('');
    expect(formatSecret(undefined)).toBe('');
  });
});
