import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });
const AUTH_503 = { success: false, error: 'Authentication service unavailable' };
const ORIGIN = 'https://app.example.test';

describe('ProtectedRoute', () => {
  let ProtectedRoute;
  let session;
  let fetchMock;
  let assign;

  const renderRoute = () =>
    render(
      <MemoryRouter initialEntries={['/privada']}>
        <Routes>
          <Route path="/privada" element={<ProtectedRoute element={<p>contenido-privado</p>} />} />
          <Route path="/login" element={<p>pagina-login</p>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', 'https://auth.example.test');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client123');
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign, origin: ORIGIN });
    vi.resetModules();
    ProtectedRoute = (await import('./ProtectedRoute')).default;
    session = await import('../services/session');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('sin token lleva a /login sin llamar a la API', async () => {
    renderRoute();

    expect(await screen.findByText('pagina-login')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con 200 en /auth muestra el contenido y el botón de cierre de sesión', async () => {
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: {} }));

    renderRoute();

    expect(await screen.findByText('contenido-privado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth$/);
  });

  it('tres 503 seguidos muestran un alert, conservan el token y no redirigen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock.mockResolvedValue(jsonResponse(503, AUTH_503));

    renderRoute();
    await vi.advanceTimersByTimeAsync(4000);

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(session.getAccessToken()).toBe('A');
    expect(assign).not.toHaveBeenCalled();
    expect(screen.queryByText('contenido-privado')).toBeNull();
  });

  it('con un 401 sin refresco lleva a /login', async () => {
    session.saveTokens({ access_token: 'A' });
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Unauthorized' }));

    renderRoute();

    expect(await screen.findByText('pagina-login')).toBeInTheDocument();
    expect(session.getAccessToken()).toBeNull();
  });

  it.each([
    ['un 500', () => jsonResponse(500, { success: false, error: 'boom' })],
    ['un 403', () => jsonResponse(403, { success: false, error: 'Origin not allowed' })],
  ])('con %s muestra el aviso, conserva el token y no lleva a /login', async (_nombre, respuesta) => {
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock.mockResolvedValue(respuesta());

    renderRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
    expect(screen.queryByText('pagina-login')).toBeNull();
    expect(session.getAccessToken()).toBe('A');
  });

  it('con un fallo de red muestra el aviso y no lleva a /login', async () => {
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
    expect(screen.queryByText('pagina-login')).toBeNull();
    expect(session.getAccessToken()).toBe('A');
  });

  it('el aviso tiene un h1 y Reintentar repite la comprobación', async () => {
    const user = userEvent.setup();
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { success: false, error: 'boom' }));
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: {} }));

    renderRoute();
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'login.retryButton' }));

    expect(await screen.findByText('contenido-privado')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('con el aviso de servicio no disponible hay un botón de cerrar sesión que borra los tokens', async () => {
    const user = userEvent.setup();
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock.mockResolvedValue(jsonResponse(500, { success: false, error: 'boom' }));
    renderRoute();

    await user.click(await screen.findByRole('button', { name: 'login.logOutButton' }));

    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
    expect(new URL(assign.mock.calls[0][0]).pathname).toBe('/logout');
  });

  it('con el refresco de Cognito no disponible muestra el aviso y no lleva a /login', async () => {
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => { throw new SyntaxError('x'); } });

    renderRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
    expect(screen.queryByText('pagina-login')).toBeNull();
    expect(session.getAccessToken()).toBe('A');
  });

  it('el botón de cierre borra los tokens y redirige al logout de Cognito', async () => {
    const user = userEvent.setup();
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: {} }));
    renderRoute();

    await user.click(await screen.findByRole('button', { name: 'login.logOutButton' }));

    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.pathname).toBe('/logout');
    expect(url.searchParams.get('client_id')).toBe('client123');
    expect(url.searchParams.get('logout_uri')).toBe(`${ORIGIN}/`);
  });
});
