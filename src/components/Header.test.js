import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
