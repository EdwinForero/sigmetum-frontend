import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { REVEAL, staggerDelay } from './reveal.js';
import tailwind from '../../tailwind.config.js';

const css = readFileSync('src/index.css', 'utf8');
const quitaComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, '');

// Reglas planas `selector { ... }` (también las de dentro de @layer y @media) sin comentarios.
const reglas = (texto) =>
  [...quitaComentarios(texto).matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)].map(([, selector, cuerpo]) => ({
    selector: selector.trim(),
    cuerpo,
  }));

describe('valores de la animación de aparición (A1, A2)', () => {
  it('fija los valores y respeta los límites de A2', () => {
    expect(REVEAL).toEqual({
      durationMs: 450,
      distancePx: 12,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      staggerMs: 60,
      maxStaggered: 6,
      threshold: 0,
      rootMargin: '0px 0px -10% 0px',
    });
    expect(REVEAL.distancePx).toBeLessThanOrEqual(12);
    expect(REVEAL.durationMs).toBeGreaterThanOrEqual(300);
    expect(REVEAL.durationMs).toBeLessThanOrEqual(600);
    expect(REVEAL.staggerMs).toBeLessThanOrEqual(80);
    expect(REVEAL.maxStaggered).toBeLessThanOrEqual(6);
    expect(REVEAL.threshold).toBe(0);
  });

  it('staggerDelay escalona de 60 en 60 ms con tope en el sexto elemento', () => {
    expect([0, 1, 2, 5, 6, 40].map(staggerDelay)).toEqual([0, 60, 120, 300, 300, 300]);
    expect(staggerDelay(-3)).toBe(0);
  });

  it('reveal.js es un módulo puro: sin JSX, sin importaciones y sin import.meta', () => {
    const codigo = quitaComentarios(readFileSync('src/config/reveal.js', 'utf8')).replace(/\/\/.*$/gm, '');

    expect(codigo).not.toMatch(/import\.meta|^\s*import |<\w+[^>]*>|react/m);
  });
});

describe('tailwind.config.js usa REVEAL', () => {
  const extend = tailwind.theme.extend;

  it('transitionDuration, transitionTimingFunction y page-fade salen de REVEAL', () => {
    expect(extend.transitionDuration.reveal).toBe('450ms');
    expect(extend.transitionTimingFunction.reveal).toBe(REVEAL.easing);
    expect(extend.keyframes['page-fade']).toEqual({ from: { opacity: '0' }, to: { opacity: '1' } });
    expect(extend.animation['page-fade']).toBe(`page-fade ${REVEAL.durationMs}ms ${REVEAL.easing}`);
  });

  it('page-fade no lleva fill-mode (nunca forwards ni both)', () => {
    expect(extend.animation['page-fade']).not.toMatch(/forwards|both|backwards/);
  });

  it('importa reveal.js con la extensión (Node no la resuelve sin ella)', () => {
    const codigo = readFileSync('tailwind.config.js', 'utf8');

    expect(codigo).toMatch(/from '\.\/src\/config\/reveal\.js'/);
  });
});

describe('reglas de CSS de la aparición', () => {
  const todas = reglas(css);
  const delSelector = (patron) => todas.filter(({ selector }) => patron.test(selector));

  it('.reveal-hidden: opacidad 0 y desplazamiento vertical del token stack-md (12 px)', () => {
    const [regla] = delSelector(/^\.reveal-hidden$/);

    expect(regla.cuerpo).toMatch(/opacity:\s*0/);
    expect(regla.cuerpo).toMatch(/transform:\s*translateY\(theme\('spacing\.stack-md'\)\)/);
    expect(parseFloat(tailwind.theme.extend.spacing['stack-md']) * 16).toBe(REVEAL.distancePx);
  });

  it('.reveal-in transiciona opacidad y transform con la duración y el easing de reveal', () => {
    const [regla] = delSelector(/^\.reveal-in$/);

    expect(regla.cuerpo).toMatch(/transition-property:\s*opacity,\s*transform/);
    expect(regla.cuerpo).toMatch(/theme\('transitionDuration\.reveal'\)/);
    expect(regla.cuerpo).toMatch(/theme\('transitionTimingFunction\.reveal'\)/);
  });

  it('solo .reveal-hidden declara transform y ninguna regla declara will-change', () => {
    const conTransform = todas.filter(({ cuerpo }) => /(^|[\s;])transform\s*:/.test(cuerpo));

    expect(conTransform.length).toBeGreaterThan(0);
    for (const { selector } of conTransform) expect(selector).toBe('.reveal-hidden');
    expect(quitaComentarios(css)).not.toMatch(/will-change/);
    expect(JSON.stringify(tailwind)).not.toMatch(/will-change|willChange/);
  });

  it('con movimiento reducido neutraliza .reveal-hidden y .reveal-in', () => {
    const bloque = quitaComentarios(css).match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?\})\s*\}/)?.[1] ?? '';
    const dentro = reglas(bloque);

    expect(dentro.find(({ selector }) => selector === '.reveal-hidden')?.cuerpo).toMatch(/opacity:\s*1[\s\S]*transform:\s*none/);
    expect(dentro.find(({ selector }) => selector === '.reveal-in')?.cuerpo).toMatch(/transition:\s*none/);
  });

  it('al imprimir, .reveal-hidden queda con opacidad 1 y sin transform', () => {
    const bloque = quitaComentarios(css).match(/@media print \{([\s\S]*?\})\s*\}/)?.[1] ?? '';
    const regla = reglas(bloque).find(({ selector }) => selector === '.reveal-hidden');

    expect(regla?.cuerpo).toMatch(/opacity:\s*1[\s\S]*transform:\s*none/);
  });
});
