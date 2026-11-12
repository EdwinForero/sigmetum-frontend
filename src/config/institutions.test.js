import { describe, it, expect } from 'vitest';
import { UNIVERSITIES, ENTITIES } from './institutions';
import ASSETS from './assets';

describe('institutions', () => {
  it('lista las 5 universidades y las 3 entidades por id', () => {
    expect(UNIVERSITIES.map(({ id }) => id)).toEqual(['uma', 'ual', 'ugr', 'uhu', 'uja']);
    expect(ENTITIES.map(({ id }) => id)).toEqual(['efyve', 'geospace', 'mafo']);
  });

  it('todas las direcciones son https y cada logo sale de assets.js', () => {
    const logos = Object.values(ASSETS.LOGOS);
    for (const { url, asset } of [...UNIVERSITIES, ...ENTITIES]) {
      expect(url).toMatch(/^https:\/\//);
      expect(logos).toContain(asset);
    }
  });

  it('EFYVE usa https://www.efyve.com', () => {
    expect(ENTITIES.find(({ id }) => id === 'efyve').url).toBe('https://www.efyve.com');
  });
});
