import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ButtonPrincipal from './ButtonPrincipal';

describe('ButtonPrincipal', () => {
  it('con ariaLabel, el botón de icono se nombra por él y la ligadura queda oculta', () => {
    render(<ButtonPrincipal icon="add" ariaLabel="Añadir" onClick={vi.fn()} />);

    const boton = screen.getByRole('button', { name: 'Añadir' });
    expect(boton.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });

  it('las dos ramas llevan el anillo de foco', () => {
    render(
      <>
        <ButtonPrincipal icon="add" ariaLabel="Icono" />
        <ButtonPrincipal text="Texto" />
      </>
    );

    expect(screen.getByRole('button', { name: 'Icono' })).toHaveClass('focus-ring');
    expect(screen.getByRole('button', { name: 'Texto' })).toHaveClass('focus-ring');
  });

  it('por defecto es type="button" y admite type="submit"', () => {
    render(
      <>
        <ButtonPrincipal text="Normal" />
        <ButtonPrincipal icon="add" ariaLabel="Icono" />
        <ButtonPrincipal text="Enviar" type="submit" />
      </>
    );

    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Icono' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit');
  });
});
