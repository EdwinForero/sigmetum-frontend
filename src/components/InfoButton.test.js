import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InfoButton from './InfoButton';

const tooltip = () => screen.getByRole('tooltip', { hidden: true });

describe('InfoButton', () => {
  it('tiene nombre accesible genérico, anillo de foco y la ligadura oculta', () => {
    render(<InfoButton tooltipText="Ayuda" />);

    const boton = screen.getByRole('button', { name: 'iconButton.info' });
    expect(boton).toHaveClass('focus-ring');
    expect(boton.className).not.toMatch(/focus:outline/);
    expect(boton.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });

  it('es un botón de 44 por 44 con el icono en moss y type="button"', () => {
    render(<InfoButton tooltipText="Ayuda" />);
    const boton = screen.getByRole('button', { name: 'iconButton.info' });

    expect(boton).toHaveAttribute('type', 'button');
    expect(boton).toHaveClass('h-11', 'w-11', 'text-moss');
  });

  it('con Tab aparece el texto y aria-describedby apunta a él', async () => {
    const user = userEvent.setup();
    render(<InfoButton tooltipText="Ayuda" />);
    const boton = screen.getByRole('button', { name: 'iconButton.info' });

    expect(tooltip()).not.toBeVisible();
    await user.tab();

    expect(boton).toHaveFocus();
    expect(tooltip()).toBeVisible();
    expect(tooltip()).toHaveTextContent('Ayuda');
    expect(boton).toHaveAttribute('aria-describedby', tooltip().id);
  });

  it('sacar el foco lo oculta', async () => {
    const user = userEvent.setup();
    render(<InfoButton tooltipText="Ayuda" />);

    await user.tab();
    expect(tooltip()).toBeVisible();
    await user.tab();
    expect(tooltip()).not.toBeVisible();
  });

  it('Escape lo oculta mientras se ve', async () => {
    const user = userEvent.setup();
    render(<InfoButton tooltipText="Ayuda" />);

    await user.tab();
    expect(tooltip()).toBeVisible();
    await user.keyboard('{Escape}');
    expect(tooltip()).not.toBeVisible();
  });

  it('con el ratón aparece al entrar y pasar al propio texto no lo cierra', async () => {
    const user = userEvent.setup();
    render(<InfoButton tooltipText="Ayuda" />);
    const boton = screen.getByRole('button', { name: 'iconButton.info' });

    await user.hover(boton);
    expect(tooltip()).toBeVisible();

    await user.hover(tooltip());
    expect(tooltip()).toBeVisible();

    await user.unhover(tooltip());
    expect(tooltip()).not.toBeVisible();
  });

  it('el clic lo muestra y Escape lo oculta (en táctil no hay hover ni foco fiables)', async () => {
    const user = userEvent.setup();
    render(<InfoButton tooltipText="Ayuda" />);

    await user.click(screen.getByRole('button', { name: 'iconButton.info' }));
    expect(tooltip()).toBeVisible();
    await user.keyboard('{Escape}');
    expect(tooltip()).not.toBeVisible();
  });

  it('el texto cabe en pantallas estrechas y no va justificado', () => {
    render(<InfoButton tooltipText="Ayuda" />);

    expect(tooltip()).toHaveClass('text-left', 'max-w-[calc(100vw-2rem)]');
    expect(tooltip().className).not.toMatch(/text-justify/);
  });
});
