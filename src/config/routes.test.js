import { describe, it, expect } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import { normalizePath } from './routes';

// Versión anterior (cuadrática con barras finales y con toLowerCase de Unicode completo), solo para comparar.
const decodeOld = (pathname) => {
  try {
    return pathname.split('/').map((segment) => decodeURIComponent(segment).replace(/\//g, '%2F')).join('/');
  } catch {
    return pathname;
  }
};
const normalizeOld = (pathname) => decodeOld(pathname).replace(/\/+$/, '').toLowerCase() || '/';

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
    ['/%45xplore', '/explore'],
    ['/%45XPLORE/', '/explore'],
    ['/manage-d%61ta', '/manage-data'],
    ['/%E0%A4%A', '/%e0%a4%a'],
    ['/a%2Fb', '/a%2fb'],
  ])('normalizePath(%j) da %j', (entrada, esperado) => {
    expect(normalizePath(entrada)).toBe(esperado);
  });

  it('da lo mismo que la versión anterior en una tabla de casos ASCII', () => {
    const casos = ['/explore', '/EXPLORE///', '/', '//', '', '///', '/a//b//', '/%45xplore/', '/a%2Fb/', '/%E0%A4%A', '/Ab-Cd_9/', 'x', 'X//'];

    for (const caso of casos) expect(normalizePath(caso), caso).toBe(normalizeOld(caso));
  });

  it('solo pasa a minúsculas las letras ASCII: el signo Kelvin no se convierte en «k» (como React Router)', () => {
    const kelvin = '\u212A';
    const entrada = `/coo${encodeURIComponent(kelvin)}ies`;

    expect(entrada).toBe('/coo%E2%84%AAies');
    expect(normalizePath(entrada)).toBe(`/coo${kelvin}ies`);
    expect(normalizePath(entrada)).not.toBe('/cookies');
    expect(normalizePath(`/COO${kelvin}IES`)).toBe(`/coo${kelvin}ies`);
    expect(normalizeOld(entrada)).toBe('/cookies');
  });

  it('coincide con React Router en el caso Kelvin y en las mayúsculas ASCII', () => {
    const rutas = [{ path: '/cookies' }];
    const router = (pathname) => matchRoutes(rutas, pathname) !== null;
    const kelvin = '/coo%E2%84%AAies';

    expect(router(kelvin)).toBe(false);
    expect(normalizePath(kelvin) === '/cookies').toBe(false);
    expect(router('/COOKIES/')).toBe(true);
    expect(normalizePath('/COOKIES/') === '/cookies').toBe(true);
  });

  it('recorta miles de barras finales en tiempo lineal (30 000 barras + «a» en menos de 50 ms)', () => {
    const entrada = `/a${'/'.repeat(30000)}a`;
    const salida = `/a${'/'.repeat(30000)}`;
    const inicio = performance.now();

    expect(normalizePath(entrada)).toBe(`/a${'/'.repeat(30000)}a`);
    expect(normalizePath(salida)).toBe('/a');
    expect(normalizePath(`${'/'.repeat(30000)}a`)).toBe(`${'/'.repeat(30000)}a`);
    expect(normalizePath(`/a${'/'.repeat(30000)}`)).toBe('/a');
    expect(performance.now() - inicio).toBeLessThan(50);
  });
});
