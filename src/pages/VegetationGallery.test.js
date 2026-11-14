import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// t devuelve la clave y sus opciones, para poder comprobar el nombre de cada foto.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (options ? `${key}:${JSON.stringify(options)}` : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));
vi.mock('../services/api', () => ({ default: { get: vi.fn() } }));

import api from '../services/api';
import VegetationGallery from './VegetationGallery';

const makeImages = (count) =>
  Array.from({ length: count }, (_, i) => ({
    fileName: `foto_numero_${i + 1}.jpg`,
    url: `https://assets.test/${i + 1}.jpg`,
  }));

const opener = (name) => ({ name: `gallery.openPhoto:${JSON.stringify({ name })}` });
const columnsOf = (container) => Array.from(container.querySelectorAll('ul'));
const keysOf = (list) => Array.from(list.querySelectorAll('[data-photo]')).map((el) => el.dataset.photo);

// El ancho de la rejilla se simula con clientWidth (jsdom no maqueta); window.innerWidth queda en 1024,
// de modo que una implementación que lo use daría otro número de columnas (5) que el simulado.
let gridWidth = 600;

const setWidth = async (width) => {
  gridWidth = width;
  await act(async () => {
    fireEvent(window, new Event('resize'));
  });
};

const renderGallery = async (images = makeImages(6), width = 600) => {
  gridWidth = width;
  api.get.mockResolvedValue(images);
  const result = render(<VegetationGallery />);
  await act(async () => {});
  return result;
};

describe('VegetationGallery', () => {
  const originalWidth = window.innerWidth;
  let clientWidthSpy;

  beforeEach(() => {
    api.get.mockReset();
    window.innerWidth = 1024;
    gridWidth = 600;
    clientWidthSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => gridWidth);
    document.body.style.overflow = '';
  });

  afterEach(() => {
    clientWidthSpy.mockRestore();
    window.innerWidth = originalWidth;
  });

  describe('estados con un único h1', () => {
    it('cargando: h1, seis celdas esqueleto estáticas aria-hidden y un status con el texto de carga', () => {
      api.get.mockReturnValue(new Promise(() => {}));
      const { container } = render(<VegetationGallery />);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const status = screen.getByRole('heading', { level: 1 }).nextElementSibling;
      expect(status).toHaveAttribute('role', 'status');
      expect(status).toHaveTextContent('gallery.loading');
      const skeleton = container.querySelectorAll('[aria-hidden="true"].bg-sage-soft');
      expect(skeleton).toHaveLength(6);
      expect(container.innerHTML).not.toMatch(/animate-pulse/);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('error: h1, aviso con título y causa, y «Reintentar» que vuelve a pedir /list-images', async () => {
      const user = userEvent.setup();
      api.get.mockRejectedValueOnce(new Error('caído'));
      render(<VegetationGallery />);
      await act(async () => {});

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('alert')).toHaveTextContent('gallery.errorTitle');
      expect(screen.getByRole('alert')).toHaveTextContent('gallery.errorCause');
      expect(api.get).toHaveBeenCalledTimes(1);

      api.get.mockResolvedValueOnce(makeImages(2));
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'feedback.retry' }));
      });

      expect(api.get).toHaveBeenCalledTimes(2);
      expect(api.get).toHaveBeenLastCalledWith('/list-images');
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('vacío: h1 y bloque sin rol de aviso con título y causa', async () => {
      await renderGallery([]);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 2, name: 'gallery.emptyTitle' })).toBeInTheDocument();
      expect(screen.getByText('gallery.noDataFoundPlaceholder')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('con datos: h1 y el nodo status sigue montado (vacío) tras el h1', async () => {
      await renderGallery();

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const status = screen.getByRole('heading', { level: 1 }).nextElementSibling;
      expect(status).toHaveAttribute('role', 'status');
      expect(status).toBeEmptyDOMElement();
    });

    it('ignora las entradas con nombre vacío', async () => {
      await renderGallery([...makeImages(2), { fileName: '   ', url: 'https://assets.test/x.jpg' }]);

      expect(screen.getAllByRole('button')).toHaveLength(2);
    });
  });

  describe('celdas', () => {
    it('cada foto es un botón con nombre, una imagen con alt sin extensión, width, height y lazy, y un pie visible', async () => {
      await renderGallery(makeImages(2));

      const button = screen.getByRole('button', opener('foto numero 1'));
      expect(button).toHaveClass('focus-ring', 'block', 'w-full', 'rounded-lg', 'bg-sage-soft');
      const img = within(button).getByRole('img', { name: 'foto numero 1' });
      expect(img).toHaveAttribute('src', 'https://assets.test/1.jpg');
      expect(img).toHaveAttribute('width', '4');
      expect(img).toHaveAttribute('height', '3');
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveClass('block', 'h-auto', 'w-full', 'rounded-lg');
      expect(img.getAttribute('alt')).not.toMatch(/\.jpg|_/);

      const caption = screen.getAllByText('foto numero 1').find((el) => el.tagName === 'FIGCAPTION');
      expect(caption).toHaveClass('text-sm', 'text-ink', 'line-clamp-2');
      expect(caption.tagName).toBe('FIGCAPTION');
      expect(button.closest('figure')).toContainElement(caption);
    });

    it('no usa pulso, hex ni recorte: el nombre ya se ve en el pie y el velo solo lo repite', async () => {
      const { container } = await renderGallery();

      expect(container.innerHTML).not.toMatch(/animate-pulse|\[#[0-9A-Fa-f]{3,8}\]|object-cover|w-\[300px\]/);
    });

    it('el velo con el nombre es decorativo: aria-hidden, solo con hover o foco visible, sin movimiento reducido', async () => {
      await renderGallery(makeImages(2));

      const button = screen.getByRole('button', opener('foto numero 1'));
      expect(button).toHaveClass('group', 'relative', 'overflow-hidden');
      const veil = button.querySelector('span[aria-hidden="true"]');
      expect(veil).not.toBeNull();
      expect(veil).toHaveClass(
        'pointer-events-none', 'absolute', 'inset-0', 'flex', 'items-center', 'justify-center', 'rounded-lg',
        'bg-ink/70', 'p-stack-sm', 'text-center', 'text-sm', 'font-bold', 'text-surface',
        'opacity-0', 'transition-opacity', 'duration-150', 'ease-out',
        'group-hover:opacity-100', 'group-focus-visible:opacity-100',
        'motion-reduce:transition-none', 'motion-reduce:duration-0'
      );
      expect(veil).toHaveTextContent('foto numero 1');
      expect(within(veil).getByText('foto numero 1')).toHaveClass('line-clamp-3');
      // El nombre accesible sigue siendo el del botón (no se suma el del velo) y el pie no cambia.
      expect(button).toHaveAccessibleName('gallery.openPhoto:{"name":"foto numero 1"}');
      expect(screen.getAllByText('foto numero 1').find((el) => el.tagName === 'FIGCAPTION')).toHaveClass('text-sm', 'text-ink', 'line-clamp-2');
    });
  });

  describe('columnas', () => {
    // El ancho es el de la rejilla (clientWidth), no el de la ventana (1024 en todos estos tests).
    it.each([
      [0, 1],
      [343, 2],
      [705, 4],
      [945, 5],
      [1361, 7],
      [1841, 9],
    ])('con una rejilla de %i px hay %i columnas', async (width, columns) => {
      const { container } = await renderGallery(makeImages(12), width);

      expect(columnsOf(container)).toHaveLength(columns);
    });

    it('se recalculan al cambiar el ancho de la rejilla y la limpieza quita el listener de resize', async () => {
      const remove = vi.spyOn(window, 'removeEventListener');
      const { container, unmount } = await renderGallery(makeImages(12));
      expect(columnsOf(container)).toHaveLength(3);

      await setWidth(1361);
      expect(columnsOf(container)).toHaveLength(7);
      await setWidth(343);
      expect(columnsOf(container)).toHaveLength(2);

      unmount();
      expect(remove.mock.calls.some(([type]) => type === 'resize')).toBe(true);
      remove.mockRestore();
    });

    describe('con ResizeObserver', () => {
      let observers;

      beforeEach(() => {
        observers = [];
        vi.stubGlobal('ResizeObserver', class {
          constructor(callback) { this.callback = callback; this.observe = vi.fn(); this.disconnect = vi.fn(); observers.push(this); }
        });
      });

      afterEach(() => vi.unstubAllGlobals());

      it('observa la rejilla y recalcula las columnas al avisar el observador, sin evento resize de la ventana', async () => {
        const { container } = await renderGallery(makeImages(12));
        expect(columnsOf(container)).toHaveLength(3);
        expect(observers).toHaveLength(1);
        expect(observers[0].observe).toHaveBeenCalledTimes(1);
        expect(observers[0].observe.mock.calls[0][0]).toBe(container.querySelector('ul').parentElement.parentElement);

        gridWidth = 1361;
        await act(async () => observers[0].callback([]));

        expect(columnsOf(container)).toHaveLength(7);
      });

      it('con el observador no se escucha resize de la ventana y al desmontar se desconecta', async () => {
        const add = vi.spyOn(window, 'addEventListener');
        const { unmount } = await renderGallery(makeImages(12));

        expect(add.mock.calls.some(([type]) => type === 'resize')).toBe(false);
        unmount();

        expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
        add.mockRestore();
      });

      it('al cambiar las columnas por el observador ninguna celda queda oculta (revealCells pasa a false)', async () => {
        vi.stubGlobal('IntersectionObserver', class {
          observe() {}
          unobserve() {}
          disconnect() {}
        });
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000, bottom: 5100, height: 100 });
        const { container } = await renderGallery(makeImages(6), 600);
        expect(container.querySelectorAll('.reveal-hidden')).toHaveLength(6);

        gridWidth = 1000;
        await act(async () => observers[0].callback([]));

        expect(container.querySelectorAll('li')).toHaveLength(6);
        expect(container.querySelectorAll('.reveal-hidden')).toHaveLength(0);
        vi.restoreAllMocks();
      });
    });

    it('el reparto es en bloques contiguos equilibrados: 7 fotos en 3 columnas dan [3, 2, 2]', async () => {
      const { container } = await renderGallery(makeImages(7), 600);

      const lists = columnsOf(container);
      expect(lists.map(keysOf)).toEqual([
        ['foto_numero_1.jpg', 'foto_numero_2.jpg', 'foto_numero_3.jpg'],
        ['foto_numero_4.jpg', 'foto_numero_5.jpg'],
        ['foto_numero_6.jpg', 'foto_numero_7.jpg'],
      ]);
    });

    it('no pinta columnas vacías: 2 fotos en una rejilla de 1841 px dan 2 listas', async () => {
      const { container } = await renderGallery(makeImages(2), 1841);

      expect(columnsOf(container).map(keysOf)).toEqual([['foto_numero_1.jpg'], ['foto_numero_2.jpg']]);
    });

    it('la columna de cada foto no cambia al cargar las imágenes en otro orden', async () => {
      const { container } = await renderGallery(makeImages(6));
      const before = columnsOf(container).map(keysOf);

      [...container.querySelectorAll('img')].reverse().forEach((img) => fireEvent.load(img));

      expect(columnsOf(container).map(keysOf)).toEqual(before);
    });

    it('el orden de Tab es el orden de los datos (se lee bajando por cada columna)', async () => {
      const user = userEvent.setup();
      const images = makeImages(7);
      await renderGallery(images);

      const visited = [];
      for (let i = 0; i < images.length; i += 1) {
        await user.tab();
        visited.push(document.activeElement.dataset.photo);
      }

      expect(visited).toEqual(images.map((image) => image.fileName));
    });

    it('la rejilla es un grid de pistas fijas fuera de .page-container y las listas son columnas flex', async () => {
      const { container } = await renderGallery();

      const lists = columnsOf(container);
      lists.forEach((list) => {
        expect(list).toHaveClass('flex', 'flex-col', 'gap-stack');
      });
      const grid = lists[0].parentElement;
      expect(grid).toHaveClass('grid', 'gap-x-stack-md');
      expect(grid).not.toHaveClass('mt-stack-xl');
      expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
      // La rejilla entra a sangre: solo el margen lateral; el título conserva su posición en .page-container.
      expect(grid.closest('.page-container')).toBeNull();
      expect(grid.parentElement.parentElement).toHaveClass('px-gutter', 'md:px-gutter-md', 'lg:px-gutter-lg');
      expect(screen.getByRole('heading', { level: 1 }).closest('.page-container')).not.toBeNull();
      expect(container.firstChild).toHaveClass('pt-stack-xl', 'md:pt-section', 'pb-section', 'md:pb-section-lg');
      expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-4xl', 'md:text-5xl', 'text-brand-deep');
      expect(container.firstChild).not.toHaveClass('page-container');
    });

    it('el esqueleto reparte sus 6 celdas con las mismas pistas y reserva un 4:3 en cada una', () => {
      api.get.mockReturnValue(new Promise(() => {}));
      gridWidth = 600;
      const { container } = render(<VegetationGallery />);

      const cells = container.querySelectorAll('.aspect-\\[4\\/3\\]');
      expect(cells).toHaveLength(6);
      const grid = cells[0].parentElement.parentElement;
      expect(grid).toHaveClass('grid', 'gap-x-stack-md');
      expect(grid).not.toHaveClass('mt-stack-xl');
      expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
      expect(grid.closest('.page-container')).toBeNull();
      expect(Array.from(grid.children).map((column) => column.children.length)).toEqual([2, 2, 2]);
    });
  });

  describe('foco', () => {
    it('con el foco en una foto, cambiar el número de columnas lo conserva en esa misma foto', async () => {
      const { container } = await renderGallery(makeImages(8), 945);
      expect(columnsOf(container)).toHaveLength(5);
      const target = container.querySelector('[data-photo="foto_numero_5.jpg"]');
      act(() => target.focus());
      expect(document.activeElement).toBe(target);

      await setWidth(1361);

      expect(columnsOf(container)).toHaveLength(7);
      expect(target.isConnected).toBe(false);
      expect(document.activeElement.dataset.photo).toBe('foto_numero_5.jpg');
      expect(document.activeElement.isConnected).toBe(true);
    });

    it('si el foco no está en una foto, cambiar las columnas no lo lleva a ninguna', async () => {
      const { container } = await renderGallery(makeImages(8), 945);
      expect(document.activeElement).toBe(document.body);

      await setWidth(1361);

      expect(columnsOf(container)).toHaveLength(7);
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('visor', () => {
    it('al pulsar una foto se abre el visor con esa foto y «n de N»', async () => {
      const user = userEvent.setup();
      await renderGallery();

      await user.click(screen.getByRole('button', opener('foto numero 3')));

      const dialog = screen.getByRole('dialog', { name: 'foto numero 3' });
      expect(dialog).toHaveTextContent('"current":3,"total":6');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('Escape cierra el visor, devuelve el foco al botón de la foto y restaura el overflow del body', async () => {
      const user = userEvent.setup();
      await renderGallery();
      const button = screen.getByRole('button', opener('foto numero 3'));

      await user.click(button);
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(button);
      expect(document.body.style.overflow).toBe('');
    });

    it('tras navegar con las flechas, al cerrar el foco vuelve a la foto que abrió el visor', async () => {
      const user = userEvent.setup();
      await renderGallery();
      const button = screen.getByRole('button', opener('foto numero 2'));

      await user.click(button);
      await user.keyboard('{ArrowRight}{ArrowRight}');
      await user.keyboard('{Escape}');

      expect(document.activeElement).toBe(button);
    });

    it('con el visor abierto, un resize que cambia las columnas y Escape devuelven el foco a la foto', async () => {
      const user = userEvent.setup();
      const { container } = await renderGallery(makeImages(8), 945);
      const button = container.querySelector('[data-photo="foto_numero_5.jpg"]');

      await user.click(button);
      await setWidth(1361);
      expect(columnsOf(container)).toHaveLength(7);
      expect(button.isConnected).toBe(false);

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement.dataset.photo).toBe('foto_numero_5.jpg');
      expect(document.activeElement.isConnected).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });

    it('cerrar con el botón Cerrar también devuelve el foco', async () => {
      const user = userEvent.setup();
      await renderGallery();
      const button = screen.getByRole('button', opener('foto numero 1'));

      await user.click(button);
      await user.click(screen.getByRole('button', { name: 'iconButton.close' }));

      expect(document.activeElement).toBe(button);
    });
  });

  describe('aparición por scroll (Reveal)', () => {
    let observadores;

    beforeEach(() => {
      observadores = [];
      vi.stubGlobal('IntersectionObserver', class {
        constructor(callback) { this.callback = callback; observadores.push(this); }
        observe() {}
        unobserve() {}
        disconnect() {}
      });
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top: 5000, bottom: 5100, height: 100 });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    const ocultas = (container) => container.querySelectorAll('.reveal-hidden').length;

    it('cada <li> es un Reveal y empieza oculto; el esqueleto y el visor no se animan', async () => {
      api.get.mockReturnValue(new Promise(() => {}));
      const esqueleto = render(<VegetationGallery />);
      expect(esqueleto.container.querySelectorAll('[data-reveal]')).toHaveLength(0);
      esqueleto.unmount();

      const user = userEvent.setup();
      const { container } = await renderGallery(makeImages(6), 600);
      const celdas = container.querySelectorAll('li');
      expect(celdas).toHaveLength(6);
      for (const celda of celdas) expect(celda).toHaveAttribute('data-reveal');
      expect(container.querySelectorAll('[data-reveal] [data-reveal]')).toHaveLength(0);
      expect(ocultas(container)).toBe(6);

      await user.click(screen.getByRole('button', opener('foto numero 1')));
      expect(screen.getByRole('dialog').closest('[data-reveal]')).toBeNull();
      expect(screen.getByRole('dialog').querySelector('[data-reveal]')).toBeNull();
    });

    it('el retraso de cada celda sale de su columna', async () => {
      const { container } = await renderGallery(makeImages(6), 600);
      const celdas = [...container.querySelectorAll('li')];

      act(() => observadores[0].callback(celdas.map((target) => ({ target, isIntersecting: true }))));

      const columnas = columnsOf(container);
      expect(columnas.length).toBeGreaterThan(1);
      columnas.forEach((columna, c) => {
        for (const li of columna.querySelectorAll('li')) expect(li.style.transitionDelay).toBe(`${Math.min(c, 5) * 60}ms`);
      });
    });

    it('al cambiar las columnas tras la primera medición ninguna celda queda oculta', async () => {
      const { container } = await renderGallery(makeImages(6), 600);
      expect(ocultas(container)).toBe(6);
      const antes = columnsOf(container).length;

      await setWidth(1000);

      expect(columnsOf(container).length).not.toBe(antes);
      expect(container.querySelectorAll('li')).toHaveLength(6);
      expect(ocultas(container)).toBe(0);
    });

    it('al pulsar «Reintentar» las celdas nuevas no se animan', async () => {
      const user = userEvent.setup();
      api.get.mockRejectedValueOnce(new Error('caído'));
      const { container } = render(<VegetationGallery />);
      await act(async () => {});

      api.get.mockResolvedValueOnce(makeImages(4));
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'feedback.retry' }));
      });

      expect(container.querySelectorAll('li')).toHaveLength(4);
      expect(ocultas(container)).toBe(0);
    });

    it('un re-render sin cambio de columnas (abrir el visor) no apaga la animación de las celdas aún ocultas', async () => {
      const user = userEvent.setup();
      const { container } = await renderGallery(makeImages(6), 600);

      await user.click(screen.getByRole('button', opener('foto numero 1')));

      expect(ocultas(container)).toBe(5);
    });
  });

  describe('carga de datos', () => {
    it('ignora la respuesta si el componente se desmonta antes de que llegue', async () => {
      let resolve;
      api.get.mockReturnValue(new Promise((r) => { resolve = r; }));
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { unmount } = render(<VegetationGallery />);

      unmount();
      await act(async () => {
        resolve(makeImages(3));
      });

      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
    });

    it('pide /list-images una sola vez al montar y un cambio de columnas no vuelve a pedirlo', async () => {
      await renderGallery();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/list-images');

      await setWidth(1361);

      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  it('solo pide imágenes con URL segura: https vale; http remoto, javascript:, data: y cadenas inválidas no', async () => {
    const urls = [
      'https://assets.test/ok.jpg',
      'http://evil.example/a.jpg',
      'javascript:alert(1)',
      'data:image/png;base64,AAAA',
      'no es una url',
    ];
    const { container } = await renderGallery(urls.map((url, i) => ({ fileName: `foto_${i}.jpg`, url })));

    const srcs = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(['https://assets.test/ok.jpg']);
    // Las demás celdas siguen siendo un botón (caja vacía) que abre el visor.
    expect(container.querySelectorAll('[data-photo]')).toHaveLength(5);
  });

  it('con dos fotos del mismo nombre ambas se pintan y cada una abre su propio visor', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const images = [
      { fileName: 'igual.jpg', url: 'https://assets.test/a.jpg' },
      { fileName: 'igual.jpg', url: 'https://assets.test/b.jpg' },
    ];
    const { container } = await renderGallery(images);

    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(error.mock.calls.flat().join(' ')).not.toMatch(/same key/);
    error.mockRestore();

    const buttons = container.querySelectorAll('[data-photo]');
    expect(new Set(Array.from(buttons).map((b) => b.dataset.photo)).size).toBe(2);
    await user.click(buttons[1]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', 'https://assets.test/b.jpg');
  });
});
