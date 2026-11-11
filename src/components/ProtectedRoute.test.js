import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });
const AUTH_503 = { success: false, error: 'Authentication service unavailable' };

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
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'eu-west-1_AbC');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client123');
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign });
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

  it('con 200 en /auth muestra el contenido y ya no hay botón de cierre de sesión', async () => {
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: {} }));

    renderRoute();

    expect(await screen.findByText('contenido-privado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'login.logOutButton' })).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth$/);
  });

  it('tres 503 seguidos muestran un alert, conservan el token y no redirigen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
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
    session.saveTokens({ AccessToken: 'A' });
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Unauthorized' }));

    renderRoute();

    expect(await screen.findByText('pagina-login')).toBeInTheDocument();
    expect(session.getAccessToken()).toBeNull();
  });

  it.each([
    ['un 500', () => jsonResponse(500, { success: false, error: 'boom' })],
    ['un 403', () => jsonResponse(403, { success: false, error: 'Origin not allowed' })],
  ])('con %s muestra el aviso, conserva el token y no lleva a /login', async (_nombre, respuesta) => {
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    fetchMock.mockResolvedValue(respuesta());

    renderRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
    expect(screen.queryByText('pagina-login')).toBeNull();
    expect(session.getAccessToken()).toBe('A');
  });

  it('con un fallo de red muestra el aviso y no lleva a /login', async () => {
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
    expect(screen.queryByText('pagina-login')).toBeNull();
    expect(session.getAccessToken()).toBe('A');
  });

  it('el aviso tiene un h1 y Reintentar repite la comprobación', async () => {
    const user = userEvent.setup();
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
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
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    fetchMock.mockResolvedValue(jsonResponse(500, { success: false, error: 'boom' }));
    renderRoute();

    await user.click(await screen.findByRole('button', { name: 'login.logOutButton' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/'));
    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
  });

  it('con el refresco de Cognito no disponible muestra el aviso y no lleva a /login', async () => {
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => { throw new SyntaxError('x'); } });

    renderRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
    expect(screen.queryByText('pagina-login')).toBeNull();
    expect(session.getAccessToken()).toBe('A');
  });

  it('el botón de cierre (en el aviso de servicio no disponible) borra los tokens, revoca el refresco y va a /', async () => {
    const user = userEvent.setup();
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    fetchMock.mockResolvedValue(jsonResponse(500, { success: false, error: 'boom' }));
    renderRoute();

    await user.click(await screen.findByRole('button', { name: 'login.logOutButton' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/'));
    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
    const revoke = fetchMock.mock.calls.find((call) => call[1]?.headers?.['X-Amz-Target']?.endsWith('.RevokeToken'));
    expect(JSON.parse(revoke[1].body)).toEqual({ Token: 'R', ClientId: 'client123' });
  });

  it('el botón de cierre (en el aviso de servicio no disponible) se deshabilita mientras dura la revocación', async () => {
    const user = userEvent.setup();
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { success: false, error: 'boom' }));
    fetchMock.mockImplementation(() => new Promise(() => {}));
    renderRoute();

    await user.click(await screen.findByRole('button', { name: 'login.logOutButton' }));

    expect(screen.getByRole('button', { name: 'login.logOutButton' })).toBeDisabled();
    expect(assign).not.toHaveBeenCalled();
  });
});
