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

    expect(screen.getByText('aboutUs.ourWorkTeam')).toHaveClass('max-w-prose', 'text-base', 'md:text-lg', 'text-ink-soft');
  });

  it('desde lg la primera sección es de dos columnas: el párrafo a la izquierda y la imagen a la derecha', () => {
    const { container } = render(<About />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('page-container', 'lg:grid', 'lg:grid-cols-2', 'lg:gap-x-stack-lg', 'lg:gap-y-stack-lg');
    expect(section).not.toHaveClass('lg:grid-cols-3');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('lg:col-span-2');
    expect(screen.getByText('aboutUs.ourWorkTeam')).toHaveClass('lg:col-start-1', 'lg:row-start-2', 'lg:mt-0', 'max-w-prose');
    const img = container.querySelector('img');
    expect(img).toHaveClass('lg:col-start-2', 'lg:row-start-2', 'lg:mt-0', 'lg:aspect-auto', 'lg:h-0', 'lg:min-h-full');
    expect(img).not.toHaveClass('lg:h-full');
    expect(img).not.toHaveClass('lg:col-span-3');
  });

  it('el orden del DOM es h1, imagen y párrafo', () => {
    const { container } = render(<About />);

    const h1 = screen.getByRole('heading', { level: 1 });
    const img = container.querySelector('img');
    const parrafo = screen.getByText('aboutUs.ourWorkTeam');
    expect(h1.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(img.compareDocumentPosition(parrafo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('conserva el ritmo vertical entre h1, párrafo e imagen en todos los anchos', () => {
    const { container } = render(<About />);

    expect(container.querySelector('section')).toHaveClass('lg:gap-y-stack-lg');
    const parrafo = screen.getByText('aboutUs.ourWorkTeam');
    expect(parrafo).toHaveClass('mt-stack-lg', 'lg:mt-0');
    expect(container.querySelector('img')).toHaveClass('mt-stack-lg', 'lg:mt-0');
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

  it('las tarjetas son una lista de tres, iguales, con borde fino salvia; la larga ocupa sola la segunda fila', () => {
    const { container } = render(<About />);

    const lista = screen.getByRole('list');
    expect(lista).toHaveAttribute('role', 'list');
    expect(lista).toHaveClass('page-container', 'grid', 'gap-stack-lg', 'lg:grid-cols-2');
    expect(lista).not.toHaveClass('md:grid-cols-3');
    expect(lista).not.toHaveClass('lg:grid-cols-3');
    const tarjetas = screen.getAllByRole('listitem');
    expect(tarjetas).toHaveLength(3);
    for (const tarjeta of tarjetas) {
      expect(tarjeta).toHaveClass('rounded-lg', 'border', 'border-sage', 'bg-sage-soft', 'p-stack-lg');
      const texto = tarjeta.querySelector('p');
      expect(texto).toHaveClass('text-ink-soft', 'max-w-prose', 'mt-stack');
    }
    const anchas = tarjetas.filter((tarjeta) => tarjeta.classList.contains('lg:col-span-2'));
    expect(anchas).toHaveLength(1);
    expect(anchas[0]).toHaveTextContent('aboutUs.ourValuesContent');
    expect(container.innerHTML).not.toMatch(/text-justify|min-h-(?!full)|iconButton\.scrollDown/);
  });

  it('solo las tarjetas aparecen por scroll (li con Reveal); la primera sección y la imagen, no', () => {
    const { container } = render(<About />);

    const animados = container.querySelectorAll('[data-reveal]');
    expect(animados).toHaveLength(3);
    for (const el of animados) expect(el.tagName).toBe('LI');
    expect(container.querySelectorAll('[data-reveal] [data-reveal]')).toHaveLength(0);
    expect(container.querySelector('section')).not.toHaveAttribute('data-reveal');
    expect(container.querySelector('section').querySelector('[data-reveal]')).toBeNull();
  });

  it('el código no usa hex, motion ni ScrollIndicator', () => {
    const codigo = readFileSync('src/pages/About.js', 'utf8');

    expect(codigo).not.toMatch(/\[#|motion\/react|ScrollIndicator|justify|min-h-(?!full)/);
  });
});
