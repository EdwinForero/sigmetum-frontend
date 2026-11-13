import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LEGACY_REDIRECTS } from './config/routes';

// Solo el recuento interpola: así se comprueban las cifras sin depender del idioma.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => (key === 'explore.resultsInfo' ? `${key} ${opts.currentResults}/${opts.totalResults}` : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('./services/api', () => ({
  default: {
    get: vi.fn(async () => []),
    getAuth: vi.fn(async () => ({})),
    postAuth: vi.fn(async () => ({})),
    deleteAuth: vi.fn(async () => ({})),
    postFormAuth: vi.fn(async () => ({})),
    post: vi.fn(async () => ({})),
    logout: vi.fn(),
  },
}));
// Estado que controla el test; el mock avisa a App en un efecto (nunca durante el render) y cuenta sus montajes.
const protectedMock = { status: 'ok', mounts: 0, redirectWhenDenied: false };
vi.mock('./components/ProtectedRoute', () => {
  const ProtectedRouteMock = ({ element, onStatusChange }) => {
    useEffect(() => { protectedMock.mounts += 1; }, []);
    useEffect(() => { onStatusChange?.(protectedMock.status); }, [onStatusChange]);
    if (protectedMock.redirectWhenDenied && protectedMock.status === 'denied') return <Navigate to="/login" replace />;
    return protectedMock.status === 'ok' ? element : null;
  };
  return { default: ProtectedRouteMock };
});

// Registra las funciones que App pasa a Filter en cada render: si cambian de identidad, los efectos de Filter se repiten.
// Al montarse (y al remontarse con otra key) emula a Filter: avisa con `filtered` (o con todos los datos).
const filterCallbacks = [];
const filterMock = { mounts: 0, filtered: null };
vi.mock('./components/Filter', () => {
  const FilterMock = ({ data, onFilterChange, onSpeciesSelect }) => {
    filterCallbacks.push({ onFilterChange, onSpeciesSelect });
    useEffect(() => {
      filterMock.mounts += 1;
      onFilterChange(filterMock.filtered ?? data);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
  };
  return { default: FilterMock };
});

import App from './App';
import api from './services/api';

let navigateTo;
let currentLocation;
const NavigatorProbe = () => {
  navigateTo = useNavigate();
  currentLocation = useLocation();
  return null;
};

const goTo = async (path, status) => {
  protectedMock.status = status;
  await act(async () => { navigateTo(path); });
};

const renderApp = async (path) => {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <NavigatorProbe />
      <App />
    </MemoryRouter>
  );
  await act(async () => {});
  return result;
};

describe('App', () => {
  beforeEach(() => {
    filterCallbacks.length = 0;
    filterMock.mounts = 0;
    filterMock.filtered = null;
    api.get.mockReset();
    api.get.mockImplementation(async () => []);
    protectedMock.status = 'ok';
    protectedMock.mounts = 0;
    protectedMock.redirectWhenDenied = false;
    document.title = '';
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('el primer Tab llega al enlace de salto, que apunta a #contenido', async () => {
    const user = userEvent.setup();
    await renderApp('/');

    await user.tab();

    expect(document.activeElement).toHaveTextContent('skipLink');
    expect(document.activeElement.getAttribute('href')).toBe('#contenido');
  });

  it('el enlace de salto con foco mide al menos 44 px (WCAG 2.5.8)', async () => {
    await renderApp('/');

    const enlace = screen.getByText('skipLink');
    expect(enlace).toHaveClass('focus:inline-flex', 'focus:min-h-11', 'focus:min-w-11', 'focus:items-center');
  });

  it('hay un único main#contenido, un contentinfo y un banner', async () => {
    await renderApp('/');

    expect(await screen.findAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido');
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(screen.getAllByRole('banner')).toHaveLength(1);
  });

  it('el main enfocable por el enlace de salto no oculta su contorno de foco', async () => {
    await renderApp('/');

    expect(await screen.findByRole('main')).not.toHaveClass('focus:outline-none');
  });

  it('el banner de cookies va después del pie', async () => {
    await renderApp('/');

    const footer = screen.getByRole('contentinfo');
    const cookies = screen.getByRole('region', { name: 'cookies.banner.title' });
    expect(footer.compareDocumentPosition(cookies) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('en ruta privada la raíz reserva el espacio de la barra y en /login no', async () => {
    const { container, unmount } = await renderApp('/manage-data');
    expect(container.querySelector('.App')).toHaveClass('pb-nav', 'md:pb-0');
    expect(container.querySelector('.App')).not.toHaveClass('md:pl-28');
    unmount();

    const login = await renderApp('/login');
    expect(login.container.querySelector('.App')).not.toHaveClass('pb-nav');
    expect(login.container.querySelector('.App')).not.toHaveClass('md:pl-28');
  });

  it('en una ruta privada hay dos navegaciones con nombres distintos y Cerrar sesión', async () => {
    await renderApp('/manage-data');

    expect(screen.getByRole('navigation', { name: 'navbar.label' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
  });

  it.each(['/EXPLORE', '/Explore'])('%s se pinta como /explore: barra con Filtros, sin enlaces privados y carga los datos', async (ruta) => {
    await renderApp(ruta);

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'privateNav.filters' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'privateNav.data' })).toBeNull();
    expect(api.get).toHaveBeenCalledWith('/get-merged-data');
  });

  it('/MANAGE-DATA con la sesión en ok da barra, Cerrar sesión y pb-nav', async () => {
    const { container } = await renderApp('/MANAGE-DATA');

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
    expect(container.querySelector('.App')).toHaveClass('pb-nav');
  });

  it('/MANAGE-DATA con la sesión denegada no muestra barra', async () => {
    protectedMock.status = 'denied';
    const { container } = await renderApp('/MANAGE-DATA');

    expect(screen.queryByRole('navigation', { name: 'privateNav.label' })).toBeNull();
    expect(container.querySelector('.App')).not.toHaveClass('pb-nav');
  });

  it('/NO-EXISTE muestra la página 404', async () => {
    await renderApp('/NO-EXISTE');

    expect(screen.getByText('notFound.content')).toBeInTheDocument();
  });

  it('en /explore no hay Cerrar sesión', async () => {
    await renderApp('/explore');

    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
  });

  it.each(['checking', 'denied', 'unavailable'])('en una ruta privada con la sesión en %s no hay barra, Cerrar sesión ni pb-nav', async (status) => {
    protectedMock.status = status;
    const { container } = await renderApp('/manage-data');

    expect(screen.queryByRole('navigation', { name: 'privateNav.label' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
    expect(container.querySelector('.App')).not.toHaveClass('pb-nav');
  });

  it('con la sesión en ok sí hay barra, Cerrar sesión y pb-nav', async () => {
    const { container } = await renderApp('/manage-data');

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
    expect(container.querySelector('.App')).toHaveClass('pb-nav');
  });

  it('al salir de las rutas privadas y volver a entrar sin confirmar, la barra no reaparece', async () => {
    const { container } = await renderApp('/manage-data');
    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();

    await goTo('/explore', 'ok');
    await goTo('/upload-files', 'checking');

    expect(screen.queryByRole('navigation', { name: 'privateNav.label' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
    expect(container.querySelector('.App')).not.toHaveClass('pb-nav');
  });

  it('entre dos rutas privadas la barra se queda durante la revalidación y se vuelve a montar la ruta', async () => {
    await renderApp('/manage-data');
    expect(protectedMock.mounts).toBe(1);

    await goTo('/upload-files', 'checking');

    expect(protectedMock.mounts).toBe(2);
    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
  });

  it('el orden de Tab es: enlace de salto, cabecera, barra, contenido, pie y banner', async () => {
    const user = userEvent.setup();
    await renderApp('/manage-data');
    const order = [];
    const stops = [];
    for (let i = 0; i < 60; i += 1) {
      await user.tab();
      const element = document.activeElement;
      if (!element || element === document.body || stops.includes(element)) break;
      stops.push(element);
      const zone = element.closest('header')
        ? 'header'
        : element.closest('nav[aria-label="privateNav.label"]')
          ? 'barra'
          : element.closest('main')
            ? 'main'
            : element.closest('footer')
              ? 'footer'
              : element.closest('section')
                ? 'banner'
                : 'salto';
      if (order[order.length - 1] !== zone) order.push(zone);
    }

    expect(stops[0].getAttribute('href')).toBe('#contenido');
    expect(order).toEqual(['salto', 'header', 'barra', 'main', 'footer', 'banner']);
  });

  it('en ruta privada el banner de cookies queda sobre la barra (bottom-nav)', async () => {
    await renderApp('/manage-data');

    expect(screen.getByRole('region', { name: 'cookies.banner.title' })).toHaveClass('bottom-nav');
  });

  it('con la ruta privada con barra final también hay barra lateral y Cerrar sesión', async () => {
    const { container } = await renderApp('/manage-data/');

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
    expect(container.querySelector('.App')).toHaveClass('pb-nav');
  });

  it('/manage-data no tiene el botón de filtros y /explore sí', async () => {
    const { unmount } = await renderApp('/manage-data');
    expect(screen.queryByRole('button', { name: 'privateNav.filters' })).toBeNull();
    unmount();

    await renderApp('/explore');
    expect(screen.getByRole('button', { name: 'privateNav.filters' })).toBeInTheDocument();
  });

  it('con /explore/ (barra final) la barra lateral ofrece Filtros y no las opciones privadas', async () => {
    await renderApp('/explore/');

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'privateNav.data' })).toBeNull();
  });

  it('las funciones que App pasa a Filter mantienen su identidad entre renders', async () => {
    await renderApp('/explore');

    expect(filterCallbacks.length).toBeGreaterThan(1);
    expect(new Set(filterCallbacks.map((c) => c.onFilterChange)).size).toBe(1);
    expect(new Set(filterCallbacks.map((c) => c.onSpeciesSelect)).size).toBe(1);
  });

  describe('rutas en inglés y redirecciones de las URL antiguas', () => {
    const SUFFIX = ' · SIGMETUM-A';
    const TITLES = {
      '/explore': 'navbar.exploreOption',
      '/gallery': 'gallery.title',
      '/about-us': 'aboutUs.title',
      '/upload-files': 'uploadFiles.title',
      '/manage-data': 'dataManagement.title',
      '/manage-terms': 'contentManagement.noLatinTermsTitle',
    };

    it.each(Object.entries(LEGACY_REDIRECTS).flatMap(([from, to]) => [[from, to], [`${from}/`, to]]))(
      '%s redirige a %s y se ve el título de la ruta nueva',
      async (from, to) => {
        await renderApp(from);

        expect(currentLocation.pathname).toBe(to);
        expect(document.title).toBe(`${TITLES[to]}${SUFFIX}`);
      }
    );

    it.each([
      ['/explorar?q=1', '/explore'],
      ['/galeria#x', '/gallery'],
      ['/sobre-nosotros/?a=1#x', '/about-us'],
      ['/explorar?//evil.example', '/explore'],
      ['/galeria#//evil', '/gallery'],
    ])('%s acaba en %s sin conservar ni «?» ni «#» (S4)', async (from, to) => {
      await renderApp(from);

      expect(currentLocation.pathname).toBe(to);
      expect(currentLocation.search).toBe('');
      expect(currentLocation.hash).toBe('');
    });

    it('la redirección sustituye la entrada del historial: atrás vuelve a / y no a la URL antigua', async () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/', '/explorar']} initialIndex={1}>
          <NavigatorProbe />
          <App />
        </MemoryRouter>
      );
      await act(async () => {});
      expect(currentLocation.pathname).toBe('/explore');

      await act(async () => { navigateTo(-1); });

      expect(currentLocation.pathname).toBe('/');
      unmount();
    });

    it.each(['/cargar-archivos', '/administrar-datos', '/administrar-contenido'])(
      'la privada antigua %s sin sesión acaba en /login, sin barra de gestión',
      async (from) => {
        protectedMock.status = 'denied';
        protectedMock.redirectWhenDenied = true;
        await renderApp(from);

        expect(currentLocation.pathname).toBe('/login');
        expect(screen.queryByRole('navigation', { name: 'privateNav.label' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
      }
    );

    it('recargar directamente una ruta nueva la sirve sin redirigir', async () => {
      await renderApp('/manage-terms');

      expect(currentLocation.pathname).toBe('/manage-terms');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('contentManagement.noLatinTermsTitle');
    });

    it.each([
      ['/manage-data', 'dataManagement.title'],
      ['/manage-terms', 'contentManagement.noLatinTermsTitle'],
      ['/manage-gallery', 'contentManagement.galleryManagementTitle'],
      ['/manage-recipients', 'contactRecipients.title'],
    ])('%s es privada: muestra su h1 y la barra de gestión con la sesión en ok', async (path, title) => {
      await renderApp(path);

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
      expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    });

    it.each(['/manage-gallery', '/manage-recipients', '/manage-terms'])(
      '%s no pinta nada privado hasta que la sesión está confirmada',
      async (path) => {
        protectedMock.status = 'checking';
        await renderApp(path);

        expect(screen.queryByRole('navigation', { name: 'privateNav.label' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
      }
    );
  });

  describe('scroll al cambiar de ruta', () => {
    beforeEach(() => {
      Element.prototype.scrollIntoView = vi.fn();
    });

    it('al cambiar de ruta sin hash sube al principio', async () => {
      await renderApp('/');
      window.scrollTo.mockClear();

      await goTo('/cookies', 'ok');

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('con #contacto no sube al principio: lo deja a Home, que lleva la sección a la vista', async () => {
      await renderApp('/cookies');
      window.scrollTo.mockClear();

      await goTo('/#contacto', 'ok');

      expect(window.scrollTo).not.toHaveBeenCalled();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
      expect(Element.prototype.scrollIntoView.mock.contexts.at(-1)).toBe(document.getElementById('contacto'));
    });

    it('al abrir directamente /#contacto tampoco sube al principio', async () => {
      await renderApp('/#contacto');

      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('/explore', () => {
    const pending = () => new Promise(() => {});
    const rows = [{ 'Especies Características': ['Pinus pinea'] }];

    it('mientras carga ya hay un h1 y un nodo status con el texto de carga', async () => {
      api.get.mockImplementation((url) => (url === '/get-merged-data' ? pending() : Promise.resolve([])));
      await renderApp('/explore');

      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('explore.title');
      const status = screen.getByRole('heading', { level: 1 }).nextElementSibling;
      expect(status).toHaveAttribute('role', 'status');
      expect(status).toHaveTextContent('feedback.loading');
    });

    it('si falla la carga, «Reintentar» vuelve a pedir /get-merged-data y /list-terms', async () => {
      const user = userEvent.setup();
      api.get.mockImplementation((url) =>
        url === '/get-merged-data' ? Promise.reject(new Error('caído')) : Promise.resolve([])
      );
      await renderApp('/explore');
      expect(screen.getByText('explore.empty.errorTitle')).toBeInTheDocument();
      const callsBefore = api.get.mock.calls.filter(([url]) => url === '/get-merged-data').length;

      api.get.mockImplementation(async (url) => (url === '/get-merged-data' ? rows : []));
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'feedback.retry' }));
      });

      const urls = api.get.mock.calls.map(([url]) => url);
      expect(urls.filter((url) => url === '/get-merged-data')).toHaveLength(callsBefore + 1);
      expect(urls.filter((url) => url === '/list-terms')).toHaveLength(2);
      expect(screen.queryByText('explore.empty.errorTitle')).toBeNull();
      expect(screen.getByText('Pinus pinea')).toBeInTheDocument();
    });

    it('el recuento muestra el total real tras cargar y tras reintentar', async () => {
      const user = userEvent.setup();
      const dos = [{ 'Especies Características': ['Pinus pinea', 'Quercus ilex'] }];
      const tres = [{ 'Especies Características': ['Pinus pinea', 'Quercus ilex', 'Juniperus communis'] }];
      api.get.mockImplementation((url) =>
        url === '/get-merged-data' ? Promise.reject(new Error('caído')) : Promise.resolve([])
      );
      await renderApp('/explore');

      api.get.mockImplementation(async (url) => (url === '/get-merged-data' ? dos : []));
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'feedback.retry' }));
      });
      expect(screen.getByText('explore.resultsInfo 2/2')).toBeInTheDocument();

      // Una segunda carga (otra versión de datos) reinicia el total.
      api.get.mockImplementation(async (url) => (url === '/get-merged-data' ? tres : []));
      await act(async () => {
        await navigateTo('/');
      });
      await act(async () => {
        await navigateTo('/explore');
      });
      expect(screen.getByText('explore.resultsInfo 3/3')).toBeInTheDocument();
    });

    it('«Quitar filtros» remonta Filter y se vuelven a ver todos los datos', async () => {
      const user = userEvent.setup();
      api.get.mockImplementation(async (url) => (url === '/get-merged-data' ? rows : []));
      filterMock.filtered = [];
      await renderApp('/explore');
      expect(screen.getByText('explore.empty.noResultsTitle')).toBeInTheDocument();
      expect(filterMock.mounts).toBe(1);

      filterMock.filtered = null;
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'explore.empty.clearFilters' }));
      });

      expect(filterMock.mounts).toBe(2);
      // El botón se desmontó: el foco está en el h1 y no en <body>.
      expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
      expect(screen.getByText('Pinus pinea')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'explore.empty.clearFilters' })).toBeNull();
    });
  });
});
