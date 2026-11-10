import env from '../config/env';
import { getAccessToken, getRefreshToken, saveTokens, clearSession } from './session';
import { srpStart, srpPasswordVerifier } from './srp';

const RETRY_DELAYS_MS = [1000, 3000];
const REVOKE_TIMEOUT_MS = 3000;
const AUTH_UNAVAILABLE = 'Authentication service unavailable';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const httpError = (status, message, serverMessage) => {
  const error = new Error(message || `http_${status}`);
  error.type = 'http';
  error.status = status;
  error.serverMessage = serverMessage;
  return error;
};

// Fallo reintentable de Cognito al renovar (red, 5xx, 429, lista blanca de __type, 4xx sin __type): se expone con un tipo y un status propios
// para que ningún consumidor lo confunda con un 401 del backend (sesión caducada).
const authUnavailableError = () => {
  const error = new Error(AUTH_UNAVAILABLE);
  error.type = 'auth_unavailable';
  error.status = 503;
  return error;
};

const networkError = () => {
  const error = new Error('network_error');
  error.type = 'network';
  return error;
};

const configError = () => {
  const error = new Error('cognito_not_configured');
  error.type = 'config';
  return error;
};

// Error de Cognito: solo se guardan el status y el `__type` normalizado; el `message` de Cognito nunca.
const cognitoError = (status, code) => {
  const error = new Error(code || `cognito_${status}`);
  error.type = 'cognito';
  error.status = status;
  error.code = code;
  return error;
};

// Del `__type` ('com.amazonaws...#NotAuthorizedException', 'NotAuthorizedException:detalle') se deja el nombre.
const errorCode = (json) => (typeof json?.__type === 'string' ? json.__type.split('#').pop().split(':')[0] : '');

// https://cognito-idp.<región>.amazonaws.com/, con la región del prefijo del id de pool; null si falta configuración.
const REGION_FORMAT = /^[a-z]{2}(-[a-z]+)+-\d$/;
const cognitoEndpoint = () => {
  const region = env.COGNITO_USER_POOL_ID.split('_')[0];
  if (!env.COGNITO_USER_POOL_ID.includes('_') || !REGION_FORMAT.test(region) || !env.COGNITO_CLIENT_ID) return null;
  return `https://cognito-idp.${region}.amazonaws.com/`;
};

// POST JSON 1.1 a cognito-idp, cliente público (sin secreto ni Authorization) y sin el envoltorio { success, data }.
async function cognito(action, payload) {
  const endpoint = cognitoEndpoint();
  if (!endpoint) throw configError();
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw networkError();
  }
  const json = await response.json().catch(() => null);
  if (!response.ok) throw cognitoError(response.status, errorCode(json));
  return json ?? {};
}

const RETRYABLE_CODES = ['TooManyRequestsException', 'LimitExceededException', 'InternalErrorException'];

// Lista blanca de fallos de Cognito que no significan "credencial rechazada": red, configuración vacía, 5xx, 429,
// los tres __type de límite o error interno, un 4xx sin __type (p. ej. el HTML de CloudFront) o un cuerpo no JSON.
export const isRetryableAuthError = (error) =>
  error.type === 'network' ||
  error.type === 'config' ||
  (error.type === 'cognito' &&
    (error.status >= 500 || error.status === 429 || RETRYABLE_CODES.includes(error.code) || (error.status >= 400 && !error.code)));

// Resultado de un InitiateAuth/RespondToAuthChallenge: con AccessToken guarda la sesión (aquí, no en LoginForm);
// con un reto lo devuelve con su Session; cualquier otra cosa (un 200 vacío) es un error de Cognito.
const settle = (response) => {
  if (response.AuthenticationResult?.AccessToken) {
    saveTokens(response.AuthenticationResult);
    return { done: true };
  }
  if (response.ChallengeName) return { challenge: response.ChallengeName, session: response.Session };
  throw cognitoError(200, '');
};

// Parte del id de pool posterior al guion bajo (igual que CognitoUserPool.getUserPoolName del paquete).
const poolName = () => env.COGNITO_USER_POOL_ID.split('_')[1];

// Se activa al redirigir a /login: otra llamada de esta pestaña ya lo hizo y no hay que repetirlo.
let redirecting = false;
const redirectToLogin = () => {
  redirecting = true;
  clearSession();
  window.location.assign('/login');
};

// Devuelve true si renovó la sesión y false si no se pudo (y entonces ya la ha cerrado).
// Es indeterminado, y se propaga como error reintentable sin cerrar la sesión, lo que `isRetryableAuthError` admite.
// Cualquier otro `__type` de un 4xx, y un 200 sin AccessToken, cierra la sesión.
async function renewSession() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      const { AuthenticationResult: result } = await cognito('InitiateAuth', {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: env.COGNITO_CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      });
      if (result?.AccessToken) {
        // Si la sesión se cerró (o cambió) mientras se renovaba, el resultado ya no es válido: no se guarda.
        if (getRefreshToken() !== refreshToken) return false;
        saveTokens(result);
        return true;
      }
    } catch (error) {
      if (isRetryableAuthError(error)) throw error.type === 'network' ? error : authUnavailableError();
    }
  }
  redirectToLogin();
  return false;
}

// Una sola renovación compartida por todas las llamadas con 401 simultáneas.
let refreshing = null;
const refreshSession = () => {
  if (!refreshing) refreshing = renewSession().finally(() => { refreshing = null; });
  return refreshing;
};

async function request(path, options = {}, { authenticated = false } = {}) {
  const send = async () => {
    const headers = { ...options.headers };
    const token = authenticated ? getAccessToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try {
      response = await fetch(`${env.BASE_URL}${env.API_PREFIX}${path}`, { ...options, headers });
    } catch {
      throw networkError();
    }
    // En llamadas con token un cuerpo no JSON (p. ej. el HTML de un 503 del ALB) no debe romper el flujo.
    const tolerant = authenticated && (response.status === 401 || response.status === 503);
    const json = tolerant ? await response.json().catch(() => ({})) : await response.json();
    return { response, json, token };
  };

  // Solo el 503 de autenticación (sale antes de que la ruta haga nada) es seguro de reintentar.
  const sendWithRetry = async () => {
    let result = await send();
    if (!authenticated) return result;
    for (const delay of RETRY_DELAYS_MS) {
      if (result.response.status !== 503 || result.json.error !== AUTH_UNAVAILABLE) break;
      await sleep(delay);
      result = await send();
    }
    return result;
  };

  let result = await sendWithRetry();

  if (authenticated && result.response.status === 401) {
    // Si el token ya no es el que se envió, otra llamada renovó la sesión: se reintenta sin otro refresco.
    // Sin token no hay nada que renovar: si esta pestaña ya redirigió no se repite; si no (la sesión se cerró en otra pestaña), se redirige.
    const current = getAccessToken();
    let renewed = false;
    if (current) renewed = current !== result.token ? true : await refreshSession();
    else if (!redirecting) redirectToLogin();
    if (renewed) {
      result = await sendWithRetry();
      if (result.response.status === 401 && !redirecting) redirectToLogin();
    }
    if (result.response.status === 401) throw httpError(401, result.json.error, result.json.error);
  }

  const { response, json } = result;

  if (!response.ok || !json.success) {
    const error = httpError(response.status, json.error, json.error);
    if (json.data !== undefined) error.data = json.data;
    throw error;
  }

  return json.data;
}

const api = {
  get: (path) =>
    request(path),

  getAuth: (path) =>
    request(path, {}, { authenticated: true }),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  postAuth: (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, { authenticated: true }),

  postFormAuth: (path, formData) =>
    request(path, {
      method: 'POST',
      body: formData,
    }, { authenticated: true }),

  deleteAuth: (path, body) =>
    request(path, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, { authenticated: true }),

  // Cierre de sesión: se leen los datos, se borra la sesión y se revoca el refresco (de mejor esfuerzo, hasta 3 s:
  // la navegación cancelaría el fetch); después se va a /. Un fallo de la revocación no impide cerrar la sesión.
  logout: async () => {
    const refreshToken = getRefreshToken();
    clearSession();
    if (refreshToken) {
      try {
        await Promise.race([
          cognito('RevokeToken', { Token: refreshToken, ClientId: env.COGNITO_CLIENT_ID }),
          sleep(REVOKE_TIMEOUT_MS),
        ]);
      } catch {
        // Revocación de mejor esfuerzo: la sesión local ya está cerrada.
      }
    }
    window.location.assign('/');
  },

  // Acceso por SRP (USER_SRP_AUTH). La contraseña solo se usa para el cálculo local: no viaja ni se guarda.
  signIn: async (username, password) => {
    if (!cognitoEndpoint()) throw configError();
    // Cede un turno real: el cálculo de A es pesado y síncrono, y así "Comprobando…" llega a pintarse antes.
    await sleep(0);
    const { helper, srpA } = srpStart(poolName());
    const start = await cognito('InitiateAuth', {
      AuthFlow: 'USER_SRP_AUTH',
      ClientId: env.COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: username, SRP_A: srpA },
    });
    if (!start.ChallengeParameters?.SRP_B) throw cognitoError(200, '');
    const responses = await srpPasswordVerifier(helper, poolName(), password, start.ChallengeParameters);
    const reply = await cognito('RespondToAuthChallenge', {
      ChallengeName: 'PASSWORD_VERIFIER',
      ClientId: env.COGNITO_CLIENT_ID,
      ChallengeResponses: responses,
      ...(start.Session ? { Session: start.Session } : {}),
    });
    return { ...settle(reply), username: start.ChallengeParameters.USER_ID_FOR_SRP };
  },

  respondToChallenge: async (name, session, responses) =>
    settle(await cognito('RespondToAuthChallenge', {
      ChallengeName: name,
      ClientId: env.COGNITO_CLIENT_ID,
      Session: session,
      ChallengeResponses: responses,
    })),

  associateSoftwareToken: async (session) => {
    const reply = await cognito('AssociateSoftwareToken', { Session: session });
    return { secretCode: reply.SecretCode, session: reply.Session };
  },

  verifySoftwareToken: async (session, code) => {
    const reply = await cognito('VerifySoftwareToken', { Session: session, UserCode: code });
    return { ok: reply.Status === 'SUCCESS', session: reply.Session };
  },
};

export default api;
