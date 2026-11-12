import { describe, it, expect } from 'vitest';
import {
  flattenSpecies,
  sampleNames,
  normalizeName,
  classifyResult,
  buildGenusMap,
  expandGenus,
} from './ipniCheck';

describe('flattenSpecies', () => {
  it('aplana cadenas y arrays por comas, sin duplicados y ordenado', () => {
    const data = [
      { "Especies Características": 'Quercus ilex L., Pinus pinea L.' },
      { "Especies Características": ['Pinus pinea L.', ' J. macrocarpa '] },
      { "Especies Características": '' },
      { otro: 1 },
    ];
    expect(flattenSpecies(data)).toEqual(['J. macrocarpa', 'Pinus pinea L.', 'Quercus ilex L.']);
  });

  it('lanza un error claro si la forma no es un array', () => {
    expect(() => flattenSpecies({ a: 1 })).toThrow(/array/);
  });
});

describe('sampleNames', () => {
  const names = Array.from({ length: 100 }, (_, i) => `Genus${String(i).padStart(3, '0')} sp`);

  it('devuelve todo si la muestra no es menor', () => {
    expect(sampleNames(['A b', 'C d'], 5)).toEqual(['A b', 'C d']);
  });

  it('incluye hasta 5 abreviados y completa a intervalos regulares', () => {
    const abbreviated = Array.from({ length: 8 }, (_, i) => `${String.fromCharCode(65 + i)}. sp${i}`);
    const sample = sampleNames([...abbreviated, ...names].sort(), 20);
    expect(sample).toHaveLength(20);
    expect(sample.filter((n) => /^[A-Z]\.\s/.test(n))).toHaveLength(5);
    expect(new Set(sample).size).toBe(20);
  });

  it('sin abreviados muestrea a intervalos regulares', () => {
    const sample = sampleNames(names, 10);
    expect(sample).toHaveLength(10);
    expect(sample[0]).toBe(names[0]);
    expect(sample[1]).toBe(names[10]);
  });
});

describe('normalizeName', () => {
  it('quita autor, pasa a minúsculas y colapsa espacios', () => {
    expect(normalizeName('Quercus  ilex L. subsp. ballota (Desf.) Samp.')).toBe('quercus ilex subsp. ballota');
  });
});

describe('classifyResult', () => {
  it('exacto si el primer nombre coincide con el buscado normalizado', () => {
    expect(classifyResult('Quercus ilex L.', { totalResults: 3, results: [{ name: 'Quercus ilex' }] }))
      .toEqual({ status: 'exact', total: 3 });
  });
  it('aproximado si hay resultados pero el primero no coincide', () => {
    expect(classifyResult('Quercus ilex', { totalResults: 3, results: [{ name: 'Quercus ilexa' }] }))
      .toEqual({ status: 'approx', total: 3 });
  });
  it('cero si no hay resultados', () => {
    expect(classifyResult('Zzzxq qqqzx', { totalResults: 0, page: 1, totalPages: 0, perPage: 50 })).toEqual({ status: 'zero', total: 0 });
  });
  it('indeterminado si la respuesta no tiene la forma esperada', () => {
    expect(classifyResult('X y', null)).toEqual({ status: 'unknown', total: 0 });
    expect(classifyResult('X y', { foo: 1 })).toEqual({ status: 'unknown', total: 0 });
  });

  // Formas REALES de https://www.ipni.org/api/1/search (medidas el 12/11/2026). El valor devuelto es un
  // OBJETO { status, total }, no una cadena; status es 'exact' | 'approx' | 'zero' | 'unknown' (no 'approximate').
  describe('con la forma real de la API de IPNI', () => {
    const page = (totalResults, names) => ({
      totalResults,
      page: 1,
      totalPages: Math.ceil(totalResults / 50),
      perPage: 50,
      results: names.map((name) => ({ name, authors: 'L.', rank: 'spec.', url: '/n/296290-1' })),
      maxReturnedRecords: 10000,
      atEndOfMaxReturnedRecords: false,
    });

    it('devuelve un objeto con status y total, nunca una cadena', () => {
      const cls = classifyResult('Quercus ilex', page(157, ['Quercus ilex']));
      expect(typeof cls).toBe('object');
      expect(Object.keys(cls).sort()).toEqual(['status', 'total']);
      expect(['exact', 'approx', 'zero', 'unknown']).toContain(cls.status);
    });

    it('subespecie con un único resultado y el mismo nombre: exact', () => {
      expect(classifyResult('Quercus ilex subsp. ballota', page(1, ['Quercus ilex subsp. ballota'])))
        .toEqual({ status: 'exact', total: 1 });
    });

    it('binomio con 157 resultados cuyo primero coincide: exact', () => {
      expect(classifyResult('Quercus ilex', page(157, ['Quercus ilex', 'Quercus ilex'])))
        .toEqual({ status: 'exact', total: 157 });
    });

    it('Pinus pinea con el primer resultado Pinus pinea: exact', () => {
      expect(classifyResult('Pinus pinea', page(12, ['Pinus pinea']))).toEqual({ status: 'exact', total: 12 });
    });

    it('consulta Quercus ilex cuyo primer resultado es otro nombre: approx', () => {
      expect(classifyResult('Quercus ilex', page(3, ['Quercus ilexoides', 'Quercus ilex'])))
        .toEqual({ status: 'approx', total: 3 });
    });

    it('cero resultados sin la clave results: zero', () => {
      expect(classifyResult('Zzzxq qqqzx', {
        totalResults: 0,
        page: 1,
        totalPages: 0,
        perPage: 50,
        maxReturnedRecords: 10000,
        atEndOfMaxReturnedRecords: false,
      })).toEqual({ status: 'zero', total: 0 });
    });

    it('hay resultados pero results no es un array, o es una lista vacía: unknown / approx', () => {
      expect(classifyResult('Quercus ilex', { totalResults: 5 })).toEqual({ status: 'unknown', total: 0 });
      expect(classifyResult('Quercus ilex', { totalResults: 5, results: [] })).toEqual({ status: 'approx', total: 5 });
    });
  });
});

describe('expandGenus', () => {
  const map = buildGenusMap(['Quercus ilex', 'Pinus pinea', 'Pistacia lentiscus', 'J. macrocarpa']);
  it('expande la inicial si el género es único', () => {
    expect(expandGenus('Q. robur', map)).toBe('Quercus robur');
  });
  it('no expande si es ambiguo o desconocido', () => {
    expect(expandGenus('P. alba', map)).toBe('P. alba');
    expect(expandGenus('J. macrocarpa', map)).toBe('J. macrocarpa');
  });
  it('deja intactos los nombres sin abreviar', () => {
    expect(expandGenus('Quercus ilex', map)).toBe('Quercus ilex');
  });
});
