import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducedMotion } from 'motion/react';
import ScrollIndicator from './ScrollIndicator';

vi.mock('motion/react', () => ({ useReducedMotion: vi.fn(() => false) }));

const renderIndicator = () =>
  render(
    <>
      <ScrollIndicator targetId="destino" />
      <section id="destino" tabIndex={-1}>destino</section>
    </>
  );

describe('ScrollIndicator', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    useReducedMotion.mockReturnValue(false);
  });

  it('el botón tiene nombre accesible, anillo de foco, 48 px y la ligadura oculta', () => {
    renderIndicator();

    const boton = screen.getByRole('button', { name: 'iconButton.scrollDown' });
    expect(boton).toHaveClass('focus-ring', 'h-12', 'w-12');
    expect(boton.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });

  it('va en el flujo: ni fixed ni animate-bounce', () => {
    const { container } = renderIndicator();

    expect(container.innerHTML).not.toMatch(/\bfixed\b|animate-bounce|\babsolute\b/);
  });

  it('al pulsar lleva a la sección de destino con scroll suave', async () => {
    renderIndicator();

    await userEvent.click(screen.getByRole('button', { name: 'iconButton.scrollDown' }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(Element.prototype.scrollIntoView.mock.contexts[0]).toBe(document.getElementById('destino'));
  });

  it('además del scroll enfoca el destino, para que el siguiente Tab continúe desde ahí', async () => {
    renderIndicator();

    await userEvent.click(screen.getByRole('button', { name: 'iconButton.scrollDown' }));

    expect(document.activeElement).toBe(document.getElementById('destino'));
  });

  it('con movimiento reducido el scroll es inmediato', async () => {
    useReducedMotion.mockReturnValue(true);
    renderIndicator();

    await userEvent.click(screen.getByRole('button', { name: 'iconButton.scrollDown' }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('si el destino no existe no falla', async () => {
    render(<ScrollIndicator targetId="no-existe" />);

    await userEvent.click(screen.getByRole('button', { name: 'iconButton.scrollDown' }));

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
