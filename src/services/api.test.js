import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from './api';

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });
const nonJsonResponse = (status) => ({
  ok: status < 400,
  status,
  json: async () => {
    throw new SyntaxError('Unexpected token <');
  },
});

describe('api conserva data del error', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('token', 'abc');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('un 400 con data la expone en error.data sin alterar status, type ni serverMessage', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        success: false,
        error: 'Some rows have empty fields.',
        data: { emptyFields: [{ rowIndex: 3 }], draftKey: 'k' },
      })
    );

    await expect(api.postFormAuth('/upload', new FormData())).rejects.toMatchObject({
      type: 'http',
      status: 400,
      serverMessage: 'Some rows have empty fields.',
      data: { emptyFields: [{ rowIndex: 3 }], draftKey: 'k' },
    });
  });

  it('un 400 sin data no añade la propiedad data', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { success: false, error: 'Bad' }));

    const error = await api.postFormAuth('/upload', new FormData()).catch((e) => e);

    expect(error).toMatchObject({ type: 'http', status: 400, serverMessage: 'Bad' });
    expect(error).not.toHaveProperty('data');
  });

  it('un 200 con cuerpo no JSON lanza SyntaxError', async () => {
    fetchMock.mockResolvedValue(nonJsonResponse(200));

    await expect(api.getAuth('/auth')).rejects.toBeInstanceOf(SyntaxError);
  });
});

describe('api ante un 401', () => {
  let fetchMock;
  let assign;

  beforeEach(() => {
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign });
    localStorage.setItem('token', 'abc');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it.each([
    ['getAuth', () => api.getAuth('/auth')],
    ['postAuth', () => api.postAuth('/x', {})],
    ['postFormAuth', () => api.postFormAuth('/x', new FormData())],
    ['deleteAuth', () => api.deleteAuth('/x', {})],
  ])('%s borra el token, redirige a /login y lanza el error', async (_name, call) => {
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Unauthorized' }));

    await expect(call()).rejects.toMatchObject({ status: 401, type: 'http' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('con un 401 de cuerpo no JSON también borra el token y redirige', async () => {
    fetchMock.mockResolvedValue(nonJsonResponse(401));

    await expect(api.getAuth('/auth')).rejects.toMatchObject({ status: 401, type: 'http' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('api.post sin autenticar con 401 no borra el token ni redirige y lanza status 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Invalid' }));

    await expect(api.post('/send-email', {})).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('token')).toBe('abc');
    expect(assign).not.toHaveBeenCalled();
  });

  it('api.get con 401 no borra el token ni redirige', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Invalid' }));

    await expect(api.get('/x')).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('token')).toBe('abc');
    expect(assign).not.toHaveBeenCalled();
  });

  it('getAuth con 200 devuelve los datos sin redirigir', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: 'ok' }));

    await expect(api.getAuth('/auth')).resolves.toBe('ok');

    expect(localStorage.getItem('token')).toBe('abc');
    expect(assign).not.toHaveBeenCalled();
  });
});

const DOMAIN = 'https://auth.example.test';
const ORIGIN = 'https://app.example.test';
const AUTH_503 = { success: false, error: 'Authentication service unavailable' };
const tokenUrl = `${DOMAIN}/oauth2/token`;
const tokenCalls = (fetchMock) => fetchMock.mock.calls.filter((call) => call[0] === tokenUrl);
const bearerOf = (call) => call[1].headers.Authorization;

describe('api con Cognito', () => {
  let api;
  let session;
  let fetchMock;
  let assign;

  beforeEach(async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', DOMAIN);
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client123');
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign, origin: ORIGIN });
    vi.resetModules();
    api = (await import('./api')).default;
    session = await import('./session');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  describe('exchangeCode', () => {
    it('canjea el código sin secreto, guarda acceso y refresco y no el id_token', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { access_token: 'A', id_token: 'I', refresh_token: 'R' }));

      await api.exchangeCode('the-code', 'the-verifier');

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(tokenUrl);
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(options.headers).not.toHaveProperty('Authorization');
      const body = new URLSearchParams(options.body);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('the-code');
      expect(body.get('code_verifier')).toBe('the-verifier');
      expect(body.get('redirect_uri')).toBe(`${ORIGIN}/auth/callback`);
      expect(body.get('client_id')).toBe('client123');
      expect(body.has('client_secret')).toBe(false);
      expect(session.getAccessToken()).toBe('A');
      expect(session.getRefreshToken()).toBe('R');
      expect(Object.values({ ...localStorage })).not.toContain('I');
    });

    it('con un 400 lanza el error y no guarda nada', async () => {
      fetchMock.mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' }));

      await expect(api.exchangeCode('c', 'v')).rejects.toMatchObject({ type: 'http', status: 400 });

      expect(session.getAccessToken()).toBeNull();
    });

    it('con fallo de red lanza un error de red', async () => {
      fetchMock.mockRejectedValue(new TypeError('failed'));

      await expect(api.exchangeCode('c', 'v')).rejects.toMatchObject({ type: 'network' });
    });

    it('sin dominio o sin cliente no hace POST y lanza un error', async () => {
      vi.stubEnv('VITE_COGNITO_CLIENT_ID', '');
      vi.resetModules();
      const apiSinCliente = (await import('./api')).default;

      await expect(apiSinCliente.exchangeCode('c', 'v')).rejects.toThrow();

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Bearer de acceso', () => {
    it('getAuth envía el token de acceso guardado por exchangeCode', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, { access_token: 'A', id_token: 'I', refresh_token: 'R' }));
      await api.exchangeCode('c', 'v');
      fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));

      await api.getAuth('/auth');

      expect(bearerOf(fetchMock.mock.calls[1])).toBe('Bearer A');
    });

    it('sin token no envía la cabecera Authorization', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: 'ok' }));

      await api.getAuth('/auth');

      expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
    });
  });

  describe('401 con refresco', () => {
    beforeEach(() => {
      session.saveTokens({ access_token: 'old', refresh_token: 'R' });
    });

    it('renueva con refresh_token y repite la petición con el token nuevo', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(jsonResponse(200, { access_token: 'new' }))
        .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));

      await expect(api.getAuth('/auth')).resolves.toBe('ok');

      const body = new URLSearchParams(tokenCalls(fetchMock)[0][1].body);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('R');
      expect(body.get('client_id')).toBe('client123');
      expect(body.has('client_secret')).toBe(false);
      expect(bearerOf(fetchMock.mock.calls[0])).toBe('Bearer old');
      expect(bearerOf(fetchMock.mock.calls[2])).toBe('Bearer new');
      expect(session.getAccessToken()).toBe('new');
      expect(session.getRefreshToken()).toBe('R');
      expect(assign).not.toHaveBeenCalled();
    });

    it('con el refresco rechazado borra la sesión, va a /login y lanza el 401', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(jsonResponse(400, { error: 'invalid_grant' }));

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ status: 401, type: 'http' });

      expect(session.getAccessToken()).toBeNull();
      expect(session.getRefreshToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/login');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('sin refreshToken borra la sesión y va a /login sin llamar a Cognito', async () => {
      localStorage.removeItem('refreshToken');
      fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Unauthorized' }));

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ status: 401 });

      expect(tokenCalls(fetchMock)).toHaveLength(0);
      expect(session.getAccessToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('un 401 tras el refresco borra la sesión y va a /login', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(jsonResponse(200, { access_token: 'new' }))
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }));

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ status: 401 });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(session.getAccessToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('con fallo de red en el refresco no borra la sesión ni redirige', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockRejectedValueOnce(new TypeError('failed'));

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ type: 'network' });

      expect(session.getAccessToken()).toBe('old');
      expect(session.getRefreshToken()).toBe('R');
      expect(assign).not.toHaveBeenCalled();
    });

    it('dos llamadas con 401 a la vez producen un único refresco', async () => {
      fetchMock.mockImplementation(async (url, options) => {
        if (url === tokenUrl) return jsonResponse(200, { access_token: 'new' });
        return options.headers.Authorization === 'Bearer new'
          ? jsonResponse(200, { success: true, data: 'ok' })
          : jsonResponse(401, { success: false, error: 'Unauthorized' });
      });

      const results = await Promise.all([api.getAuth('/a'), api.getAuth('/b')]);

      expect(results).toEqual(['ok', 'ok']);
      expect(tokenCalls(fetchMock)).toHaveLength(1);
    });

    it('un 503 tras el refresco se reintenta y no borra la sesión', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(jsonResponse(200, { access_token: 'new' }))
        .mockResolvedValueOnce(jsonResponse(503, AUTH_503))
        .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));

      const result = api.getAuth('/auth');
      await vi.advanceTimersByTimeAsync(1000);

      await expect(result).resolves.toBe('ok');
      expect(session.getAccessToken()).toBe('new');
      expect(assign).not.toHaveBeenCalled();
    });
  });

  describe('503 de autenticación', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    });

    it('tres 503 seguidos: tres llamadas, error 503, sesión conservada y sin redirigir', async () => {
      fetchMock.mockResolvedValue(jsonResponse(503, AUTH_503));

      const result = expect(api.getAuth('/auth')).rejects.toMatchObject({ type: 'http', status: 503 });
      await vi.advanceTimersByTimeAsync(4000);
      await result;

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(session.getAccessToken()).toBe('A');
      expect(session.getRefreshToken()).toBe('R');
      expect(assign).not.toHaveBeenCalled();
    });

    it('un 503 seguido de un 200 se resuelve', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(503, AUTH_503))
        .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));

      const result = api.getAuth('/auth');
      await vi.advanceTimersByTimeAsync(1000);

      await expect(result).resolves.toBe('ok');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('un 503 con otro cuerpo no se reintenta ni borra la sesión', async () => {
      fetchMock.mockResolvedValue(jsonResponse(503, { success: false, error: 'Other' }));

      await expect(api.postAuth('/x', {})).rejects.toMatchObject({ status: 503 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(session.getAccessToken()).toBe('A');
    });

    it('un 503 con cuerpo HTML no rompe ni se reintenta', async () => {
      fetchMock.mockResolvedValue(nonJsonResponse(503));

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ type: 'http', status: 503 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(session.getAccessToken()).toBe('A');
    });
  });
});
