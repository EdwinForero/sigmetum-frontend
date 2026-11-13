import { describe, it, expect } from 'vitest';
import { normalizePath } from './routes';

describe('normalizePath', () => {
  it.each([
    ['/explore', '/explore'],
    ['/EXPLORE', '/explore'],
    ['/Explore', '/explore'],
    ['/Manage-Data', '/manage-data'],
    ['/explore/', '/explore'],
    ['/EXPLORE///', '/explore'],
    ['/', '/'],
    ['//', '/'],
    ['', '/'],
  ])('normalizePath(%j) da %j', (entrada, esperado) => {
    expect(normalizePath(entrada)).toBe(esperado);
  });
});
