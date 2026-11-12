// Lógica pura de scripts/ipni-check.mjs (comprobación manual de las variantes de consulta a IPNI).
// Vive en src/ porque Vitest solo recoge src/**; el script es un envoltorio fino con red.
import { ipniQuery } from './ipniUrl.js';

const ABBREVIATED = /^[A-Z]\.\s/;

// Aplana `Especies Características` (cadena o array, separadas por comas), sin duplicados y ordenado.
export const flattenSpecies = (data) => {
  if (!Array.isArray(data)) {
    throw new Error('Se esperaba un array de especies en `data`, pero la respuesta tiene otra forma.');
  }
  const names = new Set();
  data.forEach((species) => {
    const value = species?.['Especies Características'];
    const parts = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
    parts.forEach((part) => {
      if (typeof part !== 'string') return;
      part.split(',').forEach((piece) => {
        const name = piece.trim();
        if (name) names.add(name);
      });
    });
  });
  return [...names].sort();
};

// Hasta 5 nombres abreviados (`J. macrocarpa`); el resto, a intervalos regulares entre los no abreviados.
export const sampleNames = (names, size) => {
  if (names.length <= size) return [...names];
  const abbreviated = names.filter((n) => ABBREVIATED.test(n)).slice(0, 5);
  const rest = names.filter((n) => !ABBREVIATED.test(n));
  const count = Math.min(size - abbreviated.length, rest.length);
  const picked = Array.from({ length: count }, (_, i) => rest[Math.floor((i * rest.length) / count)]);
  return [...abbreviated, ...picked].sort();
};

export const normalizeName = (name) => ipniQuery(name, 'noAuthor').toLowerCase().replace(/\s+/g, ' ');

// response: JSON de la API de IPNI. Con resultados: { totalResults, page, totalPages, perPage, results: [{ name, authors, rank, url }] };
// con cero resultados NO trae `results`: { totalResults: 0, page: 1, totalPages: 0, perPage: 50, ... }.
// Devuelve un OBJETO { status, total } (no una cadena): status es 'exact' | 'approx' | 'zero' | 'unknown'
// ('approx', no 'approximate'; son las claves que el script usa para contar). `exact` compara results[0].name
// (sin autor) con el nombre buscado, ambos normalizados con normalizeName.
export const classifyResult = (searched, response) => {
  if (!response || typeof response.totalResults !== 'number') {
    return { status: 'unknown', total: 0 };
  }
  const total = response.totalResults;
  if (total === 0) return { status: 'zero', total };
  if (!Array.isArray(response.results)) return { status: 'unknown', total: 0 };
  const first = response.results[0]?.name;
  const exact = typeof first === 'string' && normalizeName(first) === normalizeName(searched);
  return { status: exact ? 'exact' : 'approx', total };
};

// Inicial -> conjunto de géneros del dataset (solo nombres sin abreviar).
export const buildGenusMap = (names) => {
  const map = new Map();
  names.forEach((name) => {
    const match = /^([A-Z][A-Za-z-]+)\s/.exec(name);
    if (!match) return;
    const initial = match[1][0];
    if (!map.has(initial)) map.set(initial, new Set());
    map.get(initial).add(match[1]);
  });
  return map;
};

// `Q. robur` -> `Quercus robur` si la inicial tiene un único género en el dataset; si es ambigua, no se expande.
export const expandGenus = (name, genusMap) => {
  const match = /^([A-Z])\.\s+(.*)$/.exec(name.trim());
  if (!match) return name;
  const genera = genusMap.get(match[1]);
  return genera && genera.size === 1 ? `${[...genera][0]} ${match[2]}` : name;
};
