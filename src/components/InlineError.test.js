import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InlineError from './InlineError';

describe('InlineError', () => {
  it('es un aviso role="alert" con su id y su texto', () => {
    render(<InlineError id="error-campo">Escribe un término.</InlineError>);

    const aviso = screen.getByText('Escribe un término.').closest('[role=alert]');
    expect(aviso).toBeInTheDocument();
    expect(aviso).toHaveAttribute('id', 'error-campo');
  });

  it('lleva borde y texto danger, con un icono oculto a los lectores', () => {
    render(<InlineError id="e">Mal</InlineError>);

    const aviso = screen.getByText('Mal').closest('[role=alert]');
    expect(aviso).toHaveClass('text-danger', 'border-danger');
    const icono = aviso.querySelector('[aria-hidden="true"]');
    expect(icono).toHaveClass('material-symbols-outlined');
    expect(icono).toHaveTextContent('error');
  });
});
