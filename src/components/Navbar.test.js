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

  describe('indicador del ítem activo', () => {
    const desktop = (name) => screen.getAllByRole('link', { name })[0];

    it('el activo lleva barra inferior brand-dark de 4 px y negrita; no es un bloque bg-brand', () => {
      renderNavbar('/explorar');

      const activo = desktop('navbar.exploreOption');
      expect(activo).toHaveAttribute('aria-current', 'page');
      expect(activo).toHaveClass('border-y-4', 'border-t-transparent', 'border-b-brand-dark', 'font-bold');
      expect(activo.className).not.toMatch(/bg-brand(\s|$)/);
    });

    it('el inactivo es del mismo alto (misma borde), sin negrita, con hover moss y fondo sage-soft', () => {
      renderNavbar('/explorar');

      const inactivo = desktop('navbar.homeOption');
      expect(inactivo).not.toHaveAttribute('aria-current');
      expect(inactivo).toHaveClass(
        'border-y-4', 'border-t-transparent', 'border-b-transparent', 'hover:border-b-moss', 'hover:bg-sage-soft', 'font-normal'
      );
      expect(inactivo).not.toHaveClass('font-bold', 'border-b-brand-dark');
      expect(inactivo.className).not.toMatch(/hover:border-b-sage(\s|$)/);
    });

    it('el activo del panel móvil va en negrita con subrayado grueso brand-dark y fondo sage-soft, sin franja lateral', async () => {
      const user = userEvent.setup();
      renderNavbar('/galeria');
      await user.click(screen.getByRole('button', { name: 'iconButton.menu' }));

      const panel = document.getElementById('navbar-menu-panel');
      const activo = [...panel.querySelectorAll('a')].find((a) => a.getAttribute('aria-current') === 'page');
      expect(activo).toHaveClass(
        'bg-sage-soft', 'font-bold', 'underline', 'decoration-4', 'decoration-brand-dark', 'underline-offset-4', 'min-h-11'
      );
      expect(activo.className).not.toMatch(/border-l|border-brand-dark/);
      const inactivo = [...panel.querySelectorAll('a')].find((a) => !a.hasAttribute('aria-current'));
      expect(inactivo).toHaveClass('min-h-11', 'font-normal', 'hover:bg-sage-soft');
      expect(inactivo.className).not.toMatch(/border-l|underline/);
      expect(inactivo.className).not.toMatch(/hover:bg-brand/);
    });
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
