import { describe, it, expect } from 'vitest';
import isSafeImageUrl from './isSafeImageUrl';

describe('isSafeImageUrl', () => {
  it.each([
    ['https://assets.example/a.png'],
    ['http://localhost:3000/a.png'],
    ['http://127.0.0.1/a.png'],
  ])('acepta %s', (url) => {
    expect(isSafeImageUrl(url)).toBe(true);
  });

  it.each([
    ['http://evil.example/a.png'],
    ['javascript:alert(1)'],
    ['data:image/png;base64,AAAA'],
    ['no es una url'],
    [''],
    [undefined],
    [null],
  ])('rechaza %s', (url) => {
    expect(isSafeImageUrl(url)).toBe(false);
  });
});
