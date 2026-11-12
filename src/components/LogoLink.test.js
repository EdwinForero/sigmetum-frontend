import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LogoLink from './LogoLink';

describe('LogoLink', () => {
  const renderLogo = () => render(<LogoLink href="https://www.uma.es" src="https://cdn/uma.jpg" alt="Universidad de Málaga" />);

  it('es un enlace externo seguro con nombre accesible y aviso de pestaña nueva', () => {
    renderLogo();

    const link = screen.getByRole('link', { name: /Universidad de Málaga/ });
    expect(link).toHaveAttribute('href', 'https://www.uma.es');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveClass('focus-ring', 'inline-flex', 'h-16', 'w-32', 'rounded-lg', 'bg-surface', 'p-2');
    expect(link.querySelector('.sr-only')).toHaveTextContent('a11y.opensInNewTab');
  });

  it('la imagen reserva su caja y se carga de forma diferida', () => {
    renderLogo();

    const img = screen.getByAltText('Universidad de Málaga');
    expect(img).toHaveAttribute('width', '128');
    expect(img).toHaveAttribute('height', '64');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveClass('h-full', 'w-full', 'object-contain', 'mix-blend-multiply');
  });

  it('la dirección es https', () => {
    renderLogo();

    expect(screen.getByRole('link').getAttribute('href')).toMatch(/^https:/);
  });
});
