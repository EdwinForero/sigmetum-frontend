import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InfoButton from './InfoButton';

// Este `t` simulado interpola `topic`: así se comprueba el nombre accesible por contexto.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (options && 'topic' in options ? `${key} ${options.topic}` : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

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

  it('el texto cabe en pantallas estrechas, no va justificado y no fija un ancho mínimo', () => {
    render(<InfoButton tooltipText="Ayuda" />);

    expect(tooltip()).toHaveClass('w-max', 'max-w-[min(28rem,calc(100vw-2rem))]');
    expect(tooltip().className).not.toMatch(/min-w-/);
    expect(tooltip().firstElementChild).toHaveClass('text-left');
    expect(tooltip().className + tooltip().firstElementChild.className).not.toMatch(/text-justify/);
  });

  it('la caja del tooltip usa el sistema de avisos (info) con el icono oculto y text-left', () => {
    render(<InfoButton tooltipText="Ayuda" />);
    const caja = tooltip().firstElementChild;

    expect(caja).toHaveClass(
      'flex', 'items-start', 'gap-2', 'rounded-lg', 'border', 'p-stack-md',
      'border-moss', 'bg-surface', 'text-ink', 'text-sm', 'text-left', 'shadow-lg'
    );
    expect(caja).not.toHaveClass('border-sage');
    const ligadura = caja.querySelector('[aria-hidden="true"]');
    expect(ligadura).toHaveClass('material-symbols-outlined', 'text-moss');
    expect(ligadura).toHaveTextContent('info');
    expect(caja).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });

  it('la descripción accesible del botón es el texto, sin la ligadura info', async () => {
    const user = userEvent.setup();
    render(<InfoButton tooltipText="Ayuda" />);

    await user.tab();

    expect(screen.getByRole('button', { name: 'iconButton.info' })).toHaveAccessibleDescription('Ayuda');
  });

  it('con topic, el nombre accesible es «Información: tema»; sin topic se queda en el genérico', () => {
    const { rerender } = render(<InfoButton tooltipText="Ayuda" topic="Elegir conjunto" />);
    expect(screen.getByRole('button', { name: 'iconButton.infoAbout Elegir conjunto' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'iconButton.info' })).not.toBeInTheDocument();

    rerender(<InfoButton tooltipText="Ayuda" />);
    expect(screen.getByRole('button', { name: 'iconButton.info' })).toBeInTheDocument();
  });

  it('el hueco entre el botón y el texto forma parte del tooltip: la envoltura lleva pt-2 y nada lleva mt-2', async () => {
    const user = userEvent.setup();
    const { container } = render(<InfoButton tooltipText="Ayuda" />);

    expect(tooltip()).toHaveClass('top-full', 'pt-2');
    expect(tooltip()).toHaveAttribute('role', 'tooltip');
    expect(container.querySelector('.mt-2')).toBeNull();
    expect(tooltip().firstElementChild).toHaveTextContent('Ayuda');
    expect(tooltip().firstElementChild).not.toHaveAttribute('role');
    await user.hover(screen.getByRole('button'));
    expect(tooltip()).toBeVisible();
  });

  describe('posición dentro del viewport', () => {
    const originalRect = Element.prototype.getBoundingClientRect;
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    afterEach(() => {
      Element.prototype.getBoundingClientRect = originalRect;
      window.innerWidth = originalWidth;
      window.innerHeight = originalHeight;
    });

    // El tooltip mide `width` x `height` y su borde izquierdo natural es `left`; se desplaza con su margen. El resto (el ancla) mide `anchor`.
    const mockRects = ({ left, width = 200, height = 60, anchor = { top: 100, bottom: 144 } }) => {
      Element.prototype.getBoundingClientRect = function rect() {
        if (this.getAttribute('role') === 'tooltip') {
          const x = left + (parseFloat(this.style.marginLeft) || 0);
          return { left: x, right: x + width, width, top: 0, bottom: height, height, x, y: 0 };
        }
        return { left: 0, right: 44, width: 44, x: 0, y: anchor.top, ...anchor, height: anchor.bottom - anchor.top };
      };
    };

    it('si se sale por la izquierda se desplaza para dejar 16 px', async () => {
      window.innerWidth = 390;
      mockRects({ left: -20 });
      render(<InfoButton tooltipText="Ayuda" />);

      fireEvent.focus(screen.getByRole('button'));

      expect(tooltip().style.marginLeft).toBe('36px');
    });

    it('si se sale por la derecha se desplaza para dejar 16 px', async () => {
      window.innerWidth = 390;
      mockRects({ left: 250, width: 200 });
      render(<InfoButton tooltipText="Ayuda" />);

      fireEvent.focus(screen.getByRole('button'));

      expect(tooltip().style.marginLeft).toBe('-76px');
    });

    it('en resize, mientras se ve, vuelve a medir', async () => {
      window.innerWidth = 390;
      mockRects({ left: 100, width: 200 });
      render(<InfoButton tooltipText="Ayuda" />);
      fireEvent.focus(screen.getByRole('button'));
      expect(tooltip().style.marginLeft).toBe('0px');

      window.innerWidth = 250;
      fireEvent(window, new Event('resize'));

      expect(tooltip().style.marginLeft).toBe('-66px');
    });

    it('si por debajo se sale del viewport, se coloca encima con bottom-full pb-2', async () => {
      window.innerWidth = 1024;
      window.innerHeight = 800;
      mockRects({ left: 100, anchor: { top: 746, bottom: 790 } });
      render(<InfoButton tooltipText="Ayuda" />);

      fireEvent.focus(screen.getByRole('button'));

      expect(tooltip()).toHaveClass('bottom-full', 'pb-2');
      expect(tooltip()).not.toHaveClass('top-full');
      expect(tooltip()).not.toHaveClass('pt-2');
    });

    it('por debajo de 768 px descuenta 72 px de la barra inferior', async () => {
      window.innerWidth = 390;
      window.innerHeight = 800;
      mockRects({ left: 100, anchor: { top: 640, bottom: 684 } });
      render(<InfoButton tooltipText="Ayuda" />);

      fireEvent.focus(screen.getByRole('button'));

      expect(tooltip()).toHaveClass('bottom-full');
    });

    it('si cabe por debajo se queda debajo', async () => {
      window.innerWidth = 1024;
      window.innerHeight = 800;
      mockRects({ left: 100 });
      render(<InfoButton tooltipText="Ayuda" />);

      fireEvent.focus(screen.getByRole('button'));

      expect(tooltip()).toHaveClass('top-full', 'pt-2');
    });
  });
});
