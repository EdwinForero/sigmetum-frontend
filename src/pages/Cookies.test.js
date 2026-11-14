import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Cookies from './Cookies';

const classesOf = (element) => [...element.classList];

describe('Cookies', () => {
  it('tiene un solo h1 dentro de un article con contenedor común y relleno de página', () => {
    const { container } = render(<Cookies />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(container.querySelector('article')).toHaveClass('page-container', 'pt-stack-xl', 'md:pt-section', 'pb-section', 'md:pb-section-lg');
  });

  it('una columna de lectura contiene el h1 y las seis secciones con filetes moss', () => {
    const { container } = render(<Cookies />);

    const columna = container.querySelector('article > div');
    expect(columna).toHaveClass('max-w-prose', 'text-base', 'md:text-lg', 'text-ink-soft');
    expect(columna.querySelector(':scope > h1')).toHaveClass('text-4xl', 'md:text-5xl', 'text-brand-deep');
    const filetes = columna.querySelector(':scope > div');
    expect(filetes).toHaveClass('mt-stack-lg', 'divide-y', 'divide-moss');
    expect(filetes.children).toHaveLength(6);
    for (const seccion of filetes.children) {
      expect(seccion.tagName).toBe('SECTION');
      expect(seccion).toHaveClass('py-stack-lg', 'md:py-stack-xl', 'first:pt-0', 'last:pb-0');
      expect(seccion.querySelector(':scope > h2')).toHaveClass('text-2xl', 'md:text-4xl');
    }
  });

  it('el texto va a la izquierda, dentro de la medida de lectura, sin justificar y sin pre-line', () => {
    const { container } = render(<Cookies />);

    const parrafos = container.querySelectorAll('p');
    expect(parrafos.length).toBeGreaterThan(10);
    for (const p of parrafos) {
      expect(p.closest('.max-w-prose')).not.toBeNull();
      expect(p).not.toHaveClass('max-w-prose');
    }
    expect(container.querySelectorAll('.max-w-prose')).toHaveLength(1);
    expect(container.innerHTML).not.toMatch(/text-center|text-justify|pre-line|iconButton\.scrollDown/);
    expect(container.textContent).not.toMatch(/•/);
  });

  it('cada una de las seis section aparece por scroll, sin anidar y sin animar el h1', () => {
    const { container } = render(<Cookies />);

    const secciones = container.querySelectorAll('section');
    expect(secciones).toHaveLength(6);
    for (const seccion of secciones) expect(seccion).toHaveAttribute('data-reveal');
    expect(container.querySelectorAll('[data-reveal]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-reveal] [data-reveal]')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveAttribute('data-reveal');
  });

  it('las listas son ul reales de 2, 5, 4 y 8 elementos y cada li cuelga de un ul', () => {
    const { container } = render(<Cookies />);

    const listas = [...container.querySelectorAll('ul')];
    expect(listas.map((lista) => lista.children.length)).toEqual([2, 5, 4, 8]);
    expect(container.querySelectorAll('ol, dl')).toHaveLength(0);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(19);
    for (const item of items) expect(item.parentElement.tagName).toBe('UL');
    // Tipos y usos llevan viñetas de prosa; categorías y enlaces, no (y por eso role="list").
    expect(listas[0]).toHaveClass('mt-stack-lg', 'list-disc', 'space-y-stack-sm', 'pl-stack-lg');
    expect(listas[1]).toHaveClass('list-disc', 'space-y-stack-sm', 'pl-stack-lg');
    expect(listas[0]).not.toHaveAttribute('role');
    expect(listas[1]).not.toHaveAttribute('role');
    expect(listas[2]).toHaveAttribute('role', 'list');
    expect(listas[2]).toHaveClass('mt-stack-lg', 'space-y-stack-xl');
    expect(listas[3]).toHaveAttribute('role', 'list');
    expect(listas[3]).toHaveClass('mt-stack');
  });

  it('los usos van en un bloque de párrafo, lista y cierre; los tipos, sin párrafos', () => {
    const { container } = render(<Cookies />);

    const secciones = container.querySelectorAll('section');
    const tipos = secciones[2];
    expect(tipos.querySelectorAll('p')).toHaveLength(0);
    expect(tipos.querySelector(':scope > ul')).toHaveClass('mt-stack-lg', 'list-disc');
    expect(tipos.textContent).toContain('cookies.typeFirstParty');
    expect(tipos.textContent).toContain('cookies.typeThirdParty');
    const usos = secciones[3].querySelector(':scope > div');
    expect(usos).toHaveClass('mt-stack-lg', 'space-y-stack');
    expect([...usos.children].map((hijo) => hijo.tagName)).toEqual(['P', 'UL', 'P']);
    expect(usos.children[0]).toHaveTextContent('cookies.usesIntro');
    expect(usos.children[2]).toHaveTextContent('cookies.usesClosing');
  });

  it('las categorías son li con un h3 y un párrafo, sin numeración escrita', () => {
    const { container } = render(<Cookies />);

    const categorias = container.querySelectorAll('section')[4].querySelectorAll(':scope > ul > li');
    expect(categorias).toHaveLength(4);
    for (const categoria of categorias) {
      expect(categoria.querySelector(':scope > h3')).toHaveClass('text-xl', 'md:text-2xl', 'md:leading-tight');
      expect(categoria.querySelector(':scope > p')).toHaveClass('mt-stack');
    }
    expect(categorias[0].querySelector('h3')).toHaveTextContent('cookies.subtitleFirstCookiesCategory');
    for (const h3 of container.querySelectorAll('h3')) expect(h3.textContent).not.toMatch(/^\d+[.)]/);
  });

  it('en «Gestión» dos párrafos, el h3 a 32 px de ellos y la lista de enlaces a 16 px', () => {
    const { container } = render(<Cookies />);

    const gestion = container.querySelectorAll('section')[5];
    expect([...gestion.children].map((hijo) => hijo.tagName)).toEqual(['H2', 'DIV', 'H3', 'UL']);
    expect(gestion.children[1]).toHaveClass('mt-stack-lg', 'space-y-stack');
    expect([...gestion.children[1].children].map((hijo) => hijo.textContent)).toEqual([
      'cookies.descriptionCookiesManagement',
      'cookies.descriptionCookiesManagementBrowser',
    ]);
    expect(gestion.children[2]).toHaveClass('mt-stack-xl', 'md:leading-tight');
    expect(gestion.children[3]).toHaveClass('mt-stack');
  });

  it('dentro de un contenedor space-y ningún hijo lleva mt', () => {
    const { container } = render(<Cookies />);

    const contenedores = container.querySelectorAll('[class*="space-y-"]');
    expect(contenedores.length).toBeGreaterThan(5);
    for (const contenedor of contenedores) {
      for (const hijo of contenedor.children) expect(classesOf(hijo).filter((clase) => /(^|:)-?mt-/.test(clase))).toEqual([]);
    }
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

  it('los separadores son divide-moss y el código no usa hex, azul de Tailwind, pre-line ni max-w-prose por párrafo', () => {
    const { container } = render(<Cookies />);
    const codigo = readFileSync('src/pages/Cookies.js', 'utf8');

    expect(container.querySelectorAll('.divide-moss')).toHaveLength(1);
    expect(codigo).not.toMatch(/\[#|blue-|ScrollIndicator|http:\/\/|whitespace-pre|max-w-prose/);
  });
});
