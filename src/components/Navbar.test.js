import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderNavbar = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  );

describe('Navbar', () => {
  it('el botón del menú tiene nombre accesible', () => {
    renderNavbar();

    expect(screen.getByRole('button', { name: 'iconButton.menu' })).toBeInTheDocument();
  });

  it('la navegación tiene nombre', () => {
    renderNavbar();

    expect(screen.getByRole('navigation', { name: 'navbar.label' })).toBeInTheDocument();
  });

  it('aria-expanded pasa de false a true y aria-controls apunta a un id que existe', async () => {
    const user = userEvent.setup();
    renderNavbar();
    const button = screen.getByRole('button', { name: 'iconButton.menu' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(button.getAttribute('aria-controls'))).not.toBeNull();
  });

  it('Escape cierra el panel y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    renderNavbar();
    const button = screen.getByRole('button', { name: 'iconButton.menu' });

    await user.click(button);
    await user.tab();
    await user.keyboard('{Escape}');

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('los enlaces de escritorio no parten el texto en dos líneas y cabe el relleno en 768 px', () => {
    renderNavbar();

    const link = screen.getAllByRole('link', { name: 'navbar.aboutUsOption' })[0];
    expect(link).toHaveClass('whitespace-nowrap', 'px-2', 'lg:px-6');
    expect(link).not.toHaveClass('px-6');
  });

  it('en /explorar el enlace activo tiene aria-current="page"', () => {
    renderNavbar('/explorar');

    const current = screen
      .getAllByRole('link', { name: 'navbar.exploreOption' })
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'navbar.homeOption' }).some((l) => l.hasAttribute('aria-current'))).toBe(false);
  });
});
