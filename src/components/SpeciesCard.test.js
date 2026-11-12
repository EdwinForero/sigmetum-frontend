import { describe, it, expect } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeciesCard from './SpeciesCard';

const ESPECIE = 'Quercus ilex';
const data = [{ 'Especies Características': ESPECIE, Provincia: 'Málaga' }];

const renderCard = (props = {}) =>
  render(<SpeciesCard data={data} species={{ 'Especies Características': ESPECIE }} noItalicTerms={[]} {...props} />);

describe('SpeciesCard', () => {
  it('la tarjeta es un div con tokens: bg-surface, hover:bg-sage, borde sage y transición que respeta movimiento reducido', () => {
    const { container } = renderCard();

    const card = container.firstChild;
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveClass('bg-surface', 'hover:bg-sage', 'transition-colors', 'motion-reduce:transition-none', 'border-sage');
    expect(card).not.toHaveAttribute('style');
    expect(container.innerHTML).not.toMatch(/\[#[0-9A-Fa-f]{3,8}\]|#[0-9A-Fa-f]{6}/);
  });

  it('el texto va en peso normal (400) y el nombre científico en Amaranth cursiva', () => {
    renderCard();

    const nombre = screen.getByText(ESPECIE);
    expect(nombre.closest('p')).toHaveClass('font-normal', 'text-ink');
    expect(nombre.closest('p')).not.toHaveClass('font-medium');
    expect(nombre).toHaveClass('font-primary', 'italic');
  });

  it('al hacer clic abre el diálogo de la especie', async () => {
    const user = userEvent.setup();
    const { container } = renderCard();

    await user.click(container.firstChild);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('es operable con teclado: role button, en el orden de Tab, con foco visible y Enter o Espacio abren el diálogo', async () => {
    const user = userEvent.setup();
    const { container } = renderCard();
    const card = container.firstChild;
    expect(card).toHaveAttribute('role', 'button');
    expect(screen.getByRole('button', { name: ESPECIE })).toBe(card);
    expect(card).toHaveAttribute('tabindex', '0');
    expect(card).toHaveClass('focus-ring');

    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));

    await user.keyboard(' ');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
