import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link, useLocation, useNavigationType } from 'react-router-dom';
import { webcrypto } from 'node:crypto';

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });

// Muestra cómo se llegó a la ubicación actual (POP, PUSH o REPLACE) y cuál es, query incluida.
const LocationProbe = () => {
  const { pathname, search } = useLocation();
  const type = useNavigationType();
  return <span data-testid="location">{`${type} ${pathname}${search}`}</span>;
};
const CLEAN_URL = 'REPLACE /auth/callback';

describe('AuthCallback', () => {
  let AuthCallback;
  let fetchMock;
  let assign;

  const renderAt = (search) =>
    render(
      <React.StrictMode>
        <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
          <LocationProbe />
          <Link to="/otra">salir</Link>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/cargar-archivos" element={<p>pagina-carga</p>} />
            <Route path="/otra" element={<p>otra-pagina</p>} />
          </Routes>
        </MemoryRouter>
      </React.StrictMode>
    );

  const seedPkce = (state = 'st-1') => {
    sessionStorage.setItem('pkce_verifier', 'ver-1');
    sessionStorage.setItem('pkce_state', state);
  };

  beforeEach(async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', 'https://auth.example.test');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client123');
    if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign, origin: 'https://app.example.test' });
    vi.resetModules();
    AuthCallback = (await import('./AuthCallback')).default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('con éxito canjea el código una sola vez (también en StrictMode), guarda los tokens y navega', async () => {
    seedPkce();
    let resolveFetch;
    fetchMock.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));

    renderAt('?code=abc&state=st-1');

    // Sin la guarda, el segundo efecto de StrictMode ya habría fallado la validación (takePkce vació el almacenamiento).
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
    resolveFetch(jsonResponse(200, { access_token: 'A', id_token: 'I', refresh_token: 'R' }));

    expect(await screen.findByText('pagina-carga')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    expect(body.get('code')).toBe('abc');
    expect(body.get('code_verifier')).toBe('ver-1');
    expect(localStorage.getItem('token')).toBe('A');
    expect(localStorage.getItem('refreshToken')).toBe('R');
    expect(sessionStorage.getItem('pkce_verifier')).toBeNull();
  });

  it('mientras canjea muestra un estado de carga con role=status', async () => {
    seedPkce();
    fetchMock.mockReturnValue(new Promise(() => {}));

    renderAt('?code=abc&state=st-1');

    expect(await screen.findByRole('status')).toHaveTextContent('login.callbackLoading');
    expect(screen.getByRole('heading', { level: 1, name: 'login.title' })).toBeInTheDocument();
  });

  it('con un state distinto muestra un alert, no llama a fetch ni guarda tokens', async () => {
    seedPkce('st-1');

    renderAt('?code=abc&state=otro');

    expect(await screen.findByRole('alert')).toHaveTextContent('login.callbackError');
    expect(await screen.findByText(CLEAN_URL)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('sin state guardado no canjea aunque la URL no traiga state', async () => {
    renderAt('?code=abc');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText(CLEAN_URL)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con error=access_denied muestra un alert sin la descripción de Cognito', async () => {
    seedPkce();

    renderAt('?error=access_denied&error_description=secreto-de-cognito&state=st-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('login.callbackError');
    expect(await screen.findByText(CLEAN_URL)).toBeInTheDocument();
    expect(screen.queryByText(/secreto-de-cognito/)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('con el canje rechazado (400) muestra un alert y no guarda tokens', async () => {
    seedPkce();
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' }));

    renderAt('?code=abc&state=st-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('login.callbackError');
    expect(await screen.findByText(CLEAN_URL)).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('con fallo de red en el canje muestra un alert y quita code y state de la URL', async () => {
    seedPkce();
    fetchMock.mockRejectedValue(new TypeError('failed'));

    renderAt('?code=abc&state=st-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('login.callbackError');
    expect(await screen.findByText(CLEAN_URL)).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('tras salir de la pantalla, un fallo tardío del canje no navega de nuevo al callback', async () => {
    const user = userEvent.setup();
    seedPkce();
    let rejectFetch;
    fetchMock.mockReturnValue(new Promise((_, reject) => { rejectFetch = reject; }));

    renderAt('?code=abc&state=st-1');
    expect(await screen.findByText(CLEAN_URL)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'salir' }));
    expect(await screen.findByText('otra-pagina')).toBeInTheDocument();
    rejectFetch(new TypeError('failed'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByTestId('location')).toHaveTextContent('PUSH /otra');
  });

  it('sin configuración de Cognito muestra un alert y no hace POST', async () => {
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '');
    vi.resetModules();
    AuthCallback = (await import('./AuthCallback')).default;
    seedPkce();

    renderAt('?code=abc&state=st-1');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText(CLEAN_URL)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('el botón de reintento redirige a una URL de autorización nueva', async () => {
    const user = userEvent.setup();
    renderAt('?error=access_denied');

    await user.click(await screen.findByRole('button', { name: 'login.retryButton' }));

    await vi.waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });
});
