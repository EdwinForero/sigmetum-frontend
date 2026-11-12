import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import Header from './Header';

vi.mock('./Navbar', () => ({ default: () => null }));
vi.mock('./LanguageSwitcher', () => ({ default: () => null }));

describe('Header', () => {
  afterEach(() => {
    document.head.querySelectorAll("link[rel='icon']").forEach((el) => el.remove());
  });

  it('no reescribe el href del favicon', () => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.setAttribute('href', 'https://x.test/icono.jpg');
    document.head.appendChild(link);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(link.getAttribute('href')).toBe('https://x.test/icono.jpg');
  });

  it('el enlace de inicio se llama SIGMETUM-A y el logo es decorativo', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'SIGMETUM-A' })).toHaveAttribute('href', '/');
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('el enlace del logo tiene un objetivo de al menos 44 px de alto sin crecer más que la cabecera de 64 px', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const enlace = screen.getByRole('link', { name: 'SIGMETUM-A' });
    expect(enlace).toHaveClass('min-h-11');
    expect(enlace.closest('header')).toHaveClass('h-16');
  });

  describe('sombra con scroll', () => {
    const setScrollY = (value) => {
      Object.defineProperty(window, 'scrollY', { value, configurable: true, writable: true });
    };

    afterEach(() => setScrollY(0));

    it('arriba del todo no hay sombra ni borde fijo de marca', () => {
      render(<MemoryRouter><Header /></MemoryRouter>);

      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('shadow-md');
      expect(header.className).not.toMatch(/border-b-2|border-brand/);
      expect(header).toHaveClass('transition-shadow', 'motion-reduce:transition-none');
    });

    it('aparece con scrollY > 0 y desaparece al volver a 0', () => {
      render(<MemoryRouter><Header /></MemoryRouter>);
      const header = screen.getByRole('banner');

      act(() => {
        setScrollY(40);
        window.dispatchEvent(new Event('scroll'));
      });
      expect(header).toHaveClass('shadow-md');

      act(() => {
        setScrollY(0);
        window.dispatchEvent(new Event('scroll'));
      });
      expect(header).not.toHaveClass('shadow-md');
    });

    it('comprueba el scroll inicial al montar (página recargada a mitad)', () => {
      setScrollY(120);
      render(<MemoryRouter><Header /></MemoryRouter>);

      expect(screen.getByRole('banner')).toHaveClass('shadow-md');
    });

    it('el escuchador del scroll es pasivo y se retira al desmontar', () => {
      const add = vi.spyOn(window, 'addEventListener');
      const remove = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<MemoryRouter><Header /></MemoryRouter>);

      const call = add.mock.calls.find(([type]) => type === 'scroll');
      expect(call[2]).toMatchObject({ passive: true });
      unmount();
      expect(remove.mock.calls.some(([type, handler]) => type === 'scroll' && handler === call[1])).toBe(true);
      add.mockRestore();
      remove.mockRestore();
    });
  });

  describe('a 320 px', () => {
    it('usa el relleno reducido bajo 360 px y el gutter desde 360 px', () => {
      render(<MemoryRouter><Header /></MemoryRouter>);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('px-stack-sm', 'min-[360px]:px-gutter');
      expect(header.className).not.toMatch(/(^|\s)(px-2|sm:px-4)(\s|$)/);
    });

    it('el nombre se oculta visualmente bajo 360 px pero el enlace conserva su nombre accesible', () => {
      render(<MemoryRouter><Header /></MemoryRouter>);

      const enlace = screen.getByRole('link', { name: 'SIGMETUM-A' });
      expect(enlace).toHaveAttribute('aria-label', 'SIGMETUM-A');
      expect(enlace.querySelector('p')).toHaveClass('max-[359px]:sr-only');
    });
  });

  it('el logo declara width y height y el nombre usa text-brand en la A (sin hex)', () => {
    const { container } = render(<MemoryRouter><Header /></MemoryRouter>);

    const logo = container.querySelector('img');
    expect(logo).toHaveAttribute('width');
    expect(logo).toHaveAttribute('height');
    expect(logo).toHaveClass('w-auto');
    expect(container.querySelector('span.text-brand')).toHaveTextContent('A');
    expect(container.innerHTML).not.toMatch(/#15B659|\[#/);
  });
});
