import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe('Footer', () => {
  it('tiene tres h2: instituciones, contacto y enlaces', () => {
    renderFooter();

    expect(screen.getAllByRole('heading').map((h) => [h.tagName, h.textContent])).toEqual([
      ['H2', 'footer.institutionsTitle'],
      ['H2', 'footer.contactTitle'],
      ['H2', 'footer.linksTitle'],
    ]);
  });

  it('el pie es bg-ink con tres columnas 2fr 1fr 1fr desde md dentro de .page-container', () => {
    const { container } = renderFooter();

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-ink', 'text-surface');
    const grid = footer.querySelector('.page-container');
    expect(grid).toHaveClass('py-section', 'grid', 'gap-stack-xl', 'md:grid-cols-[2fr_1fr_1fr]');
  });

  it('los cinco logos van en UNA sola placa rounded-xl bg-surface p-stack, a color y del mismo alto', () => {
    const { container } = renderFooter();

    const placas = container.querySelectorAll('.rounded-xl.bg-surface.p-stack');
    expect(placas).toHaveLength(1);
    const logos = placas[0].querySelectorAll('a[target="_blank"]');
    expect(logos).toHaveLength(5);
    expect(placas[0].querySelector('.grid')).not.toBeNull();
    logos.forEach((logo) => {
      expect(logo).toHaveClass('h-16');
      expect(logo.getAttribute('href')).toMatch(/^https:\/\//);
      expect(logo).toHaveAttribute('rel', 'noopener noreferrer');
    });
    expect(container.innerHTML).not.toMatch(/grayscale/);
    expect(screen.getByRole('img', { name: 'institutions.uma' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(5);
  });

  it('el contacto muestra la dirección y un enlace a /#contacto', () => {
    renderFooter();

    expect(screen.getByText('home.locationContent')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'footer.contactFormLink' })).toHaveAttribute('href', '/#contacto');
  });

  it('los enlaces internos son Inicio, Explorar, Galería, Sobre nosotros y Cookies, en una lista vertical', () => {
    const { container } = renderFooter();

    const lista = container.querySelector('ul');
    expect([...lista.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent])).toEqual([
      ['/', 'footer.homeOption'],
      ['/explorar', 'footer.exploreOption'],
      ['/galeria', 'footer.galleryOption'],
      ['/sobre-nosotros', 'footer.aboutUsOption'],
      ['/cookies', 'footer.cookies'],
    ]);
    expect(screen.getByText(/footer\.copyright/)).toBeInTheDocument();
  });

  it('los cinco enlaces van en rejilla de dos columnas bajo md y una columna desde md, cada uno de al menos 44 px', () => {
    const { container } = renderFooter();

    const lista = container.querySelector('ul');
    expect(lista).toHaveClass('grid', 'grid-cols-2', 'gap-x-stack', 'md:grid-cols-1');
    expect(lista).not.toHaveClass('flex-col');
    const enlaces = [...lista.querySelectorAll('a')];
    expect(enlaces).toHaveLength(5);
    enlaces.forEach((a) => expect(a).toHaveClass('min-h-11'));
    expect(lista.querySelectorAll(':scope > li')).toHaveLength(5);
  });

  it('hay un solo contentinfo (un único footer)', () => {
    const { container } = renderFooter();

    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(container.querySelectorAll('footer')).toHaveLength(1);
  });

  it('la versión es un summary que despliega el texto de ee', () => {
    const { container } = renderFooter();

    const summary = container.querySelector('details > summary');
    expect(summary).toHaveTextContent('V 1.0.0');
    expect(summary).toHaveClass('focus-ring');
    // Amaranth solo se carga en 700: sin font-bold el navegador sintetizaría el peso.
    expect(summary).toHaveClass('font-bold');
    expect(container.querySelector('details > p')).toHaveTextContent('ee');
  });

  it('los enlaces tienen anillo de foco y objetivo de 44 px (los logos miden 64 px)', () => {
    renderFooter();

    screen.getAllByRole('link').forEach((link) => {
      expect(link).toHaveClass('focus-ring');
      expect(link.className).toMatch(/min-h-11|h-16/);
    });
    expect(screen.getByRole('link', { name: 'footer.homeOption' })).toHaveClass('min-h-11', 'hover:underline');
  });
});
