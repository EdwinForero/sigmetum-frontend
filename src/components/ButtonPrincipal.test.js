import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ButtonPrincipal, { BUTTON_PRINCIPAL_CLASS, BUTTON_INACTIVE_CLASS } from './ButtonPrincipal';

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

  it('desactivado, el botón de texto es discontinuo, en moss sobre surface, sin opacidad ni hover', () => {
    render(<ButtonPrincipal text="Nada" disabled />);
    const boton = screen.getByRole('button', { name: 'Nada' });

    expect(boton).toBeDisabled();
    expect(boton).toHaveClass('border-2', 'border-dashed', 'border-moss', 'bg-surface', 'text-moss', 'cursor-not-allowed');
    expect(boton).toHaveClass('min-h-12', 'rounded-xl', 'focus-ring', 'text-base', 'font-bold');
    expect(boton.className).not.toMatch(/opacity-50|hover:|bg-brand|text-ink/);
  });

  it('desactivado, el botón de icono conserva su aspecto con opacity-50', () => {
    render(<ButtonPrincipal icon="add" ariaLabel="Icono" disabled />);

    expect(screen.getByRole('button', { name: 'Icono' })).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('no lee aria-disabled: su semántica no cambia', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonPrincipal text="Enviar" aria-disabled="true" onClick={onClick} />);
    const boton = screen.getByRole('button', { name: 'Enviar' });

    expect(boton).toHaveClass('bg-brand');
    expect(boton).not.toHaveClass('border-dashed');
    await user.click(boton);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('con loading y sin disabled mantiene el aspecto activo con cursor-progress', () => {
    render(<ButtonPrincipal text="Guardar" loading />);
    const boton = screen.getByRole('button', { name: /Guardar/ });

    expect(boton).toHaveClass('bg-brand', 'cursor-progress');
    expect(boton).not.toHaveClass('border-dashed');
  });

  it('exporta las clases del estado habilitado y del inactivo para enlaces con aspecto de botón', () => {
    expect(BUTTON_PRINCIPAL_CLASS).toContain('bg-brand');
    expect(BUTTON_PRINCIPAL_CLASS).toContain('min-h-12');
    expect(BUTTON_PRINCIPAL_CLASS).toContain('focus-ring');
    expect(BUTTON_INACTIVE_CLASS).toContain('border-dashed');
    expect(BUTTON_INACTIVE_CLASS).toContain('cursor-not-allowed');
    expect(BUTTON_INACTIVE_CLASS).toContain('min-h-12');
  });

  it('desactivado, no se puede pulsar', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonPrincipal text="Nada" disabled onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Nada' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
