import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Explore from './Explore';
import ToastProvider from '../components/ToastProvider';
import { assetUrl } from '../config/assets';

vi.mock('../components/SpeciesCard', () => ({
  default: ({ species }) => <div data-testid="species">{species['Especies Características']}</div>,
}));
// Solo el recuento y el nombre de las «i» (infoAbout) interpolan: así se comprueban sin depender del idioma.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'explore.resultsInfo') return `${key} ${opts.currentResults}/${opts.totalResults}`;
      if (key === 'iconButton.infoAbout') return `${key} ${opts.topic}`;
      return key;
    },
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));
vi.mock('../utilities/CSVfunctions', () => ({ downloadXLSX: vi.fn() }));
vi.mock('../config/assets', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, assetUrl: vi.fn(() => 'https://cdn.example/glossary.pdf') };
});

const species = [
  { 'Especies Características': ['Quercus ilex', 'Pinus pinea'] },
  { 'Especies Características': ['Quercus ilex', 'Juniperus oxycedrus'] },
];

const ui = (props = {}) => (
  <ToastProvider>
    <Explore data={[]} filteredSpecies={species} selectedSpecies={new Set()} noItalicTerms={[]} {...props} />
  </ToastProvider>
);
const renderExplore = (props = {}) => render(ui(props));

// ToastProvider monta sus propias regiones alert y status: se comprueba el rol del propio bloque.
const roleOf = (title) => screen.getByRole('heading', { level: 2, name: title }).parentElement.getAttribute('role');
const h1Status = () => screen.getByRole('heading', { level: 1 }).nextElementSibling;

describe('Explore', () => {
  it('muestra el título, el recuento y una tarjeta por especie única ordenada', () => {
    renderExplore();

    expect(screen.getByRole('heading', { level: 1, name: 'explore.title' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText(/^explore.resultsInfo/)).toBeInTheDocument();
    expect(screen.getAllByTestId('species').map((el) => el.textContent)).toEqual([
      'Juniperus oxycedrus',
      'Pinus pinea',
      'Quercus ilex',
    ]);
  });

  it('el total es el de las especies únicas de los datos aunque Explore se monte cargando y luego se filtre', () => {
    const { rerender } = renderExplore({ data: null, filteredSpecies: [], isLoading: true });
    expect(screen.queryByText(/^explore.resultsInfo/)).toBeNull();

    rerender(ui({ data: species, filteredSpecies: species }));
    expect(screen.getByText('explore.resultsInfo 3/3')).toBeInTheDocument();

    rerender(ui({ data: species, filteredSpecies: [species[0]] }));
    expect(screen.getByText('explore.resultsInfo 2/3')).toBeInTheDocument();
  });

  it('al reintentar la carga el total se recalcula con los datos nuevos', () => {
    const { rerender } = renderExplore({ data: species, filteredSpecies: species });
    expect(screen.getByText('explore.resultsInfo 3/3')).toBeInTheDocument();

    rerender(ui({ data: null, filteredSpecies: [], isLoading: true }));
    const nuevos = [{ 'Especies Características': ['Quercus ilex'] }];
    rerender(ui({ data: nuevos, filteredSpecies: nuevos }));
    expect(screen.getByText('explore.resultsInfo 1/1')).toBeInTheDocument();
  });

  it('sin datos en la versión: h1, causa sin rol de aviso y sin botones de acción', () => {
    renderExplore({ data: [], filteredSpecies: [] });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2, name: 'explore.empty.noDataTitle' })).toBeInTheDocument();
    expect(screen.getByText('explore.empty.noDataCause')).toBeInTheDocument();
    expect(roleOf('explore.empty.noDataTitle')).toBeNull();
    expect(screen.queryByRole('button', { name: 'explore.empty.clearFilters' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'feedback.retry' })).toBeNull();
  });

  it('con datos pero sin especies y sin filtros activos se trata como sin datos', () => {
    const rows = [{ 'Especies Características': [] }];
    renderExplore({ data: rows, filteredSpecies: rows });

    expect(screen.getByRole('heading', { level: 2, name: 'explore.empty.noDataTitle' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'explore.empty.clearFilters' })).toBeNull();
  });

  it('con filtros que no dejan resultados: h1, causa y «Quitar filtros» que llama a onClearFilters', async () => {
    const onClearFilters = vi.fn();
    const user = userEvent.setup();
    renderExplore({ data: species, filteredSpecies: [], onClearFilters });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2, name: 'explore.empty.noResultsTitle' })).toBeInTheDocument();
    expect(screen.getByText('explore.empty.noResultsCause')).toBeInTheDocument();
    expect(roleOf('explore.empty.noResultsTitle')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'explore.empty.clearFilters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('«Quitar filtros» lleva el foco al h1 (enfocable por programa, con .focus-heading)', async () => {
    const user = userEvent.setup();
    renderExplore({ data: species, filteredSpecies: [], onClearFilters: vi.fn() });

    await user.click(screen.getByRole('button', { name: 'explore.empty.clearFilters' }));

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(document.activeElement).toBe(h1);
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1).toHaveClass('focus-heading');
  });

  it('con una selección de especies sin coincidencias también se ofrece quitar filtros', () => {
    renderExplore({ data: species, filteredSpecies: species, selectedSpecies: new Set(['Inexistente']) });

    expect(screen.getByRole('button', { name: 'explore.empty.clearFilters' })).toBeInTheDocument();
  });

  it('con error de carga: h1, aviso (alert) y «Reintentar» que llama a onRetry', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderExplore({ data: null, filteredSpecies: [], hasError: true, onRetry });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(roleOf('explore.empty.errorTitle')).toBe('alert');
    expect(screen.getByText('explore.empty.errorCause')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'feedback.retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('cargando: h1 y el nodo status con el texto de carga, sin tarjetas ni estados vacíos', () => {
    renderExplore({ data: null, filteredSpecies: [], isLoading: true });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(h1Status()).toHaveAttribute('role', 'status');
    expect(h1Status()).toHaveTextContent('feedback.loading');
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.queryByTestId('species')).toBeNull();
  });

  it('el nodo status está siempre montado justo tras el h1, también con datos (sin texto)', () => {
    renderExplore();

    const h1 = screen.getByRole('heading', { level: 1, name: 'explore.title' });
    expect(h1.nextElementSibling).toHaveAttribute('role', 'status');
    expect(h1.nextElementSibling).toBeEmptyDOMElement();
  });

  it('no usa posición absoluta ni alto mínimo fijo en la lista ni hex sueltos', () => {
    const { container } = renderExplore();

    const list = screen.getAllByTestId('species')[0].parentElement;
    expect(list).not.toHaveClass('absolute');
    expect(list.parentElement).not.toHaveClass('absolute', 'relative');
    expect(container.innerHTML).not.toMatch(/min-h-\[700px\]|\[#[0-9A-Fa-f]{3,8}\]|text-\[32px\]/);
    expect(screen.getByText(/^explore.resultsInfo/)).toHaveClass('text-moss');
  });

  it('el contenedor y la barra de herramientas no desbordan: sin whitespace-nowrap, con min-w-0, flex-wrap y gap', () => {
    renderExplore();

    const container = screen.getByRole('heading', { level: 1, name: 'explore.title' }).parentElement;
    expect(container).not.toHaveClass('whitespace-nowrap');
    expect(container).toHaveClass('min-w-0');
    const toolbar = screen.getByText(/^explore.resultsInfo/).parentElement;
    expect(toolbar).toHaveClass('flex-wrap', 'gap-2');
    expect(toolbar.className).not.toMatch(/\bw-\[\d+px\]|\bmin-w-\[\d+px\]/);
  });

  it('la barra va en dos filas: recuento con paginación y, aparte, las descargas con su «i»', () => {
    renderExplore();

    const bar = screen.getByText(/^explore.resultsInfo/).parentElement.parentElement;
    expect(bar).toHaveClass('flex', 'flex-col', 'gap-stack');
    const [filaPaginacion, filaDescargas] = bar.children;
    const paginacion = screen.getByText(/^explore.resultsInfo/).parentElement;
    expect(paginacion).toBe(filaPaginacion);
    expect(filaDescargas.contains(paginacion)).toBe(false);
    for (const name of ['explore.downloadGlossaryButton', 'explore.downloadExcelButton']) {
      const grupo = screen.getByRole('button', { name }).parentElement;
      expect(grupo).toHaveClass('flex', 'items-center', 'gap-stack-sm');
      expect(filaDescargas.contains(grupo)).toBe(true);
      expect(grupo.children).toHaveLength(2);
    }
  });

  it('las dos «i» de las descargas tienen nombres distintos, con el botón al que explican', () => {
    renderExplore();

    const glosario = screen.getByRole('button', { name: 'iconButton.infoAbout explore.downloadGlossaryButton' });
    const resultados = screen.getByRole('button', { name: 'iconButton.infoAbout explore.downloadExcelButton' });
    expect(glosario).not.toBe(resultados);
    expect(screen.queryByRole('button', { name: 'iconButton.info' })).toBeNull();
  });

  it('el título es verde oscuro de marca (brand-deep)', () => {
    renderExplore();

    expect(screen.getByRole('heading', { level: 1, name: 'explore.title' })).toHaveClass('text-brand-deep');
  });

  it('si la descarga del glosario falla avisa con un error persistente, sin diálogo', async () => {
    assetUrl.mockImplementationOnce(() => {
      throw new Error('sin url');
    });
    const user = userEvent.setup();
    renderExplore();

    await user.click(screen.getByText('explore.downloadGlossaryButton'));

    const aviso = await screen.findByText('dialogAdvice.errorDownloadFile');
    expect(aviso.closest('[role=alert]')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('aparición de las tarjetas (Reveal)', () => {
    const muchas = (n, prefijo = 'Especie') => [
      { 'Especies Características': Array.from({ length: n }, (_, i) => `${prefijo} ${String(i).padStart(2, '0')}`) },
    ];
    const originalWidth = window.innerWidth;

    beforeEach(() => {
      // IntersectionObserver que nunca avisa y todo por debajo del pliegue: las tarjetas empiezan ocultas.
      vi.stubGlobal('IntersectionObserver', class {
        observe() {}
        unobserve() {}
        disconnect() {}
      });
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000, bottom: 5100, height: 100 });
      window.innerWidth = 1024;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      window.innerWidth = originalWidth;
    });

    const ocultas = () => document.querySelectorAll('.reveal-hidden').length;

    it('cada tarjeta va en un Reveal con grid (se estira a la altura de la fila)', () => {
      renderExplore({ data: muchas(8), filteredSpecies: muchas(8) });

      const tarjetas = screen.getAllByTestId('species');
      expect(tarjetas).toHaveLength(8);
      for (const tarjeta of tarjetas) {
        expect(tarjeta.parentElement).toHaveAttribute('data-reveal');
        expect(tarjeta.parentElement).toHaveClass('grid');
      }
      expect(ocultas()).toBe(8);
    });

    it('cambiar selectedSpecies no deja ninguna tarjeta oculta', () => {
      const lista = muchas(8);
      const { rerender } = renderExplore({ data: lista, filteredSpecies: lista });
      expect(ocultas()).toBe(8);

      rerender(ui({ data: lista, filteredSpecies: lista, selectedSpecies: new Set(['Especie 01', 'Especie 02']) }));

      expect(screen.getAllByTestId('species')).toHaveLength(2);
      expect(ocultas()).toBe(0);
    });

    it('un re-render sin cambio de lista (p. ej. isLoading del padre) no apaga la animación de la primera lista', () => {
      const lista = muchas(8);
      const { rerender } = renderExplore({ data: lista, filteredSpecies: lista });

      rerender(ui({ data: lista, filteredSpecies: lista, isLoading: false }));

      expect(ocultas()).toBe(8);
    });

    it('cambiar el ancho (itemsPerPage) no deja ninguna tarjeta oculta', async () => {
      const lista = muchas(30);
      renderExplore({ data: lista, filteredSpecies: lista });
      expect(screen.getAllByTestId('species')).toHaveLength(16);

      window.innerWidth = 1300;
      await act(async () => {
        fireEvent(window, new Event('resize'));
      });

      expect(screen.getAllByTestId('species')).toHaveLength(24);
      expect(ocultas()).toBe(0);
    });

    it('tras paginar nada queda oculto', async () => {
      const user = userEvent.setup();
      const lista = muchas(30);
      renderExplore({ data: lista, filteredSpecies: lista });
      expect(ocultas()).toBe(16);

      await user.click(screen.getByRole('button', { name: 'iconButton.nextPage' }));

      await waitFor(() => expect(screen.getAllByTestId('species')[0]).toHaveTextContent('Especie 16'));
      expect(ocultas()).toBe(0);
    });

    it('tras filtrar (otra lista de especies) nada queda oculto', () => {
      const lista = muchas(8);
      const { rerender } = renderExplore({ data: lista, filteredSpecies: lista });

      rerender(ui({ data: lista, filteredSpecies: muchas(3, 'Otra') }));

      expect(screen.getAllByTestId('species')).toHaveLength(3);
      expect(ocultas()).toBe(0);
    });

    it('la primera lista con datos se anima aunque antes estuviera cargando sin datos', () => {
      const { rerender } = renderExplore({ data: null, filteredSpecies: [], isLoading: true });

      rerender(ui({ data: muchas(5), filteredSpecies: muchas(5) }));

      expect(ocultas()).toBe(5);
    });
  });
});
