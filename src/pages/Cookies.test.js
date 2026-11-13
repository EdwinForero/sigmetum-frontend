import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Cookies from './Cookies';

describe('Cookies', () => {
  it('tiene un solo h1 dentro de un article con contenedor común', () => {
    const { container } = render(<Cookies />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('article')).toHaveClass('page-container', 'pt-stack-xl', 'md:pt-section', 'pb-section');
  });

  it('el texto va a la izquierda, con medida de lectura y sin justificar', () => {
    const { container } = render(<Cookies />);

    const parrafos = container.querySelectorAll('p');
    expect(parrafos.length).toBeGreaterThan(5);
    for (const p of parrafos) expect(p).toHaveClass('max-w-prose', 'text-ink-soft');
    expect(container.innerHTML).not.toMatch(/text-center|text-justify|iconButton\.scrollDown/);
  });

  it('cada una de las cuatro section aparece por scroll, sin anidar y sin animar el h1', () => {
    const { container } = render(<Cookies />);

    const secciones = container.querySelectorAll('section');
    expect(secciones).toHaveLength(4);
    for (const seccion of secciones) expect(seccion).toHaveAttribute('data-reveal');
    expect(container.querySelectorAll('[data-reveal]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-reveal] [data-reveal]')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveAttribute('data-reveal');
  });

  it('ningún enlace va dentro de un párrafo', () => {
    const { container } = render(<Cookies />);

    expect(container.querySelectorAll('p a')).toHaveLength(0);
  });

  it('«Más información» lista 8 enlaces https con rel, 44 px, icono oculto y aviso de pestaña nueva', () => {
    render(<Cookies />);

    expect(screen.getByRole('heading', { level: 3, name: 'cookies.moreInfoTitle' })).toBeInTheDocument();
    const enlaces = screen.getAllByRole('link');
    expect(enlaces).toHaveLength(8);
    for (const enlace of enlaces) {
      expect(enlace.getAttribute('href')).toMatch(/^https:\/\//);
      expect(enlace).toHaveAttribute('target', '_blank');
      expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
      expect(enlace).toHaveClass('inline-flex', 'min-h-11', 'items-center', 'gap-stack-sm', 'text-brand-deep', 'underline', 'focus-ring');
      expect(enlace.querySelector('.material-symbols-outlined')).toHaveAttribute('aria-hidden', 'true');
      expect(enlace.querySelector('.sr-only')).toHaveTextContent('a11y.opensInNewTab');
    }
    expect(screen.getByRole('link', { name: /cookies\.linkIco/ })).toHaveAttribute('href', 'https://ico.org.uk/');
    expect(screen.getByRole('link', { name: /cookies\.linkAboutCookies/ })).toHaveAttribute('href', 'https://www.aboutcookies.org');
    expect(screen.getByRole('link', { name: /cookies\.browserChrome/ })).toBeInTheDocument();
  });

  it('los separadores son border-moss y el código no usa hex ni azul de Tailwind', () => {
    const { container } = render(<Cookies />);
    const codigo = readFileSync('src/pages/Cookies.js', 'utf8');

    expect(container.querySelectorAll('.border-moss').length).toBeGreaterThan(0);
    expect(codigo).not.toMatch(/\[#|blue-|ScrollIndicator|http:\/\//);
  });
});
