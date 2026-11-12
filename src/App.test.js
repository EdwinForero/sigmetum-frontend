import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';

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
const protectedMock = { status: 'ok', mounts: 0 };
vi.mock('./components/ProtectedRoute', () => {
  const ProtectedRouteMock = ({ element, onStatusChange }) => {
    useEffect(() => { protectedMock.mounts += 1; }, []);
    useEffect(() => { onStatusChange?.(protectedMock.status); }, [onStatusChange]);
    return protectedMock.status === 'ok' ? element : null;
  };
  return { default: ProtectedRouteMock };
});

// Registra las funciones que App pasa a Filter en cada render: si cambian de identidad, los efectos de Filter se repiten.
const filterCallbacks = [];
vi.mock('./components/Filter', () => ({
  default: ({ onFilterChange, onSpeciesSelect }) => {
    filterCallbacks.push({ onFilterChange, onSpeciesSelect });
    return null;
  },
}));

import App from './App';

let navigateTo;
const NavigatorProbe = () => {
  navigateTo = useNavigate();
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
    protectedMock.status = 'ok';
    protectedMock.mounts = 0;
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
    const { container, unmount } = await renderApp('/administrar-datos');
    expect(container.querySelector('.App')).toHaveClass('pb-nav', 'md:pb-0');
    expect(container.querySelector('.App')).not.toHaveClass('md:pl-28');
    unmount();

    const login = await renderApp('/login');
    expect(login.container.querySelector('.App')).not.toHaveClass('pb-nav');
    expect(login.container.querySelector('.App')).not.toHaveClass('md:pl-28');
  });

  it('en una ruta privada hay dos navegaciones con nombres distintos y Cerrar sesión', async () => {
    await renderApp('/administrar-datos');

    expect(screen.getByRole('navigation', { name: 'navbar.label' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
  });

  it('en /explorar no hay Cerrar sesión', async () => {
    await renderApp('/explorar');

    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
  });

  it.each(['checking', 'denied', 'unavailable'])('en una ruta privada con la sesión en %s no hay barra, Cerrar sesión ni pb-nav', async (status) => {
    protectedMock.status = status;
    const { container } = await renderApp('/administrar-datos');

    expect(screen.queryByRole('navigation', { name: 'privateNav.label' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
    expect(container.querySelector('.App')).not.toHaveClass('pb-nav');
  });

  it('con la sesión en ok sí hay barra, Cerrar sesión y pb-nav', async () => {
    const { container } = await renderApp('/administrar-datos');

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
    expect(container.querySelector('.App')).toHaveClass('pb-nav');
  });

  it('al salir de las rutas privadas y volver a entrar sin confirmar, la barra no reaparece', async () => {
    const { container } = await renderApp('/administrar-datos');
    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();

    await goTo('/explorar', 'ok');
    await goTo('/cargar-archivos', 'checking');

    expect(screen.queryByRole('navigation', { name: 'privateNav.label' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
    expect(container.querySelector('.App')).not.toHaveClass('pb-nav');
  });

  it('entre dos rutas privadas la barra se queda durante la revalidación y se vuelve a montar la ruta', async () => {
    await renderApp('/administrar-datos');
    expect(protectedMock.mounts).toBe(1);

    await goTo('/cargar-archivos', 'checking');

    expect(protectedMock.mounts).toBe(2);
    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
  });

  it('el orden de Tab es: enlace de salto, cabecera, barra, contenido, pie y banner', async () => {
    const user = userEvent.setup();
    await renderApp('/administrar-datos');
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
    await renderApp('/administrar-datos');

    expect(screen.getByRole('region', { name: 'cookies.banner.title' })).toHaveClass('bottom-nav');
  });

  it('con la ruta privada con barra final también hay barra lateral y Cerrar sesión', async () => {
    const { container } = await renderApp('/administrar-datos/');

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
    expect(container.querySelector('.App')).toHaveClass('pb-nav');
  });

  it('/administrar-datos no tiene el botón de filtros y /explorar sí', async () => {
    const { unmount } = await renderApp('/administrar-datos');
    expect(screen.queryByRole('button', { name: 'privateNav.filters' })).toBeNull();
    unmount();

    await renderApp('/explorar');
    expect(screen.getByRole('button', { name: 'privateNav.filters' })).toBeInTheDocument();
  });

  it('con /explorar/ (barra final) la barra lateral ofrece Filtros y no las opciones privadas', async () => {
    await renderApp('/explorar/');

    expect(screen.getByRole('navigation', { name: 'privateNav.label' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'privateNav.data' })).toBeNull();
  });

  it('las funciones que App pasa a Filter mantienen su identidad entre renders', async () => {
    await renderApp('/explorar');

    expect(filterCallbacks.length).toBeGreaterThan(1);
    expect(new Set(filterCallbacks.map((c) => c.onFilterChange)).size).toBe(1);
    expect(new Set(filterCallbacks.map((c) => c.onSpeciesSelect)).size).toBe(1);
  });
});
