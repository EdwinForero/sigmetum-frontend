import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Reveal from './Reveal.js';

let instancias;

class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observados = new Set();
    this.unobserve = vi.fn((el) => this.observados.delete(el));
    this.disconnect = vi.fn(() => this.observados.clear());
    instancias.push(this);
  }

  observe(el) {
    this.observados.add(el);
  }
}

const mostrar = (el, isIntersecting = true) =>
  act(() => instancias[0].callback([{ target: el, isIntersecting }]));

const bajoElPliegue = () =>
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top: 2000, bottom: 2100, height: 100 });

const fijarScrollY = (valor) =>
  Object.defineProperty(window, 'scrollY', { value: valor, configurable: true, writable: true });

describe('Reveal', () => {
  let rect;

  beforeEach(() => {
    instancias = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    rect = bajoElPliegue();
    fijarScrollY(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fijarScrollY(0);
  });

  it('pinta data-reveal, el elemento de `as`, la className y el resto de atributos', () => {
    render(<Reveal as="li" id="x" className="rounded" data-prueba="1">hola</Reveal>);

    const el = screen.getByText('hola');
    expect(el.tagName).toBe('LI');
    expect(el).toHaveAttribute('data-reveal');
    expect(el).toHaveAttribute('id', 'x');
    expect(el).toHaveAttribute('data-prueba', '1');
    expect(el).toHaveClass('rounded');
  });

  it('por debajo del pliegue empieza oculto y crea el observador con los valores de REVEAL', () => {
    render(<Reveal className="rounded">hola</Reveal>);

    const el = screen.getByText('hola');
    expect(el).toHaveClass('reveal-hidden', 'rounded');
    expect(instancias).toHaveLength(1);
    expect(instancias[0].options).toEqual({ threshold: 0, rootMargin: '0px 0px -10% 0px' });
    expect(instancias[0].observados.has(el)).toBe(true);
  });

  it('ya en pantalla (rect.top dentro de la ventana) se queda visible y no observa', () => {
    rect.mockReturnValue({ top: 100, bottom: 200, height: 100 });
    render(<Reveal>hola</Reveal>);

    expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
    expect(instancias).toHaveLength(0);
  });

  it('la posición es la del documento: con scrollY 2000 y top -1900 queda visible', () => {
    fijarScrollY(2000);
    rect.mockReturnValue({ top: -1900, bottom: -1800, height: 100 });
    render(<Reveal>hola</Reveal>);

    expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
    expect(instancias).toHaveLength(0);
  });

  it('con la página ya desplazada (scrollY 2000), un bloque a top 100 está en el documento a 2100: se oculta', () => {
    fijarScrollY(2000);
    rect.mockReturnValue({ top: 100, bottom: 200, height: 100 });
    render(<Reveal>hola</Reveal>);

    expect(screen.getByText('hola')).toHaveClass('reveal-hidden');
    expect(instancias).toHaveLength(1);
  });

  it('al entrar en pantalla pasa a revelado con el retraso del índice y sin transform ni will-change', () => {
    render(<Reveal index={2}>hola</Reveal>);
    const el = screen.getByText('hola');

    mostrar(el);

    expect(el).toHaveClass('reveal-in');
    expect(el).not.toHaveClass('reveal-hidden');
    expect(el.style.transitionDelay).toBe('120ms');
    expect(el.className).not.toMatch(/translate|transform|will-change/);
    expect(el.getAttribute('style')).not.toMatch(/transform|translate|will-change/);
  });

  it('el retraso se limita al sexto elemento (300 ms)', () => {
    render(<Reveal index={11}>hola</Reveal>);
    const el = screen.getByText('hola');

    mostrar(el);

    expect(el.style.transitionDelay).toBe('300ms');
  });

  it('una entrada que no intersecta no lo revela', () => {
    render(<Reveal>hola</Reveal>);
    const el = screen.getByText('hola');

    mostrar(el, false);

    expect(el).toHaveClass('reveal-hidden');
    expect(instancias[0].unobserve).not.toHaveBeenCalled();
  });

  it('se revela una sola vez: deja de observarlo y se desconecta al vaciarse', () => {
    render(<Reveal>hola</Reveal>);
    const el = screen.getByText('hola');

    mostrar(el);

    expect(instancias[0].unobserve).toHaveBeenCalledWith(el);
    expect(instancias[0].disconnect).toHaveBeenCalledTimes(1);
    mostrar(el, false);
    mostrar(el);
    expect(el).toHaveClass('reveal-in');
    expect(el).not.toHaveClass('reveal-hidden');
  });

  it('dos instancias comparten un solo observador y solo se desconecta al quedar vacío', () => {
    const { unmount } = render(
      <>
        <Reveal>uno</Reveal>
        <Reveal>dos</Reveal>
      </>
    );

    expect(instancias).toHaveLength(1);
    expect(instancias[0].observados.size).toBe(2);
    mostrar(screen.getByText('uno'));
    expect(instancias[0].disconnect).not.toHaveBeenCalled();
    unmount();
    expect(instancias[0].unobserve).toHaveBeenCalledTimes(2);
    expect(instancias[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('al desmontar deja de observar y desconecta', () => {
    const { unmount } = render(<Reveal>hola</Reveal>);
    const el = screen.getByText('hola');

    unmount();

    expect(instancias[0].unobserve).toHaveBeenCalledWith(el);
    expect(instancias[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('tras desconectar, el siguiente Reveal crea un observador nuevo', () => {
    render(<Reveal>uno</Reveal>);
    mostrar(screen.getByText('uno'));
    render(<Reveal>dos</Reveal>);

    expect(instancias).toHaveLength(2);
    expect(instancias[1].observados.has(screen.getByText('dos'))).toBe(true);
  });

  it('con foco (focusin) pasa a visible en el acto, sin transición, y deja de observar', () => {
    render(
      <Reveal index={3}>
        <button type="button">dentro</button>
      </Reveal>
    );
    const el = screen.getByRole('button').parentElement;
    expect(el).toHaveClass('reveal-hidden');

    fireEvent.focusIn(screen.getByRole('button'));

    expect(el).not.toHaveClass('reveal-hidden');
    expect(el).not.toHaveClass('reveal-in');
    expect(el.style.transitionDelay).toBe('');
    expect(instancias[0].unobserve).toHaveBeenCalledWith(el);
  });

  it('con el foco recibido de un clic en un hijo enfocable también se muestra, y respeta su propio onFocus', () => {
    const onFocus = vi.fn();
    render(
      <Reveal onFocus={onFocus}>
        <button type="button">dentro</button>
      </Reveal>
    );

    act(() => screen.getByRole('button').focus());

    expect(screen.getByRole('button').parentElement).not.toHaveClass('reveal-hidden');
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('disabled: visible desde el principio y sin observador', () => {
    render(<Reveal disabled>hola</Reveal>);

    expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
    expect(instancias).toHaveLength(0);
  });

  it('si disabled pasa a true estando oculto, queda visible y deja de observar', () => {
    const { rerender } = render(<Reveal>hola</Reveal>);
    const el = screen.getByText('hola');
    expect(el).toHaveClass('reveal-hidden');

    rerender(<Reveal disabled>hola</Reveal>);

    expect(el).not.toHaveClass('reveal-hidden');
    expect(instancias[0].unobserve).toHaveBeenCalledWith(el);
  });

  it('un Reveal ya revelado no vuelve a ocultarse al cambiar disabled', () => {
    const { rerender } = render(<Reveal disabled>hola</Reveal>);

    rerender(<Reveal disabled={false}>hola</Reveal>);

    expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
    expect(instancias).toHaveLength(0);
  });

  it('con prefers-reduced-motion se queda visible', () => {
    vi.stubGlobal('matchMedia', (consulta) => ({ matches: /reduce/.test(consulta), media: consulta }));
    render(<Reveal>hola</Reveal>);

    expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
    expect(instancias).toHaveLength(0);
  });

  describe('contenido visible por defecto (A6)', () => {
    it('sin IntersectionObserver queda visible y ni siquiera mide la posición', () => {
      vi.stubGlobal('IntersectionObserver', undefined);
      render(<Reveal>hola</Reveal>);

      expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
      expect(rect).not.toHaveBeenCalled();
    });

    it('si el constructor del observador falla, queda visible y no lanza', () => {
      vi.stubGlobal('IntersectionObserver', function Roto() {
        throw new Error('no soportado');
      });

      expect(() => render(<Reveal>hola</Reveal>)).not.toThrow();
      expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
    });

    it('si observe() falla, queda visible y no deja el elemento en el mapa', () => {
      vi.stubGlobal('IntersectionObserver', class extends FakeIntersectionObserver {
        observe() {
          throw new Error('observe roto');
        }
      });
      const { unmount } = render(<Reveal>hola</Reveal>);

      expect(screen.getByText('hola')).not.toHaveClass('reveal-hidden');
      unmount();
    });
  });

  it('el código no usa will-change ni transform', () => {
    const codigo = readFileSync('src/components/Reveal.js', 'utf8');

    expect(codigo).not.toMatch(/will-change|willChange|translate|transform/);
  });
});
