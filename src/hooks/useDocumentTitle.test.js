import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import i18n from '../i18n';
import es from '../languages/es/translation.json';
import en from '../languages/en/translation.json';
import useDocumentTitle, { PAGE_TITLE_KEYS } from './useDocumentTitle';

// Usa i18n real (no la mock global de t, que devuelve la clave): hace falta para probar el cambio de idioma.
vi.mock('react-i18next', async (importOriginal) => await importOriginal());

const SUFFIX = ' · SIGMETUM-A';
const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj);

const Probe = () => {
  useDocumentTitle();
  return null;
};

const renderAt = (ruta) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Probe />
    </MemoryRouter>
  );

const EXPECTED = [
  ['/', 'navbar.homeOption'],
  ['/explorar', 'navbar.exploreOption'],
  ['/sobre-nosotros', 'aboutUs.title'],
  ['/login', 'login.title'],
  ['/galeria', 'gallery.title'],
  ['/cookies', 'cookies.title'],
  ['/cargar-archivos', 'uploadFiles.title'],
  ['/administrar-contenido', 'contentManagement.title'],
  ['/administrar-datos', 'dataManagement.title'],
];

describe('useDocumentTitle', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
    document.title = '';
  });

  it.each(EXPECTED)('la ruta %s usa la clave %s', (ruta, clave) => {
    expect(get(es, clave)).toBeTruthy();
    expect(get(en, clave)).toBeTruthy();

    renderAt(ruta);

    expect(document.title).toBe(`${get(es, clave)}${SUFFIX}`);
  });

  it('una ruta desconocida usa notFound.title', () => {
    renderAt('/ruta-que-no-existe');

    expect(document.title).toBe(`${es.notFound.title}${SUFFIX}`);
  });

  it('tolera mayúsculas y barra final', () => {
    renderAt('/Explorar/');

    expect(document.title).toBe(`${es.navbar.exploreOption}${SUFFIX}`);
  });

  it('cambia con el idioma sin remontar', async () => {
    renderAt('/explorar');
    expect(document.title).toBe(`${es.navbar.exploreOption}${SUFFIX}`);

    await act(() => i18n.changeLanguage('en'));

    expect(document.title).toBe(`${en.navbar.exploreOption}${SUFFIX}`);
  });

  it('una ruta protegida que redirige a /login muestra el título de login', () => {
    render(
      <MemoryRouter initialEntries={['/cargar-archivos']}>
        <Probe />
        <Routes>
          <Route path="/cargar-archivos" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={null} />
        </Routes>
      </MemoryRouter>
    );

    expect(document.title).toBe(`${es.login.title}${SUFFIX}`);
  });

  it('App.js llama al hook y todas sus rutas tienen título', () => {
    const fuente = readFileSync(path.resolve(__dirname, '../App.js'), 'utf8');
    const rutas = [...fuente.matchAll(/<Route[^>]*\spath="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((ruta) => ruta !== '*');

    expect(rutas.length).toBeGreaterThan(0);
    expect(rutas.filter((ruta) => !(ruta in PAGE_TITLE_KEYS))).toEqual([]);
    expect(fuente).toContain('useDocumentTitle()');
  });
});
