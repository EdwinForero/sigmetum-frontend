import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

const renderNotFound = () =>
  render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );

describe('NotFound', () => {
  it('tiene un único h1 en brand-deep', () => {
    renderNotFound();

    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveClass('text-brand-deep', 'font-bold');
  });

  it('el botón de volver es un enlace a / sin button dentro', () => {
    renderNotFound();

    const enlace = screen.getByRole('link', { name: 'notFound.returnButton' });
    expect(enlace).toHaveAttribute('href', '/');
    expect(screen.queryByRole('button')).toBeNull();
    expect(enlace.querySelector('button')).toBeNull();
  });

  it('usa el contenedor común, sin colores ni anchos en píxeles propios (el botón trae su min-w compartido)', () => {
    const { container } = renderNotFound();

    expect(container.firstElementChild).toHaveClass('page-container', 'py-section', 'text-center');
    expect(container.innerHTML).not.toMatch(/\[#|max-w-\[|(?<![-\w])w-\[\d+px\]|min-h-screen/);
  });

  it('el bloque de contenido es el único Reveal y no hay anidados', () => {
    const { container } = renderNotFound();

    expect(container.querySelectorAll('[data-reveal]')).toHaveLength(1);
    expect(container.firstElementChild).toHaveAttribute('data-reveal');
    expect(container.querySelectorAll('[data-reveal] [data-reveal]')).toHaveLength(0);
  });
});
