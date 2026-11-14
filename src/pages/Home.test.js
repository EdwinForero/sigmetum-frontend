import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Home from './Home';

// El simulacro expone onSent con un botón para comprobar a dónde va el foco tras un envío correcto.
vi.mock('../components/ContactForm', () => ({
  default: ({ onSent }) => (
    <form aria-label="contacto">
      <button type="button" onClick={onSent}>
        simular-enviado
      </button>
    </form>
  ),
}));
vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const HERO = '[class*="min-h-[calc(100svh-4rem)]"]';

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe('hero', () => {
    it('tiene un solo h1, sin mayúsculas forzadas, y el subtítulo es un párrafo', () => {
      renderHome();

      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent('home.title');
      expect(h1s[0]).toHaveClass('font-bold', 'max-w-3xl', 'leading-tight', 'text-surface');
      expect(h1s[0]).not.toHaveClass('uppercase', 'font-black');
      expect(screen.getByText('home.subtitle').tagName).toBe('P');
    });

    it('los dos CTA son enlaces (sin botón dentro): Explorar principal y Galería alternativo', () => {
      renderHome();

      const explorar = screen.getByRole('link', { name: 'home.exploreButton' });
      const galeria = screen.getByRole('link', { name: 'home.galleryButton' });
      expect(explorar).toHaveAttribute('href', '/explore');
      expect(galeria).toHaveAttribute('href', '/gallery');
      expect(explorar.querySelector('button')).toBeNull();
      expect(galeria.querySelector('button')).toBeNull();
      expect(explorar).toHaveClass('bg-brand');
      expect(galeria).toHaveClass('border-brand-dark', 'bg-surface');
    });

    it('es de alto de pantalla menos la cabecera, con velo uniforme (sin degradado lateral)', () => {
      const { container } = renderHome();

      const hero = screen.getByRole('heading', { level: 1 }).closest(HERO);
      expect(hero).not.toBeNull();
      expect(hero).toHaveClass('relative', 'flex', 'flex-col');
      expect(container.innerHTML).not.toMatch(/bg-gradient-to-r|from-ink/);
    });

    it('la flecha está dentro del hero, en el flujo, sin fixed ni absolute', () => {
      renderHome();

      const hero = screen.getByRole('heading', { level: 1 }).closest(HERO);
      const flecha = within(hero).getByRole('button', { name: 'iconButton.scrollDown' });
      expect(flecha.closest('.absolute, .fixed')).toBeNull();
      expect(screen.getAllByRole('button', { name: 'iconButton.scrollDown' })).toHaveLength(1);
    });
  });

  it('la banda de descripción es la sección de destino de la flecha, sobre ink', () => {
    renderHome();

    const banda = document.getElementById('home-descripcion');
    expect(banda.tagName).toBe('SECTION');
    expect(banda).toHaveClass('bg-ink', 'py-section', 'md:py-section-lg');
    expect(within(banda).getByText('home.descriptionContent')).toHaveClass('text-surface', 'font-bold');
  });

  describe('colaboradores', () => {
    it('lista UMA con sus nombres, y 4 universidades más 3 entidades, todas con enlace https seguro', () => {
      renderHome();

      expect(screen.getByRole('heading', { level: 2, name: 'home.projectLeaderTitle' })).toHaveClass('text-brand-deep');
      expect(screen.getByRole('heading', { level: 3, name: 'home.otherUniversitiesTitle' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'home.collaboratingEntitiesTitle' })).toBeInTheDocument();

      const logos = screen.getAllByRole('link').filter((link) => link.getAttribute('target') === '_blank');
      expect(logos).toHaveLength(8);
      for (const logo of logos) {
        expect(logo.getAttribute('href')).toMatch(/^https:\/\//);
        expect(logo).toHaveAttribute('rel', 'noopener noreferrer');
      }
      const nombre = screen.getByText('Noelia Hidalgo Triana');
      expect(nombre.tagName).toBe('LI');
      expect(nombre).toHaveClass('text-base', 'text-ink-soft');
    });

    it('los encabezados y los bloques de entidades van centrados dentro de .page-container', () => {
      renderHome();

      const titulo = screen.getByRole('heading', { level: 2, name: 'home.projectLeaderTitle' });
      expect(titulo).toHaveClass('text-center');
      expect(titulo.closest('.page-container')).not.toBeNull();
      for (const name of ['home.otherUniversitiesTitle', 'home.collaboratingEntitiesTitle']) {
        expect(screen.getByRole('heading', { level: 3, name })).toHaveClass('text-center');
      }
      const lider = screen.getByRole('link', { name: /institutions\.uma/ }).parentElement;
      expect(lider).toHaveClass('flex', 'flex-col', 'items-center', 'gap-stack-sm');
      const nombres = screen.getByText('Noelia Hidalgo Triana').parentElement;
      expect(nombres).toHaveClass('w-full', 'text-center', 'sm:columns-2', 'lg:columns-3', 'gap-x-stack-xl');
      const otra = screen.getByText('Juan F. Mota Poveda').parentElement;
      expect(otra.className).not.toMatch(/columns-/);
      expect(otra).toHaveClass('w-full', 'text-center');
      const universidad = screen.getByRole('link', { name: /institutions\.ual/ }).parentElement;
      expect(universidad).toHaveClass('flex', 'flex-col', 'items-center', 'gap-stack-sm', 'text-center');
      const entidad = screen.getAllByRole('link').filter((l) => l.getAttribute('target') === '_blank').at(-1).parentElement;
      expect(entidad).toHaveClass('flex', 'flex-col', 'items-center', 'text-center');
      expect(entidad.parentElement).toHaveClass('sm:grid-cols-3');
    });
  });

  describe('ritmo vertical', () => {
    it('la sección de entidades no lleva relleno inferior: el de #contacto es el único entre ambas', () => {
      renderHome();

      const entidades = document.getElementById('home-descripcion').nextElementSibling;
      expect(entidades.tagName).toBe('SECTION');
      expect(entidades).toHaveClass('page-container', 'pt-section', 'md:pt-section-lg');
      expect(entidades.className).not.toMatch(/(^|\s)(md:)?(py|pb)-/);
      expect(entidades.nextElementSibling).toBe(document.getElementById('contacto'));
    });

    it('los h3 de colaboradores van a 32 px del bloque anterior y a 16 px de su contenido', () => {
      renderHome();

      for (const name of ['home.otherUniversitiesTitle', 'home.collaboratingEntitiesTitle']) {
        const h3 = screen.getByRole('heading', { level: 3, name });
        expect(h3).toHaveClass('mt-stack-xl');
        expect(h3.className).not.toMatch(/mt-section/);
        expect(h3.nextElementSibling).toHaveClass('mt-stack', 'grid');
      }
    });
  });

  describe('contacto', () => {
    it('es la sección #contacto con rejilla de dos columnas desde md', () => {
      renderHome();

      const contacto = document.getElementById('contacto');
      expect(contacto.tagName).toBe('SECTION');
      expect(contacto).toHaveClass('page-container', 'py-section', 'md:py-section-lg');
      expect(contacto.querySelector('.grid')).toHaveClass('gap-stack-xl', 'md:grid-cols-2');
      expect(within(contacto).getByRole('form', { name: 'contacto' })).toBeInTheDocument();
    });

    it('cada bloque de la columna usa h3 y párrafos de 16 px, con filete moss', () => {
      renderHome();

      for (const title of ['home.emailTitle', 'home.locationLabel']) {
        const h3 = screen.getByRole('heading', { level: 3, name: title });
        expect(h3).toHaveClass('text-xl', 'md:text-2xl', 'font-bold', 'text-brand-deep');
        expect(h3.parentElement).toHaveClass('border-t', 'border-moss', 'pt-stack-lg');
      }
      const ubicacion = screen.getByText('home.locationContent');
      expect(ubicacion.tagName).toBe('P');
      expect(ubicacion).toHaveClass('mt-stack', 'text-base', 'text-ink', 'whitespace-pre-line');
      expect(ubicacion.parentElement).toHaveClass('border-b', 'border-moss', 'pb-stack-lg');
      expect(ubicacion.parentElement.className).not.toMatch(/ink-soft/);
    });
  });

  it('tras un envío correcto (onSent) el foco pasa al h2 de contacto', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: 'simular-enviado' }));

    const h2 = within(document.getElementById('contacto')).getByRole('heading', { level: 2 });
    expect(document.activeElement).toBe(h2);
    expect(h2).toHaveAttribute('tabindex', '-1');
    expect(h2).toHaveClass('focus-heading');
  });

  describe('enlace a /#contacto', () => {
    const GoContact = () => {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/#contacto')}>ir</button>;
    };

    const renderAt = (entry) =>
      render(
        <MemoryRouter initialEntries={[entry]}>
          <GoContact />
          <Home />
        </MemoryRouter>
      );

    it('sin hash no se desplaza a ningún sitio al montar', () => {
      renderAt('/');

      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it('al montar con #contacto lleva esa sección a la vista', () => {
      renderAt('/#contacto');

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
      expect(Element.prototype.scrollIntoView.mock.contexts[0]).toBe(document.getElementById('contacto'));
    });

    it('con #contacto el foco va al h2 de contacto (tabIndex -1, .focus-heading)', () => {
      renderAt('/#contacto');

      const h2 = within(document.getElementById('contacto')).getByRole('heading', { level: 2 });
      expect(document.activeElement).toBe(h2);
      expect(h2).toHaveAttribute('tabindex', '-1');
      expect(h2).toHaveClass('focus-heading');
    });

    it('al navegar a /#contacto estando en Home el foco pasa al h2', async () => {
      const user = userEvent.setup();
      renderAt('/');

      await user.click(screen.getByRole('button', { name: 'ir' }));

      expect(document.activeElement).toBe(
        within(document.getElementById('contacto')).getByRole('heading', { level: 2 })
      );
    });

    it('con la flecha del hero el foco pasa a la banda de descripción', async () => {
      const user = userEvent.setup();
      renderAt('/');

      await user.click(screen.getByRole('button', { name: 'iconButton.scrollDown' }));

      const banda = document.getElementById('home-descripcion');
      expect(document.activeElement).toBe(banda);
      expect(banda).toHaveAttribute('tabindex', '-1');
      expect(banda).toHaveClass('focus-heading');
    });

    it('un hash que no existe no rompe nada', () => {
      renderAt('/#no-existe');

      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it('navegar a /#contacto estando en Home lo lleva a la vista, y pulsar de nuevo (misma ruta, otra key) lo repite', async () => {
      const user = userEvent.setup();
      renderAt('/');

      await user.click(screen.getByRole('button', { name: 'ir' }));
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: 'ir' }));
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
    });
  });

  it('un solo botón principal relleno y nada oculto por revelado de scroll', () => {
    const { container } = renderHome();

    expect(container.querySelectorAll('.bg-brand')).toHaveLength(1);
    expect(container.querySelector('[style*="opacity"]')).toBeNull();
  });

  describe('aparición por scroll (Reveal)', () => {
    it('anima el bloque del líder, los dos h3, las 4 universidades y las 3 entidades, sin anidar', () => {
      const { container } = renderHome();

      const animados = container.querySelectorAll('[data-reveal]');
      expect(animados).toHaveLength(10);
      expect(container.querySelectorAll('[data-reveal] [data-reveal]')).toHaveLength(0);
      for (const name of ['home.otherUniversitiesTitle', 'home.collaboratingEntitiesTitle']) {
        expect(screen.getByRole('heading', { level: 3, name })).toHaveAttribute('data-reveal');
      }
      expect(screen.getByRole('link', { name: /institutions\.uma/ }).parentElement).toHaveAttribute('data-reveal');
    });

    it('nada en el hero, en #home-descripcion ni en #contacto (destinos de ancla y foco)', () => {
      const { container } = renderHome();

      for (const zona of [container.querySelector(HERO), container.querySelector('#home-descripcion'), container.querySelector('#contacto')]) {
        expect(zona).not.toBeNull();
        expect(zona).not.toHaveAttribute('data-reveal');
        expect(zona.querySelector('[data-reveal]')).toBeNull();
      }
      expect(screen.getByRole('heading', { level: 2, name: 'home.projectLeaderTitle' })).not.toHaveAttribute('data-reveal');
    });

    it('las universidades y las entidades se escalonan por su índice', () => {
      const instancias = [];
      vi.stubGlobal('IntersectionObserver', class {
        constructor(callback) { this.callback = callback; instancias.push(this); }
        observe() {}
        unobserve() {}
        disconnect() {}
      });
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000, bottom: 5100, height: 100 });
      try {
        const { container } = renderHome();
        const animados = [...container.querySelectorAll('[data-reveal]')];
        act(() => instancias[0].callback(animados.map((target) => ({ target, isIntersecting: true }))));

        const retraso = (id) => screen.getByRole('link', { name: new RegExp(`institutions\\.${id}`) }).parentElement.style.transitionDelay;
        expect(['ual', 'ugr', 'uhu', 'uja'].map(retraso)).toEqual(['0ms', '60ms', '120ms', '180ms']);
      } finally {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
      }
    });
  });

  it('el código no usa hex, grises de Tailwind, font-black ni motion', () => {
    const codigo = readFileSync('src/pages/Home.js', 'utf8');

    expect(codigo).not.toMatch(/\[#|gray-|font-black|font-semibold|font-medium|motion\/react|UseAtBottom|http:\/\//);
  });
});
