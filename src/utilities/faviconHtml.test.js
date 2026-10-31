import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { faviconTags, logoKeyFromSource } from './faviconHtml';
import ASSETS from '../config/assets';

const assetsSource = readFileSync(path.resolve(__dirname, '../config/assets.js'), 'utf8');
const indexHtml = readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

describe('faviconTags', () => {
  it('con URL y clave devuelve un link rel=icon sin type', () => {
    const tags = faviconTags('https://cdn.example.test', 'assets/logos/app-logo.jpg');
    expect(tags).toEqual([
      {
        tag: 'link',
        attrs: { rel: 'icon', href: 'https://cdn.example.test/assets/logos/app-logo.jpg' },
        injectTo: 'head',
      },
    ]);
    expect(tags[0].attrs).not.toHaveProperty('type');
  });

  it.each([[''], [undefined]])('sin URL (%s) no devuelve etiquetas', (s3Url) => {
    expect(faviconTags(s3Url, 'assets/logos/app-logo.jpg')).toEqual([]);
  });

  // El favicon exige https:// (docs/guias/seguridad.md prohíbe enlaces externos http://).
  // Se compara de forma estricta y en minúsculas, igual que la regla de la guía: 'HTTPS://' se
  // trata como no válida (es más simple y el valor desplegado lo escribe infra en minúsculas).
  it.each([
    ['http://cdn.test'],
    ['//cdn.test'],
    ['cdn.test'],
    [' https://cdn.test'],
    ['HTTPS://cdn.test'],
  ])('con una URL que no empieza por https:// (%s) no devuelve etiquetas', (s3Url) => {
    expect(faviconTags(s3Url, 'assets/logos/app-logo.jpg')).toEqual([]);
  });

  it('con https:// y barra final emite sin normalizar la barra', () => {
    const tags = faviconTags('https://cdn.test/', 'assets/logos/app-logo.jpg');
    expect(tags[0].attrs.href).toBe('https://cdn.test//assets/logos/app-logo.jpg');
  });
});

describe('logoKeyFromSource', () => {
  it('extrae la clave igual que ASSETS.LOGO (y no confunde LOGOS)', () => {
    expect(logoKeyFromSource(assetsSource)).toBe(ASSETS.LOGO);
  });

  it('acepta comillas dobles', () => {
    expect(logoKeyFromSource('const A = {\n  LOGO: "a/b.png",\n  LOGOS: { X: "z" },\n};')).toBe('a/b.png');
  });

  it('lanza error si la fuente no tiene LOGO', () => {
    expect(() => logoKeyFromSource('const A = { LOGOS: { UMA: "x" } };')).toThrow();
  });
});

describe('index.html', () => {
  it('no fija ningún favicon ni bucket ni marcador %VITE_', () => {
    expect(indexHtml).not.toContain('s3-sigmetumtest');
    expect(indexHtml).not.toContain('rel="icon"');
    expect(indexHtml).not.toContain('%VITE_');
  });
});
