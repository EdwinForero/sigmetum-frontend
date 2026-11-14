import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { NAV_HEIGHT_PX } from './layout.js';
import tailwind from '../../tailwind.config.js';

const leer = (ruta) => readFileSync(ruta, 'utf8');

describe('layout: altura de la barra inferior (NAV_HEIGHT_PX)', () => {
  it('vale 72 px', () => {
    expect(NAV_HEIGHT_PX).toBe(72);
  });

  it('el token de espaciado nav de Tailwind sale de la constante y vale 4.5rem', () => {
    const nav = tailwind.theme.extend.spacing.nav;
    expect(nav).toBe(`${NAV_HEIGHT_PX / 16}rem`);
    expect(nav).toBe('4.5rem');
  });

  it('tailwind.config.js importa NAV_HEIGHT_PX con extensión .js', () => {
    const config = leer('tailwind.config.js');
    expect(config).toContain('NAV_HEIGHT_PX');
    expect(config).toMatch(/from '\.\/src\/config\/layout\.js'/);
    expect(config).not.toContain("nav: '4.5rem'");
  });

  it('InfoButton.js usa la constante y no repite el literal 72', () => {
    const infoButton = leer('src/components/InfoButton.js');
    expect(infoButton).toContain('NAV_HEIGHT_PX');
    expect(infoButton).not.toMatch(/\b72\b/);
  });

  it('layout.js es un módulo puro: sin importaciones ni JSX', () => {
    const codigo = leer('src/config/layout.js').replace(/\/\/.*$/gm, '');
    expect(codigo).not.toMatch(/\bimport\b/);
    expect(codigo).not.toMatch(/<[A-Za-z]/);
  });
});
