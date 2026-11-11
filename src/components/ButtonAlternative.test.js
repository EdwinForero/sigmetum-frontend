import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ButtonAlternative from './ButtonAlternative';

describe('ButtonAlternative', () => {
  it('lleva el anillo de foco', () => {
    render(<ButtonAlternative text="Elegir" />);

    expect(screen.getByRole('button', { name: 'Elegir' })).toHaveClass('focus-ring');
  });

  it('mide al menos 48 px, usa texto brand-deep y no recorta el texto', () => {
    render(<ButtonAlternative text="Elegir" />);
    const boton = screen.getByRole('button', { name: 'Elegir' });

    expect(boton).toHaveClass('min-h-12', 'text-base', 'text-brand-deep', 'border-brand-dark');
    expect(boton.className).not.toMatch(/truncate|overflow-hidden|max-h-/);
    expect(boton.querySelector('.truncate')).toBeNull();
  });

  it('por defecto es type="button" y admite type="submit"', () => {
    render(
      <>
        <ButtonAlternative text="Normal" />
        <ButtonAlternative text="Enviar" type="submit" />
      </>
    );

    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit');
  });

  it('con loading marca aria-busy y aria-disabled, no se desactiva y no llama a onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonAlternative text="Descargar" loading onClick={onClick} />);
    const boton = screen.getByRole('button', { name: /Descargar/ });

    expect(boton).toHaveAttribute('aria-busy', 'true');
    expect(boton).toHaveAttribute('aria-disabled', 'true');
    expect(boton).not.toBeDisabled();
    await user.click(boton);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('desactivado, no se puede pulsar', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonAlternative text="Nada" disabled onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Nada' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('llama a onClick y pasa el resto de propiedades al botón', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ButtonAlternative text="Elegir" onClick={onClick} aria-expanded="true" />);
    const boton = screen.getByRole('button', { name: 'Elegir' });

    await user.click(boton);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
  });
});
