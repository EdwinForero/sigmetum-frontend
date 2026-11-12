import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import config from '../tailwind.config.js';

const channel = (value) => {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const colors = config.theme.extend.colors ?? {};
const white = '#FFFFFF';

describe('tokens de color y espaciado', () => {
  it('define los 12 colores y los 12 valores de espaciado con nombre propio', () => {
    expect(colors).toMatchObject({
      brand: '#15B659',
      'brand-dark': '#0e9447',
      'brand-deep': '#0B7A3B',
      surface: '#F9FBFA',
      ink: '#0C1811',
      'ink-soft': '#14281D',
      sage: '#99BBA8',
      moss: '#4B644A',
      danger: '#B42318',
      forest: '#0F3D2A',
      'sage-soft': '#EAF3EE',
      warning: '#8A5300',
    });
    expect(Object.keys(colors)).toHaveLength(12);
    expect(config.theme.extend.spacing).toEqual({
      nav: '4.5rem',
      gutter: '1rem',
      'gutter-md': '1.5rem',
      'gutter-lg': '2rem',
      'stack-xs': '0.25rem',
      'stack-sm': '0.5rem',
      'stack-md': '0.75rem',
      stack: '1rem',
      'stack-lg': '1.5rem',
      'stack-xl': '2rem',
      section: '3rem',
      'section-lg': '4rem',
    });
  });

  it('no redefine las escalas por defecto que usan las páginas privadas', () => {
    expect(config.theme.spacing).toBeUndefined();
    expect(config.theme.fontSize).toBeUndefined();
    expect(config.theme.borderRadius).toBeUndefined();
  });

  it.each([
    ['brand-deep', colors['brand-deep'], colors.surface],
    ['brand-deep', colors['brand-deep'], white],
    ['ink', colors.ink, colors.brand],
    ['ink', colors.ink, colors['brand-dark']],
    ['moss', colors.moss, colors.surface],
    ['danger', colors.danger, colors.surface],
    ['danger', colors.danger, white],
    ['ink', colors.ink, colors.surface],
  ])('el contraste de %s sobre %s cumple 4,5:1', (_nombre, primero, segundo) => {
    expect(ratio(primero, segundo)).toBeGreaterThanOrEqual(4.5);
  });

  it('el contraste de brand-dark sobre surface cumple 3:1 (iconos y bordes)', () => {
    expect(ratio(colors['brand-dark'], colors.surface)).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ['forest', colors.forest],
    ['ink', colors.ink],
    ['ink-soft', colors['ink-soft']],
  ])('el contraste de %s sobre sage-soft cumple 10:1', (_nombre, color) => {
    expect(ratio(color, colors['sage-soft'])).toBeGreaterThanOrEqual(10);
  });

  it.each([
    ['surface', colors.surface],
    ['blanco', white],
  ])('el contraste de warning sobre %s cumple 4,5:1', (_nombre, fondo) => {
    expect(ratio(colors.warning, fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('surface sobre ink al 70 % mezclado con blanco (peor caso del hero) cumple 4,5:1', () => {
    const mezcla = '#' + [1, 3, 5]
      .map((i) => Math.round(parseInt(colors.ink.slice(i, i + 2), 16) * 0.7 + 255 * 0.3))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');
    expect(ratio(colors.surface, mezcla)).toBeGreaterThanOrEqual(4.5);
  });

  it('la fórmula coincide con los dos valores que documenta DESIGN.md', () => {
    expect(ratio('#0C1811', '#F9FBFA')).toBeCloseTo(17.5, 1);
    expect(ratio('#15B659', '#F9FBFA')).toBeCloseTo(2.57, 2);
  });
});

describe('foco no tapado (WCAG 2.4.11)', () => {
  const css = readFileSync('src/index.css', 'utf8');
  const start = css.indexOf('html {');
  const html = start === -1 ? '' : css.slice(start, css.indexOf('}', start));
  const rem = (property) => Number(html.match(new RegExp(property + ': *([0-9.]+)rem'))?.[1]);

  it('scroll-padding-top deja libre la cabecera de 64 px (4rem) con margen', () => {
    expect(rem('scroll-padding-top')).toBeGreaterThan(4);
  });

  // Medido con Playwright a 320 px: el banner compacto + la barra inferior (4,5rem) deben caber en este margen.
  it('scroll-padding-bottom deja libres la barra inferior (4,5rem) y el banner sticky compacto (>= 20rem)', () => {
    expect(rem('scroll-padding-bottom')).toBeGreaterThanOrEqual(20);
  });
});

describe('base tipográfica y contenedor común', () => {
  const css = readFileSync('src/index.css', 'utf8');
  const indexHtml = readFileSync('index.html', 'utf8');

  it('index.html pide exactamente Amaranth 700 (normal y cursiva) y Sen 400 y 700', () => {
    const url = indexHtml.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?family=Amaranth[^"]+)"/)?.[1];
    expect(url).toBeDefined();
    expect(url).toContain('family=Amaranth:ital,wght@0,700;1,700&family=Sen:wght@400;700');
    expect(url).not.toMatch(/Sen:wght@400\.\.800/);
  });

  it('el cuerpo usa Sen y la regla de Sen incluye textarea y select', () => {
    expect(css).toMatch(/body \{\s*@apply font-secondary;/);
    expect(css).toMatch(/p, button, a, label, span, button, input, textarea, select, td, li \{\s*@apply font-secondary;/);
  });

  it('define .page-container con los márgenes de los tokens', () => {
    expect(css).toMatch(/\.page-container \{\s*@apply mx-auto w-full max-w-6xl px-gutter md:px-gutter-md lg:px-gutter-lg;\s*\}/);
  });
});

describe('hero de Home: velo sobre la foto', () => {
  const mezclaConBlanco = (hex, alfa) =>
    '#' + [1, 3, 5]
      .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * alfa + 255 * (1 - alfa)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');

  it('el literal rgba del velo de ImageComponent es el RGB de ink al 0,7', () => {
    const codigo = readFileSync('src/components/ImageComponent.js', 'utf8');
    const [, r, g, b, a] = codigo.match(/rgba\((\d+), (\d+), (\d+), ([0-9.]+)\)/) ?? [];
    const esperado = [1, 3, 5].map((i) => parseInt(colors.ink.slice(i, i + 2), 16));
    expect([Number(r), Number(g), Number(b)]).toEqual(esperado);
    expect(Number(a)).toBe(0.7);
    expect(codigo).toMatch(/un estilo en línea no admite clases/);
  });

  // Peor caso: foto blanca. Con el velo uniforme (ink al 70 %) el texto cumple; el degradado lateral
  // from-ink/85 via-ink/65 to-ink/25 deja el texto sobre un 25 % de ink en móvil (el texto ocupa todo el ancho)
  // y sobre ~55 % a 1440 px (el titular llega al 63 % del ancho): no llega a 4,5:1, así que el hero no lo usa.
  it.each([
    ['uniforme 70 %', 0.7, true],
    ['degradado lateral, punto más claro del texto en móvil (25 %)', 0.25, false],
    ['degradado lateral, borde derecho del titular a 1440 px (~55 %)', 0.55, false],
  ])('surface sobre el velo %s: cumple 4,5:1 = %s', (_nombre, alfa, cumple) => {
    expect(ratio(colors.surface, mezclaConBlanco(colors.ink, alfa)) >= 4.5).toBe(cumple);
  });
});

describe('estados inactivos: una sola gramática (borde discontinuo moss, sin opacity)', () => {
  const principal = readFileSync('src/components/ButtonPrincipal.js', 'utf8');
  const alternativo = readFileSync('src/components/ButtonAlternative.js', 'utf8');
  const linea = (codigo, nombre) => codigo.split('\n').find((l) => l.includes(`export const ${nombre} =`)) ?? '';

  it.each(['ICON_BUTTON_INACTIVE_CLASS', 'BUTTON_INACTIVE_CLASS'])('%s es discontinua, en moss y sin hover', (nombre) => {
    const definicion = linea(principal, nombre);

    expect(definicion).toMatch(/border-2 .*border-dashed border-moss .*text-moss/);
    expect(definicion).not.toMatch(/hover:|opacity/);
  });

  it('ButtonPrincipal y ButtonAlternative ya no usan opacity-50 para indicar el estado inactivo', () => {
    expect(principal).not.toMatch(/opacity-50/);
    expect(alternativo).not.toMatch(/opacity-50/);
    expect(alternativo).toMatch(/BUTTON_INACTIVE_CLASS/);
  });

  it('Sidebar: Cerrar sesión desactivado es discontinuo en moss, sin hover y sin opacity-50', () => {
    const barra = readFileSync('src/components/Sidebar.js', 'utf8');

    expect(barra).not.toMatch(/opacity-50/);
    expect(barra).toMatch(/disabled:border-2 disabled:border-dashed disabled:border-moss disabled:text-moss disabled:hover:bg-transparent/);
  });

  // De caracterización: el contraste de moss sobre surface ya está comprobado arriba; esto añade el blanco.
  it('moss sobre blanco cumple 4,5:1', () => {
    expect(ratio(colors.moss, white)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('galería: velo con el nombre de la foto', () => {
  const galeria = readFileSync('src/pages/VegetationGallery.js', 'utf8');

  // El contraste de surface sobre ink al 70 % ya está comprobado arriba (hero de Home): aquí solo se
  // exige que la galería use esos mismos tokens y no un color suelto.
  it('usa bg-ink/70 con text-surface y ningún hex', () => {
    expect(galeria).toMatch(/bg-ink\/70/);
    expect(galeria).toMatch(/text-surface/);
    expect(galeria).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });
});
