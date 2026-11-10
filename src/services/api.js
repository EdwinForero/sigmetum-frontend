import env from '../config/env';
import { getAccessToken, getRefreshToken, saveTokens, clearSession, redirectUri } from './session';

const RETRY_DELAYS_MS = [1000, 3000];
const AUTH_UNAVAILABLE = 'Authentication service unavailable';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const httpError = (status, message, serverMessage) => {
  const error = new Error(message || `http_${status}`);
  error.type = 'http';
  error.status = status;
  error.serverMessage = serverMessage;
  return error;
};

// Fallo reintentable de Cognito al renovar (5xx, 429, 4xx sin código OAuth): se expone con un tipo y un status propios
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

// POST al endpoint de tokens de Cognito: formulario, cliente público (sin secreto ni Authorization)
// y respuesta sin el envoltorio { success, data }.
async function cognitoToken(params) {
  if (!env.COGNITO_DOMAIN || !env.COGNITO_CLIENT_ID) throw new Error('cognito_not_configured');
  let response;
  try {
    response = await fetch(`${env.COGNITO_DOMAIN}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.COGNITO_CLIENT_ID, ...params }).toString(),
    });
  } catch {
    throw networkError();
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) throw httpError(response.status, json.error, json.error);
  return json;
}

// Se activa al redirigir a /login: otra llamada de esta pestaña ya lo hizo y no hay que repetirlo.
let redirecting = false;
const redirectToLogin = () => {
  redirecting = true;
  clearSession();
  window.location.assign('/login');
};

// Devuelve true si renovó la sesión y false si no se pudo (y entonces ya la ha cerrado).
// Es indeterminado, y se propaga como error reintentable sin cerrar la sesión, un fallo de red, un 5xx, un 429
// o un 4xx sin código OAuth en el cuerpo (p. ej. el HTML de CloudFront). Cualquier otro 4xx con `error` cierra.
async function renewSession() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      saveTokens(await cognitoToken({ grant_type: 'refresh_token', refresh_token: refreshToken }));
      return true;
    } catch (error) {
      const retryable =
        error.type === 'network' ||
        (error.type === 'http' && (error.status === 429 || error.status >= 500 || (error.status >= 400 && !error.serverMessage)));
      if (retryable) throw error.type === 'network' ? error : authUnavailableError();
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

  exchangeCode: async (code, verifier) => {
    saveTokens(await cognitoToken({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri(),
    }));
  },
};

export default api;
