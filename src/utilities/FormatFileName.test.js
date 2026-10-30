import { describe, it, expect } from 'vitest';
import { FormatFileName } from './FormatFileName';

describe('FormatFileName', () => {
  it.each([
    ['2026-09-15_v3.xlsx', '15/09/2026 · V3'],
    ['2026-09-15_v10.xlsx', '15/09/2026 · V10'],
    ['data/Malaga/2026-09-15_v3.xlsx', '15/09/2026 · V3'],
    ['nombre-raro.json', 'nombre-raro.json'],
    ['', ''],
  ])('%s -> %s', (entrada, esperado) => {
    expect(FormatFileName(entrada)).toBe(esperado);
  });
});
