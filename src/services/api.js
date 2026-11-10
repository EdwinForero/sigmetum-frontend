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

// Devuelve true si renovó la sesión y false si no se pudo (y entonces ya la ha cerrado).
// Un fallo de red es indeterminado: se propaga como error reintentable y no cierra la sesión.
async function renewSession() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      saveTokens(await cognitoToken({ grant_type: 'refresh_token', refresh_token: refreshToken }));
      return true;
    } catch (error) {
      if (error.type === 'network') throw error;
    }
  }
  clearSession();
  window.location.assign('/login');
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
    return { response, json };
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
    const renewed = await refreshSession();
    if (renewed) {
      result = await sendWithRetry();
      if (result.response.status === 401) {
        clearSession();
        window.location.assign('/login');
      }
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
