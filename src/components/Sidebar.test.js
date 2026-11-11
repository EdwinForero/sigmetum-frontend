import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({ default: { logout: vi.fn() } }));

import api from '../services/api';
import Sidebar from './Sidebar';

const menuOptions = [
  { id: 'dataManagement', name: 'Administrar datos', icon: 'database', link: '/administrar-datos' },
  { id: 'contentManagement', name: 'Administrar contenido', icon: 'settings', link: '/administrar-contenido' },
  { id: 'uploadFiles', name: 'Cargar archivos', icon: 'upload', link: '/cargar-archivos' },
  { id: 'filter', name: 'Filtros', icon: 'filter_alt', component: <button type="button">dentro-del-panel</button> },
];

const renderSidebar = (path = '/administrar-datos', props = {}) =>
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
    expect(screen.getByRole('link', { name: 'Administrar datos' })).toHaveAttribute('href', '/administrar-datos');
    expect(screen.getByRole('link', { name: 'Administrar contenido' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cargar archivos' })).toBeInTheDocument();
    expect(container.querySelectorAll('a button')).toHaveLength(0);
  });

  it('solo el destino activo lleva aria-current="page"', () => {
    renderSidebar('/administrar-datos');

    expect(screen.getByRole('link', { name: 'Administrar datos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Cargar archivos' })).not.toHaveAttribute('aria-current');
  });

  it('Filtros es un botón con aria-expanded y aria-controls que apunta al panel', async () => {
    const user = userEvent.setup();
    renderSidebar('/explorar');
    const button = screen.getByRole('button', { name: 'Filtros' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(button.getAttribute('aria-controls'))).toBe(screen.getByRole('dialog', { name: 'privateNav.filters' }));
  });

  it('con el panel cerrado su contenido no es visible ni accesible (hidden; el Tab real se mide con Playwright)', () => {
    renderSidebar('/explorar');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'dentro-del-panel' })).toBeNull();
    expect(screen.getByText('dentro-del-panel')).not.toBeVisible();
  });

  it('al abrir, el foco entra en el dialog; Escape lo cierra y el foco vuelve a Filtros', async () => {
    const user = userEvent.setup();
    renderSidebar('/explorar');
    const button = screen.getByRole('button', { name: 'Filtros' });

    await user.click(button);
    expect(screen.getByRole('dialog', { name: 'privateNav.filters' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button).toHaveFocus();
  });

  it('el botón de cerrar del panel tiene nombre accesible y lo cierra', async () => {
    const user = userEvent.setup();
    renderSidebar('/explorar');

    await user.click(screen.getByRole('button', { name: 'Filtros' }));
    await user.click(screen.getByRole('button', { name: 'iconButton.close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('caracterización de clases: el panel y su fondo son hermanos de la barra y llevan z-[60] (la superposición real se mide con Playwright)', async () => {
    const user = userEvent.setup();
    renderSidebar('/explorar');
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
    renderSidebar('/explorar');

    const nav = screen.getByRole('navigation', { name: 'privateNav.label' });
    expect(nav).toHaveClass('md:top-16', 'md:bottom-0', 'bg-surface');
    expect(nav).not.toHaveClass('md:bottom-auto');
  });

  it('no muestra Cerrar sesión por defecto', () => {
    renderSidebar();

    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
  });

  it('con showLogout, Cerrar sesión llama una vez a api.logout y se deshabilita', async () => {
    const user = userEvent.setup();
    renderSidebar('/administrar-datos', { showLogout: true });

    await user.click(screen.getByRole('button', { name: 'login.logOutButton' }));

    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeDisabled();
  });
});
