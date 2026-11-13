import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeciesCard from './SpeciesCard';
import Reveal from './Reveal.js';

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

  describe('dentro de un Reveal ya revelado', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    const renderRevelada = () => {
      const instancias = [];
      class FakeIntersectionObserver {
        constructor(callback) {
          this.callback = callback;
          this.observe = vi.fn();
          this.unobserve = vi.fn();
          this.disconnect = vi.fn();
          instancias.push(this);
        }
      }
      vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top: 2000, bottom: 2100, height: 100 });
      const view = render(
        <Reveal>
          <SpeciesCard data={data} species={{ 'Especies Características': ESPECIE }} noItalicTerms={[]} />
        </Reveal>
      );
      const envoltura = view.container.querySelector('[data-reveal]');
      expect(envoltura).toHaveClass('reveal-hidden');
      act(() => instancias[0].callback([{ target: envoltura, isIntersecting: true }]));
      expect(envoltura).toHaveClass('reveal-in');
      return { ...view, envoltura };
    };

    it('el diálogo se pinta en document.body, fuera de la envoltura con transform, que sigue revelada (B76)', async () => {
      const user = userEvent.setup();
      const { envoltura } = renderRevelada();

      await user.click(screen.getByRole('button', { name: ESPECIE }));

      const dialog = await screen.findByRole('dialog');
      expect(envoltura.contains(dialog)).toBe(false);
      expect(dialog.closest('[data-reveal]')).toBeNull();
      expect(dialog.parentElement.parentElement).toBe(document.body);
      expect(envoltura).toHaveClass('reveal-in');
    });

    it('con el portal, el foco entra en el diálogo, Escape lo cierra y el foco vuelve a la tarjeta', async () => {
      const user = userEvent.setup();
      renderRevelada();
      const card = screen.getByRole('button', { name: ESPECIE });

      await user.click(card);
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveFocus();

      await user.keyboard('{Escape}');
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      expect(card).toHaveFocus();
    });
  });
});
