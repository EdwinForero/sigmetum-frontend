import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('el botón con texto mide al menos 48 px, usa texto ink y no recorta el texto', () => {
    render(<ButtonPrincipal text="Añadir término" />);
    const boton = screen.getByRole('button', { name: 'Añadir término' });

    expect(boton).toHaveClass('min-h-12', 'text-base', 'text-ink', 'bg-brand');
    expect(boton.className).not.toMatch(/truncate|overflow-hidden|max-h-/);
    expect(boton.querySelector('.truncate')).toBeNull();
  });

  it('el botón de icono es de 48 por 48 con el icono en brand-dark', () => {
    render(<ButtonPrincipal icon="add" ariaLabel="Icono" />);
    const boton = screen.getByRole('button', { name: 'Icono' });

    expect(boton).toHaveClass('h-12', 'w-12', 'text-brand-dark');
  });

  it('con loading marca aria-busy y aria-disabled, no se desactiva y no llama a onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonPrincipal text="Guardar" loading onClick={onClick} />);
    const boton = screen.getByRole('button', { name: /Guardar/ });

    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(boton).toHaveAttribute('aria-disabled', 'true');
    expect(boton).not.toBeDisabled();
    expect(boton).toHaveTextContent('progress_activity');
    await user.click(boton);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sin loading llama a onClick y no marca aria-busy', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonPrincipal text="Guardar" onClick={onClick} />);
    const boton = screen.getByRole('button', { name: 'Guardar' });

    await user.click(boton);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(boton).not.toHaveAttribute('aria-busy');
  });

  it('el resto de propiedades llega al botón', () => {
    render(<ButtonPrincipal text="Filtros" aria-expanded="false" aria-controls="panel" id="boton" />);
    const boton = screen.getByRole('button', { name: 'Filtros' });

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(boton).toHaveAttribute('aria-controls', 'panel');
    expect(boton).toHaveAttribute('id', 'boton');
  });

  it('desactivado, no se puede pulsar', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonPrincipal text="Nada" disabled onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Nada' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
