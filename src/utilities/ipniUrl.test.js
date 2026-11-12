import { describe, it, expect } from 'vitest';
import { IPNI_SEARCH_URL, IPNI_VARIANT, ipniQuery, ipniUrl } from './ipniUrl';

const FULL = 'Quercus ilex L. subsp. ballota (Desf.) Samp.';

describe('ipniQuery', () => {
  it('asIs devuelve el nombre recortado', () => {
    expect(ipniQuery(`  ${FULL}  `, 'asIs')).toBe(FULL);
    expect(ipniQuery('J. macrocarpa', 'asIs')).toBe('J. macrocarpa');
  });

  it('noAuthor deja género, epíteto y el primer rango infraespecífico', () => {
    expect(ipniQuery(FULL, 'noAuthor')).toBe('Quercus ilex subsp. ballota');
    expect(ipniQuery('Pinus pinea L.', 'noAuthor')).toBe('Pinus pinea');
    expect(ipniQuery('Pinus pinea L. f.', 'noAuthor')).toBe('Pinus pinea');
    expect(ipniQuery('J. macrocarpa', 'noAuthor')).toBe('J. macrocarpa');
  });

  it('binomial deja solo género y epíteto', () => {
    expect(ipniQuery(FULL, 'binomial')).toBe('Quercus ilex');
    expect(ipniQuery('Pinus pinea L.', 'binomial')).toBe('Pinus pinea');
  });

  it('si el nombre no casa, noAuthor y binomial devuelven el nombre recortado', () => {
    expect(ipniQuery('  quercus  ', 'noAuthor')).toBe('quercus');
    expect(ipniQuery('  quercus  ', 'binomial')).toBe('quercus');
  });
});

describe('ipniUrl', () => {
  it('empieza por https:// y consulta sin autor (variante medida: noAuthor)', () => {
    expect(IPNI_SEARCH_URL).toBe('https://www.ipni.org/search?q=');
    expect(IPNI_VARIANT).toBe('noAuthor');
    expect(ipniUrl('Pinus pinea L.')).toBe('https://www.ipni.org/search?q=Pinus%20pinea');
    expect(ipniUrl('Quercus ilex subsp. ballota (Desf.) Samp.')).toBe(
      'https://www.ipni.org/search?q=Quercus%20ilex%20subsp.%20ballota',
    );
    expect(ipniUrl(FULL)).toBe('https://www.ipni.org/search?q=Quercus%20ilex%20subsp.%20ballota');
    expect(ipniUrl('J. macrocarpa')).toBe('https://www.ipni.org/search?q=J.%20macrocarpa');
  });

  it('devuelve null si no es una cadena o queda vacía', () => {
    expect(ipniUrl(null)).toBeNull();
    expect(ipniUrl(undefined)).toBeNull();
    expect(ipniUrl('')).toBeNull();
    expect(ipniUrl('   ')).toBeNull();
    expect(ipniUrl(5)).toBeNull();
    expect(ipniUrl([])).toBeNull();
  });

  it('codifica &, #, ? y acentos', () => {
    const href = ipniUrl('A&B #1 ? ñá');
    const query = href.slice(IPNI_SEARCH_URL.length);
    expect(query).toBe('A%26B%20%231%20%3F%20%C3%B1%C3%A1');    expect(query).not.toMatch(/[&#? ]/);
  });
});
