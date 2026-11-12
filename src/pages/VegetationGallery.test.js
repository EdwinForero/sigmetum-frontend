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

const setWidth = async (width) => {
  window.innerWidth = width;
  await act(async () => {
    fireEvent(window, new Event('resize'));
  });
};

const renderGallery = async (images = makeImages(6)) => {
  api.get.mockResolvedValue(images);
  const result = render(<VegetationGallery />);
  await act(async () => {});
  return result;
};

describe('VegetationGallery', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    api.get.mockReset();
    window.innerWidth = 1024;
    document.body.style.overflow = '';
  });

  afterEach(() => {
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

    it('no usa pulso, hover para mostrar el nombre ni hex', async () => {
      const { container } = await renderGallery();

      expect(container.innerHTML).not.toMatch(/animate-pulse|group-hover|\[#[0-9A-Fa-f]{3,8}\]|object-cover|w-\[300px\]/);
    });
  });

  describe('columnas', () => {
    it.each([
      [600, 1],
      [640, 2],
      [1023, 2],
      [1024, 3],
      [1279, 3],
      [1280, 4],
    ])('a %i px hay %i columnas', async (width, columns) => {
      window.innerWidth = width;
      const { container } = await renderGallery(makeImages(8));

      expect(columnsOf(container)).toHaveLength(columns);
    });

    it('se recalculan al cambiar el ancho y la limpieza quita el listener de resize', async () => {
      const remove = vi.spyOn(window, 'removeEventListener');
      const { container, unmount } = await renderGallery(makeImages(8));
      expect(columnsOf(container)).toHaveLength(3);

      await setWidth(1280);
      expect(columnsOf(container)).toHaveLength(4);
      await setWidth(500);
      expect(columnsOf(container)).toHaveLength(1);

      unmount();
      expect(remove.mock.calls.some(([type]) => type === 'resize')).toBe(true);
      remove.mockRestore();
    });

    it('el reparto es en bloques contiguos: perColumn = ceil(N / n)', async () => {
      const { container } = await renderGallery(makeImages(7));

      const lists = columnsOf(container);
      expect(lists.map(keysOf)).toEqual([
        ['foto_numero_1.jpg', 'foto_numero_2.jpg', 'foto_numero_3.jpg'],
        ['foto_numero_4.jpg', 'foto_numero_5.jpg', 'foto_numero_6.jpg'],
        ['foto_numero_7.jpg'],
      ]);
    });

    it('no pinta columnas vacías', async () => {
      window.innerWidth = 1280;
      const { container } = await renderGallery(makeImages(2));

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

    it('las listas llevan las clases del layout y las celdas no se encogen', async () => {
      const { container } = await renderGallery();

      columnsOf(container).forEach((list) => {
        expect(list).toHaveClass('flex', 'min-w-0', 'flex-1', 'flex-col', 'gap-stack-lg');
      });
      expect(columnsOf(container)[0].parentElement).toHaveClass('flex', 'gap-stack-lg');
    });
  });

  describe('foco', () => {
    it('con el foco en una foto, cambiar el número de columnas lo conserva en esa misma foto', async () => {
      const { container } = await renderGallery(makeImages(8));
      const target = container.querySelector('[data-photo="foto_numero_5.jpg"]');
      act(() => target.focus());
      expect(document.activeElement).toBe(target);

      await setWidth(1280);

      expect(columnsOf(container)).toHaveLength(4);
      expect(document.activeElement.dataset.photo).toBe('foto_numero_5.jpg');
      expect(document.activeElement.isConnected).toBe(true);
    });

    it('si el foco no está en una foto, cambiar las columnas no lo lleva a ninguna', async () => {
      await renderGallery(makeImages(8));
      expect(document.activeElement).toBe(document.body);

      await setWidth(1280);

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
      const { container } = await renderGallery(makeImages(8));
      const button = container.querySelector('[data-photo="foto_numero_5.jpg"]');

      await user.click(button);
      await setWidth(1280);
      expect(columnsOf(container)).toHaveLength(4);
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

    it('pide /list-images una sola vez al montar', async () => {
      await renderGallery();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/list-images');
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
