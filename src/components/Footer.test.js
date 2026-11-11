import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe('Footer', () => {
  // Caracterización: pasa de primeras con el código previo.
  it('muestra los 4 enlaces y el copyright', () => {
    renderFooter();

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/explorar',
      '/sobre-nosotros',
      '/cookies',
    ]);
    expect(screen.getByText(/footer\.copyright/)).toBeInTheDocument();
  });

  it('hay un solo contentinfo (un único footer)', () => {
    const { container } = renderFooter();

    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(container.querySelectorAll('footer')).toHaveLength(1);
  });

  it('la versión es un summary que despliega el texto de ee', () => {
    const { container } = renderFooter();

    const summary = container.querySelector('details > summary');
    expect(summary).toHaveTextContent('V 1.0.0');
    expect(summary).toHaveClass('focus-ring');
    expect(container.querySelector('details > p')).toHaveTextContent('ee');
  });

  it('los enlaces tienen anillo de foco y objetivo de 44 px', () => {
    renderFooter();

    screen.getAllByRole('link').forEach((link) => {
      expect(link).toHaveClass('focus-ring', 'min-h-11');
    });
  });
});
