import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadSpinner from './LoadSpinner';

describe('LoadSpinner', () => {
  it('en superposición es una región status con el texto de carga solo para lectores', () => {
    render(<LoadSpinner />);

    const region = screen.getByRole('status');
    const texto = screen.getByText('feedback.loading');
    expect(region).toContainElement(texto);
    expect(texto).toHaveClass('sr-only');
    expect(region.querySelector('.animate-spin')).toBeInTheDocument();
    expect(region).toHaveClass('fixed', 'inset-0');
  });

  it('en superposición admite un texto propio', () => {
    render(<LoadSpinner label="Cargando datos" />);

    expect(screen.getByText('Cargando datos')).toHaveClass('sr-only');
  });

  it('en línea muestra el texto a la vista y el spinner junto a él', () => {
    render(<LoadSpinner inline label="Cargando términos…" />);

    const region = screen.getByRole('status');
    const texto = screen.getByText('Cargando términos…');
    expect(texto).not.toHaveClass('sr-only');
    expect(region).not.toHaveClass('fixed');
    expect(region.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('en línea y sin texto queda montado, vacío y sin spinner', () => {
    render(<LoadSpinner inline label="" />);

    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    expect(region.querySelector('.animate-spin')).toBeNull();
  });
});
