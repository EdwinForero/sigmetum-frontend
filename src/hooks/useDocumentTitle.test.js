import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import i18n from '../i18n';
import es from '../languages/es/translation.json';
import en from '../languages/en/translation.json';
import useDocumentTitle, { PAGE_TITLE_KEYS, titleKeyFor } from './useDocumentTitle';
import { LEGACY_REDIRECTS } from '../config/routes';

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
  ['/explore', 'navbar.exploreOption'],
  ['/about-us', 'aboutUs.title'],
  ['/login', 'login.title'],
  ['/gallery', 'gallery.title'],
  ['/cookies', 'cookies.title'],
  ['/upload-files', 'uploadFiles.title'],
  ['/manage-data', 'dataManagement.title'],
  ['/manage-terms', 'contentManagement.noLatinTermsTitle'],
  ['/manage-gallery', 'contentManagement.galleryManagementTitle'],
  ['/manage-recipients', 'contactRecipients.title'],
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

  it.each(Object.entries(LEGACY_REDIRECTS))(
    'la ruta antigua %s resuelve el título de su destino %s (también con barra final y en mayúsculas)',
    (antigua, nueva) => {
      expect(titleKeyFor(antigua)).toBe(titleKeyFor(nueva));
      expect(titleKeyFor(`${antigua}/`)).toBe(titleKeyFor(nueva));
      expect(titleKeyFor(antigua.toUpperCase())).toBe(titleKeyFor(nueva));
      expect(titleKeyFor(antigua)).not.toBe('notFound.title');
    }
  );

  it('/administrar-contenido/ muestra el título de /manage-terms mientras redirige', () => {
    expect(titleKeyFor('/administrar-contenido/')).toBe('contentManagement.noLatinTermsTitle');
    renderAt('/administrar-contenido/');

    expect(document.title).toBe(`${es.contentManagement.noLatinTermsTitle}${SUFFIX}`);
  });

  it('una ruta desconocida usa notFound.title', () => {
    renderAt('/ruta-que-no-existe');

    expect(document.title).toBe(`${es.notFound.title}${SUFFIX}`);
  });

  it('tolera mayúsculas y barra final', () => {
    renderAt('/Explore/');

    expect(document.title).toBe(`${es.navbar.exploreOption}${SUFFIX}`);
  });

  it('cambia con el idioma sin remontar', async () => {
    renderAt('/explore');
    expect(document.title).toBe(`${es.navbar.exploreOption}${SUFFIX}`);

    await act(() => i18n.changeLanguage('en'));

    expect(document.title).toBe(`${en.navbar.exploreOption}${SUFFIX}`);
  });

  it('una ruta protegida que redirige a /login muestra el título de login', () => {
    render(
      <MemoryRouter initialEntries={['/upload-files']}>
        <Probe />
        <Routes>
          <Route path="/upload-files" element={<Navigate to="/login" replace />} />
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
