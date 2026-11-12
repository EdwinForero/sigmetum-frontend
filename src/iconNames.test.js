import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const html = readFileSync(join(raiz, 'index.html'), 'utf8');

const listaDeIndexHtml = () => {
  const href = html.match(/family=Material\+Symbols\+Outlined[^"]*/)?.[0] ?? '';
  const lista = href.match(/icon_names=([a-z_0-9,]+)/)?.[1];
  return { href, nombres: lista ? lista.split(',') : [] };
};

const archivosFuente = (dir) =>
  readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivosFuente(ruta);
    return ruta.endsWith('.js') && !ruta.endsWith('.test.js') ? [ruta] : [];
  });

// Iconos que salen de una expresión y no de un literal junto a la clase.
const DINAMICOS = ['check_circle', 'error', 'visibility', 'visibility_off', 'progress_activity'];

const nombresUsados = () => {
  const usados = new Set(DINAMICOS);
  for (const archivo of archivosFuente(join(raiz, 'src'))) {
    const codigo = readFileSync(archivo, 'utf8');
    for (const m of codigo.matchAll(/icon[=:]\s*\{?['"]([a-z_0-9]+)['"]/g)) usados.add(m[1]);
    for (const m of codigo.matchAll(/material-symbols-outlined[^>]*>\s*([a-z_0-9]+)\s*</g)) usados.add(m[1]);
  }
  return usados;
};

describe('icon_names de index.html', () => {
  const { href, nombres } = listaDeIndexHtml();

  it('existe, está ordenada y sin repetir', () => {
    expect(nombres.length).toBeGreaterThan(0);
    expect(nombres).toEqual([...new Set(nombres)].sort());
  });

  it('incluye todos los iconos que usa el código, más upload_file', () => {
    const faltan = [...nombresUsados(), 'upload_file'].filter((n) => !nombres.includes(n));
    expect(faltan).toEqual([]);
  });

  it('no lista iconos que nadie usa', () => {
    const usados = nombresUsados();
    usados.add('upload_file');
    expect(nombres.filter((n) => !usados.has(n))).toEqual([]);
  });

  it('usa display=block', () => {
    expect(href).toContain('display=block');
  });

  it('precarga las dos orígenes con crossorigin y no pide Mukta Malar', () => {
    expect(html).toMatch(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"\s*\/?>/);
    expect(html).toMatch(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin\s*\/?>/);
    expect(html).not.toContain('Mukta');
  });
});
