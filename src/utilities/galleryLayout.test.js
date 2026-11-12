import { describe, it, expect } from 'vitest';
import { GALLERY_MAX_CELL, GALLERY_GAP, galleryColumns, splitInColumns } from './galleryLayout';

describe('galleryColumns', () => {
  it('las constantes son 200 px de celda máxima y 12 px de hueco', () => {
    expect(GALLERY_MAX_CELL).toBe(200);
    expect(GALLERY_GAP).toBe(12);
  });

  it.each([
    [343, 2],
    [705, 4],
    [945, 5],
    [1361, 7],
    [1841, 9],
  ])('con %i px hay %i columnas', (width, columns) => {
    expect(galleryColumns(width)).toBe(columns);
  });

  it.each([0, -50, NaN])('con %s no baja de una columna', (width) => {
    expect(galleryColumns(width)).toBe(1);
  });

  it('la celda resultante nunca pasa de 200 px', () => {
    for (let width = 100; width <= 2400; width += 7) {
      const n = galleryColumns(width);
      expect((width - (n - 1) * GALLERY_GAP) / n).toBeLessThanOrEqual(GALLERY_MAX_CELL);
    }
  });
});

describe('splitInColumns', () => {
  const numbers = (count) => Array.from({ length: count }, (_, i) => i + 1);

  it('reparte en bloques contiguos equilibrados: las primeras N % n columnas llevan una más', () => {
    const columns = splitInColumns(numbers(7), 3);

    expect(columns.map((column) => column.items)).toEqual([[1, 2, 3], [4, 5], [6, 7]]);
    expect(columns.map((column) => column.start)).toEqual([0, 3, 5]);
  });

  it('el orden concatenado es el de los datos y start es el índice del primer elemento', () => {
    const items = numbers(23);
    const columns = splitInColumns(items, 6);

    expect(columns.flatMap((column) => column.items)).toEqual(items);
    columns.forEach((column) => expect(items[column.start]).toBe(column.items[0]));
  });

  it('con 8 fotos y 7 columnas no queda ninguna vacía', () => {
    const columns = splitInColumns(numbers(8), 7);

    expect(columns).toHaveLength(7);
    expect(columns.map((column) => column.items.length)).toEqual([2, 1, 1, 1, 1, 1, 1]);
  });

  it('omite las columnas vacías cuando hay menos elementos que columnas', () => {
    const columns = splitInColumns(numbers(2), 9);

    expect(columns).toEqual([
      { start: 0, items: [1] },
      { start: 1, items: [2] },
    ]);
  });

  it('sin elementos no devuelve columnas', () => {
    expect(splitInColumns([], 4)).toEqual([]);
  });

  it('no muta la lista de entrada', () => {
    const items = Object.freeze(numbers(5));

    expect(() => splitInColumns(items, 2)).not.toThrow();
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});
