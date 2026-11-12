import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from './About';

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }));

describe('About', () => {
  it('tiene un h1 en brand-deep y tres h2 en forest', () => {
    render(<About />);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(h1).toHaveTextContent('aboutUs.title');
    expect(h1).toHaveClass('text-brand-deep', 'font-bold');
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s).toHaveLength(3);
    for (const h2 of h2s) expect(h2).toHaveClass('text-forest');
  });

  it('la introducción va a la izquierda con medida de lectura', () => {
    render(<About />);

    expect(screen.getByText('aboutUs.ourWorkTeam')).toHaveClass('max-w-prose', 'text-lg', 'text-ink-soft');
  });

  it('la imagen es decorativa, reserva su caja y no es diferida (primera pantalla)', () => {
    const { container } = render(<About />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('width', '1200');
    expect(img).toHaveAttribute('height', '500');
    expect(img).not.toHaveAttribute('loading', 'lazy');
    expect(img).toHaveClass('aspect-[12/5]', 'object-cover', 'rounded-lg');
  });

  it('las tarjetas son una lista de tres, iguales, con borde fino salvia', () => {
    const { container } = render(<About />);

    const lista = screen.getByRole('list');
    expect(lista).toHaveClass('page-container', 'grid', 'gap-stack-lg', 'md:grid-cols-3');
    const tarjetas = screen.getAllByRole('listitem');
    expect(tarjetas).toHaveLength(3);
    for (const tarjeta of tarjetas) {
      expect(tarjeta).toHaveClass('rounded-lg', 'border', 'border-sage', 'bg-sage-soft', 'p-stack-lg');
    }
    expect(container.innerHTML).not.toMatch(/text-justify|min-h-|iconButton\.scrollDown/);
  });

  it('el código no usa hex, motion ni ScrollIndicator', () => {
    const codigo = readFileSync('src/pages/About.js', 'utf8');

    expect(codigo).not.toMatch(/\[#|motion\/react|ScrollIndicator|justify|min-h-/);
  });
});
