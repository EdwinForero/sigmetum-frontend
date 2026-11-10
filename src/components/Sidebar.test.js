import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

const menuOptions = [
  { id: 'dataManagement', name: 'Administrar datos', icon: 'database', link: '/administrar-datos' },
  { id: 'contentManagement', name: 'Administrar contenido', icon: 'settings', link: '/administrar-contenido' },
  { id: 'uploadFiles', name: 'Cargar archivos', icon: 'upload', link: '/cargar-archivos' },
  { id: 'filter', name: 'Filtros', icon: 'filter_alt', component: <p>panel</p> },
];

const renderSidebar = (path = '/administrar-datos') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar exploreData={[]} menuOptions={menuOptions} />
    </MemoryRouter>
  );

describe('Sidebar', () => {
  it('cada entrada del panel se nombra con el name de su opción', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: 'Administrar datos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Administrar contenido' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar archivos' })).toBeInTheDocument();
  });

  it('el botón de cerrar el panel tiene nombre accesible', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: 'iconButton.close' })).toBeInTheDocument();
  });

  it('la opción sin enlace abre su panel con un botón con nombre', async () => {
    const user = userEvent.setup();
    renderSidebar('/explorar');

    await user.click(screen.getByRole('button', { name: 'Filtros' }));

    expect(screen.getByText('panel')).toBeInTheDocument();
  });
});
