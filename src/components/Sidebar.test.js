import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({ default: { logout: vi.fn() } }));

import api from '../services/api';
import Sidebar from './Sidebar';

const menuOptions = [
  { id: 'filter', name: 'Filtros', icon: 'filter_alt', titleId: 'filtros-titulo', component: <><h2 id="filtros-titulo">Título del panel</h2><button type="button">dentro-del-panel</button></> },
  { id: 'dataManagement', name: 'Datos', icon: 'database', link: '/manage-data' },
  { id: 'manageTerms', name: 'Términos', icon: 'text_fields', link: '/manage-terms' },
  { id: 'manageGallery', name: 'Galería', icon: 'photo_library', link: '/manage-gallery' },
  { id: 'manageRecipients', name: 'Destinatarios', icon: 'contact_mail', link: '/manage-recipients' },
  { id: 'uploadFiles', name: 'Cargar', icon: 'upload', link: '/upload-files' },
];

const renderSidebar = (path = '/manage-data', props = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <button type="button">antes</button>
      <Sidebar exploreData={[]} menuOptions={menuOptions} {...props} />
    </MemoryRouter>
  );

describe('Sidebar', () => {
  beforeEach(() => {
    api.logout.mockClear();
  });

  it('la navegación tiene nombre y cada destino es un enlace con el nombre de su opción, sin botón dentro', () => {
    const { container } = renderSidebar();

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Datos' })).toHaveAttribute('href', '/manage-data');
    expect(screen.getByRole('link', { name: 'Términos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargar' })).toBeInTheDocument();
    expect(container.querySelectorAll('a button')).toHaveLength(0);
  });

  it('solo el destino activo lleva aria-current="page"', () => {
    renderSidebar('/manage-data');

    expect(screen.getByRole('link', { name: 'Datos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Cargar' })).not.toHaveAttribute('aria-current');
  });

  it('fuera de /explore muestra solo las opciones con enlace, en orden: Datos, Términos, Galería, Destinatarios, Cargar, Cerrar sesión', () => {
    renderSidebar('/manage-data', { showLogout: true });
    const nav = screen.getByRole('navigation', { name: 'privateNav.label' });

    const labels = [...nav.querySelectorAll('li')].map((li) => li.querySelector('span:not(.material-symbols-outlined)').textContent);
    expect(labels).toEqual(['Datos', 'Términos', 'Galería', 'Destinatarios', 'Cargar', 'login.logOutButton']);
    expect(screen.queryByRole('button', { name: 'Filtros' })).toBeNull();
  });

  it.each(['/upload-files', '/manage-data', '/manage-terms', '/manage-gallery', '/manage-recipients', '/gallery'])(
    'en %s hay cinco enlaces y ningún botón de Filtros',
    (path) => {
      renderSidebar(path);

      expect(screen.getAllByRole('link')).toHaveLength(5);
      expect(screen.queryByRole('button', { name: 'Filtros' })).toBeNull();
    }
  );

  it('Términos, Galería y Destinatarios llevan tres iconos distintos', () => {
    renderSidebar('/manage-terms');
    const iconOf = (name) => screen.getByRole('link', { name }).querySelector('.material-symbols-outlined').textContent;

    const icons = [iconOf('Términos'), iconOf('Galería'), iconOf('Destinatarios')];
    expect(icons).toEqual(['text_fields', 'photo_library', 'contact_mail']);
    expect(new Set(icons).size).toBe(3);
  });

  it('en /manage-gallery solo la galería lleva aria-current', () => {
    renderSidebar('/manage-gallery');

    expect(screen.getByRole('link', { name: 'Galería' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter((a) => a.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('en /explore solo aparece Filtros, sin ningún enlace de gestión', () => {
    renderSidebar('/explore');

    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('en /explore sin datos (exploreData ausente) no aparece Filtros ni nada más', () => {
    renderSidebar('/explore', { exploreData: undefined });

    expect(screen.queryByRole('button', { name: 'Filtros' })).toBeNull();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('la barra desplaza su contenido en escritorio (md:overflow-y-auto) para alcanzar Cerrar sesión con poca altura', () => {
    renderSidebar('/manage-data', { showLogout: true });

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toHaveClass('md:overflow-y-auto');
  });

  it('Filtros es un botón con aria-expanded y aria-controls que apunta al panel', async () => {
    const user = userEvent.setup();
    renderSidebar('/explore');
    const button = screen.getByRole('button', { name: 'Filtros' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(button.getAttribute('aria-controls'))).toBe(screen.getByRole('dialog', { name: 'Título del panel' }));
  });

  it('con el panel cerrado su contenido no es visible ni accesible (hidden; el Tab real se mide con Playwright)', () => {
    renderSidebar('/explore');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'dentro-del-panel' })).toBeNull();
    expect(screen.getByText('dentro-del-panel')).not.toBeVisible();
  });

  it('al abrir, el foco entra en el dialog; Escape lo cierra y el foco vuelve a Filtros', async () => {
    const user = userEvent.setup();
    renderSidebar('/explore');
    const button = screen.getByRole('button', { name: 'Filtros' });

    await user.click(button);
    expect(screen.getByRole('dialog', { name: 'Título del panel' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button).toHaveFocus();
  });

  it('el botón de cerrar del panel tiene nombre accesible y lo cierra', async () => {
    const user = userEvent.setup();
    renderSidebar('/explore');

    await user.click(screen.getByRole('button', { name: 'Filtros' }));
    await user.click(screen.getByRole('button', { name: 'iconButton.close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('caracterización de clases: el panel y su fondo son hermanos de la barra y llevan z-[60] (la superposición real se mide con Playwright)', async () => {
    const user = userEvent.setup();
    renderSidebar('/explore');
    await user.click(screen.getByRole('button', { name: 'Filtros' }));

    const nav = screen.getByRole('navigation', { name: 'privateNav.label' });
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.previousElementSibling;
    expect(nav.contains(dialog)).toBe(false);
    expect(dialog).toHaveClass('z-[60]');
    expect(backdrop).toHaveClass('z-[60]');
    expect(nav).toHaveClass('z-40');
  });

  it('en escritorio la barra cubre la altura completa bajo la cabecera con su fondo (sin hueco blanco)', () => {
    renderSidebar('/explore');

    const nav = screen.getByRole('navigation', { name: 'privateNav.label' });
    expect(nav).toHaveClass('md:sticky', 'md:top-16', 'md:bottom-auto', 'md:h-[calc(100dvh-4rem)]', 'md:self-start', 'md:shrink-0', 'bg-surface');
    expect(nav).not.toHaveClass('md:bottom-0');
    expect(nav).not.toHaveClass('md:h-auto');
    expect(nav).not.toHaveClass('md:left-0');
  });

  it('el panel se nombra con aria-labelledby hacia el h2 de la opción y no lleva min-h-full ni deja el scroll encadenado', async () => {
    const user = userEvent.setup();
    renderSidebar('/explore');
    await user.click(screen.getByRole('button', { name: 'Filtros' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'filtros-titulo');
    expect(dialog).not.toHaveAttribute('aria-label');
    expect(document.getElementById('filtros-titulo')).toHaveTextContent('Título del panel');
    expect(dialog.querySelector('.min-h-full')).toBeNull();
    expect(dialog.firstElementChild.nextElementSibling).toHaveClass('overscroll-contain');
  });

  it('con el panel abierto el body no se desplaza y al cerrar recupera su valor anterior', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'scroll';
    renderSidebar('/explore');
    expect(document.body.style.overflow).toBe('scroll');

    await user.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });

  it('al desmontar con el panel abierto se restaura el overflow del body', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSidebar('/explore');
    await user.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('no muestra Cerrar sesión por defecto', () => {
    renderSidebar();

    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
  });

  it('con showLogout, Cerrar sesión llama una vez a api.logout y se deshabilita', async () => {
    const user = userEvent.setup();
    renderSidebar('/manage-data', { showLogout: true });

    await user.click(screen.getByRole('button', { name: 'login.logOutButton' }));

    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeDisabled();
  });

  it('Cerrar sesión desactivado usa borde discontinuo moss y no opacity-50', async () => {
    const user = userEvent.setup();
    renderSidebar('/manage-data', { showLogout: true });

    await user.click(screen.getByRole('button', { name: 'login.logOutButton' }));

    const button = screen.getByRole('button', { name: 'login.logOutButton' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      'disabled:cursor-not-allowed',
      'disabled:border-2',
      'disabled:border-dashed',
      'disabled:border-moss',
      'disabled:text-moss',
      'disabled:hover:bg-transparent',
    );
    expect(button.className).not.toMatch(/opacity-50/);
  });

  it('los destinos inactivos van en peso normal (400) y el activo en negrita', () => {
    renderSidebar('/manage-data', { showLogout: true });

    expect(screen.getByRole('link', { name: 'Cargar' })).toHaveClass('font-normal');
    expect(screen.getByRole('link', { name: 'Cargar' })).not.toHaveClass('font-medium');
    expect(screen.getByRole('link', { name: 'Datos' })).toHaveClass('font-bold');
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toHaveClass('font-normal');
  });
});
