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
  it('define los 9 colores y la altura de la barra de navegación', () => {
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
    });
    expect(config.theme.extend.spacing).toMatchObject({ nav: '4.5rem' });
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
