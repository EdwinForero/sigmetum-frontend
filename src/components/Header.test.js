import React from 'react';
import { render } from '@testing-library/react';
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
});
