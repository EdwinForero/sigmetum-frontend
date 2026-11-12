import { describe, it, expect } from 'vitest';
import { NOTICE_BASE, noticeVariant } from './noticeStyles';

const VARIANTES = ['info', 'success', 'warning', 'error'];

describe('noticeStyles', () => {
  it('la base común es la caja de aviso con relleno de 12 px', () => {
    expect(NOTICE_BASE).toBe('flex items-start gap-2 rounded-lg border p-stack-md');
  });

  it.each([
    ['info', 'border-moss', 'text-ink', 'info'],
    ['success', 'border-brand-deep', 'text-ink', 'check_circle'],
    ['warning', 'border-warning', 'text-ink', 'warning'],
    ['error', 'border-danger', 'text-danger', 'error'],
  ])('la variante %s usa borde %s, texto %s e icono %s sobre surface', (variante, borde, texto, icono) => {
    const { box, icon } = noticeVariant(variante);

    expect(box.split(' ')).toEqual(expect.arrayContaining([borde, 'bg-surface', texto]));
    expect(icon).toBe(icono);
  });

  it.each(VARIANTES)('la variante %s devuelve una clase de color para el icono', (variante) => {
    expect(noticeVariant(variante).iconClass).toMatch(/^text-/);
  });

  it('el icono de cada variante usa el color de su borde', () => {
    expect(noticeVariant('info').iconClass).toBe('text-moss');
    expect(noticeVariant('success').iconClass).toBe('text-brand-deep');
    expect(noticeVariant('warning').iconClass).toBe('text-warning');
    expect(noticeVariant('error').iconClass).toBe('text-danger');
  });

  it('ninguna clase usa hex sueltos ni colores por defecto de Tailwind', () => {
    const todas = VARIANTES.flatMap((v) => Object.values(noticeVariant(v))).join(' ');

    expect(todas).not.toMatch(/\[#|(gray|blue|red|green|yellow)-\d/);
    expect(NOTICE_BASE).not.toMatch(/\[#|(gray|blue|red|green|yellow)-\d/);
  });

  it('una variante desconocida cae en info', () => {
    expect(noticeVariant('otra')).toEqual(noticeVariant('info'));
  });
});
