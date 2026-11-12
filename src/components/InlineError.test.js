import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InlineError from './InlineError';
import { NOTICE_BASE } from '../utilities/noticeStyles';

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

  it('comparte la caja base de los avisos y no usa colores sueltos', () => {
    render(<InlineError id="e">Mal</InlineError>);

    const aviso = screen.getByText('Mal').closest('[role=alert]');
    expect(aviso).toHaveClass(...NOTICE_BASE.split(' '), 'my-2', 'font-bold', 'bg-surface');
    expect(aviso.className).not.toMatch(/\[#|(gray|blue|red|green|yellow)-\d/);
  });

  it('con announce={false} pinta el mismo aviso con su id pero sin role', () => {
    render(<InlineError id="e" announce={false}>Mal</InlineError>);

    expect(screen.queryByRole('alert')).toBeNull();
    const aviso = screen.getByText('Mal').closest('p');
    expect(aviso).toHaveAttribute('id', 'e');
    expect(aviso).not.toHaveAttribute('role');
    expect(aviso).toHaveClass('text-danger', 'border-danger');
  });
});
