import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from './api';
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

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

const POOL_ID = 'eu-west-1_AbC';
const CLIENT_ID = 'client123';
const AUTH_503 = { success: false, error: 'Authentication service unavailable' };
const tokenUrl = 'https://cognito-idp.eu-west-1.amazonaws.com/';
const cognitoOk = (AuthenticationResult) => jsonResponse(200, { AuthenticationResult });
const cognitoFail = (status, type) => jsonResponse(status, { __type: type, message: 'detalle que no se debe guardar' });
const tokenCalls = (fetchMock) => fetchMock.mock.calls.filter((call) => call[0] === tokenUrl);
const bearerOf = (call) => call[1].headers.Authorization;

describe('api con Cognito', () => {
  let api;
  let session;
  let fetchMock;
  let assign;

  beforeEach(async () => {
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', POOL_ID);
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', CLIENT_ID);
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign });
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

  describe('métodos de login', () => {
    const USER_ID = 'b1c2d3e4-0000-4000-8000-0123456789ab';
    const PASSWORD = 'Tr0ub4dor&3-contrasena-larga';
    const CHALLENGE = {
      USER_ID_FOR_SRP: USER_ID,
      SRP_B: 'c3a15e7f09d248b6'.repeat(32),
      SALT: '9f3a1c5e7b2d4f60a8c1e3b5d7f90214',
      SECRET_BLOCK: Buffer.from('bloque-secreto-de-prueba').toString('base64'),
    };
    const target = (call) => call[1].headers['X-Amz-Target'].replace('AWSCognitoIdentityProviderService.', '');
    const bodyOf = (call) => JSON.parse(call[1].body);

    // Enruta por X-Amz-Target: el reto SRP en InitiateAuth y la respuesta dada en RespondToAuthChallenge.
    const route = (verifierResponse, srpChallenge = { ChallengeName: 'PASSWORD_VERIFIER', ChallengeParameters: CHALLENGE, Session: 'S1' }) => {
      fetchMock.mockImplementation(async (url, options) => {
        const action = options.headers['X-Amz-Target'].replace('AWSCognitoIdentityProviderService.', '');
        return action === 'InitiateAuth' ? jsonResponse(200, srpChallenge) : verifierResponse;
      });
    };

    it('signIn hace InitiateAuth USER_SRP_AUTH y RespondToAuthChallenge PASSWORD_VERIFIER, guarda AccessToken y RefreshToken y no el IdToken', async () => {
      route(cognitoOk({ AccessToken: 'A', IdToken: 'I', RefreshToken: 'R' }));

      const result = await api.signIn('persona@example.test', PASSWORD);

      expect(result).toEqual({ done: true, username: USER_ID });
      expect(fetchMock.mock.calls.map(target)).toEqual(['InitiateAuth', 'RespondToAuthChallenge']);
      const [first, second] = fetchMock.mock.calls;
      expect(first[0]).toBe(tokenUrl);
      expect(first[1].headers['Content-Type']).toBe('application/x-amz-json-1.1');
      const start = bodyOf(first);
      expect(start).toMatchObject({ AuthFlow: 'USER_SRP_AUTH', ClientId: CLIENT_ID });
      expect(start.AuthParameters.USERNAME).toBe('persona@example.test');
      expect(start.AuthParameters.SRP_A).toMatch(/^[0-9a-f]+$/);
      const verify = bodyOf(second);
      expect(verify).toMatchObject({ ChallengeName: 'PASSWORD_VERIFIER', ClientId: CLIENT_ID, Session: 'S1' });
      expect(verify.ChallengeResponses.USERNAME).toBe(USER_ID);
      expect(Object.keys(verify.ChallengeResponses).sort()).toEqual([
        'PASSWORD_CLAIM_SECRET_BLOCK', 'PASSWORD_CLAIM_SIGNATURE', 'TIMESTAMP', 'USERNAME',
      ]);
      expect(session.getAccessToken()).toBe('A');
      expect(session.getRefreshToken()).toBe('R');
      expect(Object.values({ ...localStorage })).not.toContain('I');
    });

    it('signIn firma con la parte del id de pool posterior al guion bajo: SRP_A, TIMESTAMP y firma idénticos a los del paquete', async () => {
      const NOW = new Date(Date.UTC(2026, 10, 9, 7, 5, 3));
      let counter = 0;
      const resetRandom = () => { counter = 0; };
      vi.spyOn(window.crypto, 'getRandomValues').mockImplementation((array) => {
        for (let i = 0; i < array.length; i += 1) array[i] = Math.imul(++counter, 2654435761) >>> 0;
        return array;
      });
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
      const captured = {};
      const pool = new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: CLIENT_ID });
      pool.client.request = vi.fn((operation, request, callback) => {
        if (operation === 'InitiateAuth') {
          captured.srpA = request.AuthParameters.SRP_A;
          callback(null, { ChallengeParameters: CHALLENGE });
        } else {
          captured.responses = request.ChallengeResponses;
          callback(new Error('fin del oráculo'));
        }
      });
      resetRandom();
      await new Promise((resolve) => {
        new CognitoUser({ Username: 'persona@example.test', Pool: pool }).authenticateUser(
          new AuthenticationDetails({ Username: 'persona@example.test', Password: PASSWORD }),
          { onSuccess: resolve, onFailure: resolve }
        );
      });
      route(cognitoOk({ AccessToken: 'A', RefreshToken: 'R' }));

      resetRandom();
      await api.signIn('persona@example.test', PASSWORD);

      const mine = bodyOf(fetchMock.mock.calls[1]).ChallengeResponses;
      expect(bodyOf(fetchMock.mock.calls[0]).AuthParameters.SRP_A).toBe(captured.srpA);
      expect(mine.TIMESTAMP).toBe(captured.responses.TIMESTAMP);
      expect(mine.PASSWORD_CLAIM_SIGNATURE).toBe(captured.responses.PASSWORD_CLAIM_SIGNATURE);
    });

    it('signIn cede un turno antes del cálculo pesado de A: no llama a Cognito de forma síncrona', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout'] });
      route(cognitoOk({ AccessToken: 'A', RefreshToken: 'R' }));

      const pending = api.signIn('persona@example.test', PASSWORD);

      expect(fetchMock).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(0);
      await pending;
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('la contraseña no aparece en ningún cuerpo de fetch', async () => {
      route(cognitoOk({ AccessToken: 'A', RefreshToken: 'R' }));

      await api.signIn('persona@example.test', PASSWORD);

      fetchMock.mock.calls.forEach((call) => expect(call[1].body).not.toContain(PASSWORD));
    });

    it('sin Session en el reto no la envía', async () => {
      route(cognitoOk({ AccessToken: 'A' }), { ChallengeName: 'PASSWORD_VERIFIER', ChallengeParameters: CHALLENGE });

      await api.signIn('persona@example.test', PASSWORD);

      expect(bodyOf(fetchMock.mock.calls[1])).not.toHaveProperty('Session');
    });

    it('si Cognito responde con otro reto, lo devuelve con su Session y el usuario', async () => {
      route(jsonResponse(200, { ChallengeName: 'SOFTWARE_TOKEN_MFA', Session: 'S2' }));

      await expect(api.signIn('persona@example.test', PASSWORD)).resolves.toEqual({
        challenge: 'SOFTWARE_TOKEN_MFA',
        session: 'S2',
        username: USER_ID,
      });
      expect(session.getAccessToken()).toBeNull();
    });

    it('un 200 sin tokens ni reto lanza un error de Cognito sin guardar nada', async () => {
      route(jsonResponse(200, {}));

      await expect(api.signIn('persona@example.test', PASSWORD)).rejects.toMatchObject({ type: 'cognito', status: 200 });
      expect(session.getAccessToken()).toBeNull();
    });

    it('un error de InitiateAuth lanza status y __type normalizado, sin el message de Cognito', async () => {
      fetchMock.mockResolvedValue(cognitoFail(400, 'com.amazonaws.cognito.identity.idp.model#NotAuthorizedException'));

      const error = await api.signIn('persona@example.test', PASSWORD).catch((e) => e);

      expect(error).toMatchObject({ type: 'cognito', status: 400, code: 'NotAuthorizedException' });
      expect(JSON.stringify([error.message, error.code])).not.toContain('detalle');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('un fallo de red lanza un error network', async () => {
      fetchMock.mockRejectedValue(new TypeError('failed'));

      await expect(api.signIn('persona@example.test', PASSWORD)).rejects.toMatchObject({ type: 'network' });
    });

    it.each([
      ['el pool vacío', 'VITE_COGNITO_USER_POOL_ID', ''],
      ['un pool sin guion bajo', 'VITE_COGNITO_USER_POOL_ID', 'singuion'],
      ['el cliente vacío', 'VITE_COGNITO_CLIENT_ID', ''],
      ['una región que no es un nombre de región', 'VITE_COGNITO_USER_POOL_ID', 'evil.example/x_AbC'],
      ['una región con mayúsculas', 'VITE_COGNITO_USER_POOL_ID', 'EU-west-1_AbC'],
    ])('con %s lanza un error de configuración sin llamar a fetch', async (_name, variable, value) => {
      vi.stubEnv(variable, value);
      vi.resetModules();
      const apiSinConfig = (await import('./api')).default;

      await expect(apiSinConfig.signIn('persona@example.test', PASSWORD)).rejects.toMatchObject({ type: 'config' });
      await expect(apiSinConfig.associateSoftwareToken('S')).rejects.toMatchObject({ type: 'config' });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('respondToChallenge envía ChallengeName, ClientId, Session y respuestas, y guarda los tokens al terminar', async () => {
      fetchMock.mockResolvedValue(cognitoOk({ AccessToken: 'A', RefreshToken: 'R' }));

      const result = await api.respondToChallenge('SOFTWARE_TOKEN_MFA', 'S1', { USERNAME: USER_ID, SOFTWARE_TOKEN_MFA_CODE: '123456' });

      expect(result).toEqual({ done: true });
      expect(target(fetchMock.mock.calls[0])).toBe('RespondToAuthChallenge');
      expect(bodyOf(fetchMock.mock.calls[0])).toEqual({
        ChallengeName: 'SOFTWARE_TOKEN_MFA',
        ClientId: CLIENT_ID,
        Session: 'S1',
        ChallengeResponses: { USERNAME: USER_ID, SOFTWARE_TOKEN_MFA_CODE: '123456' },
      });
      expect(session.getAccessToken()).toBe('A');
    });

    it('respondToChallenge devuelve el siguiente reto con su Session', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ChallengeName: 'MFA_SETUP', Session: 'S2' }));

      await expect(api.respondToChallenge('NEW_PASSWORD_REQUIRED', 'S1', { USERNAME: USER_ID })).resolves.toEqual({
        challenge: 'MFA_SETUP',
        session: 'S2',
      });
    });

    it('associateSoftwareToken devuelve el secreto y la Session, sin ClientId', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { SecretCode: 'ABCDEF', Session: 'S2' }));

      await expect(api.associateSoftwareToken('S1')).resolves.toEqual({ secretCode: 'ABCDEF', session: 'S2' });

      expect(target(fetchMock.mock.calls[0])).toBe('AssociateSoftwareToken');
      expect(bodyOf(fetchMock.mock.calls[0])).toEqual({ Session: 'S1' });
    });

    it.each([
      ['SUCCESS', true],
      ['ERROR', false],
    ])('verifySoftwareToken con Status %s da ok %s', async (Status, ok) => {
      fetchMock.mockResolvedValue(jsonResponse(200, { Status, Session: 'S3' }));

      await expect(api.verifySoftwareToken('S2', '123456')).resolves.toEqual({ ok, session: 'S3' });

      expect(target(fetchMock.mock.calls[0])).toBe('VerifySoftwareToken');
      expect(bodyOf(fetchMock.mock.calls[0])).toEqual({ Session: 'S2', UserCode: '123456' });
    });
  });

  describe('logout', () => {
    const revokeCalls = () => fetchMock.mock.calls.filter((call) => call[1].headers['X-Amz-Target'].endsWith('.RevokeToken'));

    beforeEach(() => {
      session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    });

    it('borra la sesión antes de revocar, revoca el refresco con { Token, ClientId } y va a /', async () => {
      let accessWhenRevoking;
      let refreshWhenRevoking;
      fetchMock.mockImplementation(async () => {
        accessWhenRevoking = session.getAccessToken();
        refreshWhenRevoking = session.getRefreshToken();
        return jsonResponse(200, {});
      });

      await api.logout();

      expect(accessWhenRevoking).toBeNull();
      expect(refreshWhenRevoking).toBeNull();
      expect(revokeCalls()).toHaveLength(1);
      expect(revokeCalls()[0][0]).toBe(tokenUrl);
      expect(JSON.parse(revokeCalls()[0][1].body)).toEqual({ Token: 'R', ClientId: CLIENT_ID });
      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith('/');
    });

    it.each([
      ['rechaza la revocación', () => fetchMock.mockRejectedValue(new TypeError('failed'))],
      ['responde 400', () => fetchMock.mockResolvedValue(cognitoFail(400, 'NotAuthorizedException'))],
    ])('navega a / aunque la revocación %s', async (_name, arrange) => {
      arrange();

      await api.logout();

      expect(session.getAccessToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/');
    });

    it('sin token de refresco no llama a Cognito y va a /', async () => {
      localStorage.removeItem('refreshToken');

      await api.logout();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(session.getAccessToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/');
    });

    it('si Cognito no responde, navega a / a los 3000 ms y no antes', async () => {
      vi.useFakeTimers();
      fetchMock.mockImplementation(() => new Promise(() => {}));

      const done = api.logout();
      await vi.advanceTimersByTimeAsync(2999);
      expect(assign).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      await done;

      expect(assign).toHaveBeenCalledWith('/');
    });
  });

  describe('Bearer de acceso', () => {
    it('getAuth envía el token de acceso guardado', async () => {
      session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
      fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));

      await api.getAuth('/auth');

      expect(bearerOf(fetchMock.mock.calls[0])).toBe('Bearer A');
    });

    it('sin token no envía la cabecera Authorization', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: 'ok' }));

      await api.getAuth('/auth');

      expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
    });
  });

  describe('401 con refresco', () => {
    beforeEach(() => {
      session.saveTokens({ AccessToken: 'old', RefreshToken: 'R' });
    });

    it('renueva con InitiateAuth REFRESH_TOKEN_AUTH y repite la petición con el token nuevo', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(cognitoOk({ AccessToken: 'new' }))
        .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));

      await expect(api.getAuth('/auth')).resolves.toBe('ok');

      const [url, options] = tokenCalls(fetchMock)[0];
      expect(url).toBe(tokenUrl);
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/x-amz-json-1.1');
      expect(options.headers['X-Amz-Target']).toBe('AWSCognitoIdentityProviderService.InitiateAuth');
      expect(options.headers).not.toHaveProperty('Authorization');
      expect(JSON.parse(options.body)).toEqual({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: 'R' },
      });
      expect(bearerOf(fetchMock.mock.calls[0])).toBe('Bearer old');
      expect(bearerOf(fetchMock.mock.calls[2])).toBe('Bearer new');
      expect(session.getAccessToken()).toBe('new');
      expect(session.getRefreshToken()).toBe('R');
      expect(assign).not.toHaveBeenCalled();
    });

    it('un RefreshToken nuevo sustituye al anterior y no se guarda el IdToken', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(cognitoOk({ AccessToken: 'new', IdToken: 'I', RefreshToken: 'R2' }))
        .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));

      await api.getAuth('/auth');

      expect(session.getRefreshToken()).toBe('R2');
      expect(Object.values({ ...localStorage })).not.toContain('I');
    });

    it('si la sesión se cierra mientras se renueva, el resultado de la renovación no se guarda', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockImplementationOnce(async () => {
          session.clearSession();
          return cognitoOk({ AccessToken: 'new', RefreshToken: 'R2' });
        });

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ status: 401 });

      expect(session.getAccessToken()).toBeNull();
      expect(session.getRefreshToken()).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('con el refresco rechazado borra la sesión, va a /login y lanza el 401', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(cognitoFail(400, 'NotAuthorizedException'));

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
        .mockResolvedValueOnce(cognitoOk({ AccessToken: 'new' }))
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

    it.each([
      ['un 500 con __type', () => cognitoFail(500, 'InternalErrorException')],
      ['un 503 sin __type', () => jsonResponse(503, { message: 'x' })],
      ['un 429 sin __type', () => jsonResponse(429, {})],
      ['TooManyRequestsException', () => cognitoFail(400, 'TooManyRequestsException')],
      ['LimitExceededException', () => cognitoFail(400, 'LimitExceededException')],
      ['InternalErrorException en un 400', () => cognitoFail(400, 'InternalErrorException')],
      ['un 4xx sin __type', () => jsonResponse(403, {})],
      ['un cuerpo no JSON', () => nonJsonResponse(403)],
      ['un 502 de cuerpo no JSON', () => nonJsonResponse(502)],
    ])('al refrescar, %s conserva la sesión, no redirige y lanza auth_unavailable (no un 401 del backend)', async (_name, response) => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(response());

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ type: 'auth_unavailable', status: 503 });

      expect(session.getAccessToken()).toBe('old');
      expect(session.getRefreshToken()).toBe('R');
      expect(assign).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('con la configuración de Cognito vacía conserva la sesión y lanza auth_unavailable sin llamar a Cognito', async () => {
      vi.stubEnv('VITE_COGNITO_USER_POOL_ID', '');
      vi.resetModules();
      const apiSinPool = (await import('./api')).default;
      fetchMock.mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }));

      await expect(apiSinPool.getAuth('/auth')).rejects.toMatchObject({ type: 'auth_unavailable', status: 503 });

      expect(tokenCalls(fetchMock)).toHaveLength(0);
      expect(session.getAccessToken()).toBe('old');
      expect(assign).not.toHaveBeenCalled();
    });

    it.each([
      'NotAuthorizedException',
      'com.amazonaws.cognito.identity.idp.model#NotAuthorizedException',
      'NotAuthorizedException:Refresh Token has expired',
      'InvalidParameterException',
      'ResourceNotFoundException',
      'UserNotFoundException',
      'PasswordResetRequiredException',
      'AlgoNuncaVistoException',
    ])('al refrescar, un 400 %s cierra la sesión y va a /login', async (type) => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(cognitoFail(400, type));

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ type: 'http', status: 401 });

      expect(session.getAccessToken()).toBeNull();
      expect(session.getRefreshToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('con un 200 de Cognito sin AccessToken cierra la sesión y va a /login', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(jsonResponse(200, {}));

      await expect(api.getAuth('/auth')).rejects.toMatchObject({ status: 401 });

      expect(session.getAccessToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('dos llamadas con 401 a la vez producen un único refresco', async () => {
      fetchMock.mockImplementation(async (url, options) => {
        if (url === tokenUrl) return cognitoOk({ AccessToken: 'new' });
        return options.headers.Authorization === 'Bearer new'
          ? jsonResponse(200, { success: true, data: 'ok' })
          : jsonResponse(401, { success: false, error: 'Unauthorized' });
      });

      const results = await Promise.all([api.getAuth('/a'), api.getAuth('/b')]);

      expect(results).toEqual(['ok', 'ok']);
      expect(tokenCalls(fetchMock)).toHaveLength(1);
    });

    // La primera petición a /b queda pendiente hasta que el test la libera con el estado que indique.
    const deferFirstB = (respond) => {
      let release;
      const pending = new Promise((resolve) => { release = resolve; });
      let deferred = false;
      fetchMock.mockImplementation(async (url, options) => {
        if (url === tokenUrl) return cognitoOk({ AccessToken: 'new' });
        if (options.headers.Authorization === 'Bearer new') return respond(url);
        if (url.endsWith('/b') && !deferred) {
          deferred = true;
          return pending;
        }
        return jsonResponse(401, { success: false, error: 'Unauthorized' });
      });
      return () => release(jsonResponse(401, { success: false, error: 'Unauthorized' }));
    };

    it('un 401 tardío con el token ya renovado reintenta sin otro refresco', async () => {
      const releaseB = deferFirstB(() => jsonResponse(200, { success: true, data: 'ok' }));

      const b = api.getAuth('/b');
      await expect(api.getAuth('/a')).resolves.toBe('ok');
      releaseB();

      await expect(b).resolves.toBe('ok');
      expect(tokenCalls(fetchMock)).toHaveLength(1);
      expect(session.getAccessToken()).toBe('new');
      expect(assign).not.toHaveBeenCalled();
    });

    it('el reintento de un 401 tardío vuelve a dar 401: borra la sesión sin otro refresco', async () => {
      const releaseB = deferFirstB(() => jsonResponse(401, { success: false, error: 'Unauthorized' }));

      const b = api.getAuth('/b');
      session.saveTokens({ AccessToken: 'new' });
      releaseB();

      await expect(b).rejects.toMatchObject({ status: 401, type: 'http' });
      expect(tokenCalls(fetchMock)).toHaveLength(0);
      expect(session.getAccessToken()).toBeNull();
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('un 401 tardío con la sesión ya borrada no redirige otra vez', async () => {
      let releaseB;
      let deferred = false;
      fetchMock.mockImplementation(async (url) => {
        if (url === tokenUrl) return cognitoFail(400, 'NotAuthorizedException');
        if (url.endsWith('/b') && !deferred) {
          deferred = true;
          return new Promise((resolve) => {
            releaseB = () => resolve(jsonResponse(401, { success: false, error: 'Unauthorized' }));
          });
        }
        return jsonResponse(401, { success: false, error: 'Unauthorized' });
      });

      const b = api.getAuth('/b');
      await expect(api.getAuth('/a')).rejects.toMatchObject({ status: 401 });
      releaseB();

      await expect(b).rejects.toMatchObject({ status: 401 });
      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('un 401 con la sesión borrada en otra pestaña redirige a /login una vez y lanza el 401', async () => {
      const releaseB = deferFirstB(() => jsonResponse(200, { success: true, data: 'ok' }));

      const b = api.getAuth('/b');
      session.clearSession();
      releaseB();

      await expect(b).rejects.toMatchObject({ status: 401, type: 'http' });
      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith('/login');
      expect(tokenCalls(fetchMock)).toHaveLength(0);
    });

    it('dos 401 simultáneos cuyo reintento vuelve a dar 401 redirigen una sola vez', async () => {
      fetchMock.mockImplementation(async (url) => {
        if (url === tokenUrl) return cognitoOk({ AccessToken: 'new' });
        return jsonResponse(401, { success: false, error: 'Unauthorized' });
      });

      const results = await Promise.allSettled([api.getAuth('/a'), api.getAuth('/b')]);

      expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith('/login');
    });

    it('un 503 tras el refresco se reintenta y no borra la sesión', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      fetchMock
        .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }))
        .mockResolvedValueOnce(cognitoOk({ AccessToken: 'new' }))
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
      session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
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
