import env from '../config/env';

// Único módulo que toca el almacenamiento del navegador para la sesión:
// localStorage (token de acceso y de refresco) y sessionStorage (PKCE).
const ACCESS_KEY = 'token';
const REFRESH_KEY = 'refreshToken';
const VERIFIER_KEY = 'pkce_verifier';
const STATE_KEY = 'pkce_state';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

// Nunca se guarda el id_token. El refresh_token solo se reemplaza si la respuesta trae uno.
export const saveTokens = ({ access_token, refresh_token }) => {
  localStorage.setItem(ACCESS_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
};

export const clearSession = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const redirectUri = () => `${window.location.origin}/auth/callback`;

const base64url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const randomString = (size) => base64url(crypto.getRandomValues(new Uint8Array(size)));

export const codeChallengeFor = async (verifier) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
};

export const buildAuthorizeUrl = ({ state, codeChallenge }) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.COGNITO_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: 'openid email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `${env.COGNITO_DOMAIN}/oauth2/authorize?${params}`;
};

export const takePkce = () => {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const state = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return { verifier, state };
};

export const startLogin = async () => {
  if (!env.COGNITO_DOMAIN || !env.COGNITO_CLIENT_ID) throw new Error('cognito_not_configured');
  const verifier = randomString(32);
  const state = randomString(16);
  const codeChallenge = await codeChallengeFor(verifier);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  window.location.assign(buildAuthorizeUrl({ state, codeChallenge }));
};

export const logout = () => {
  clearSession();
  if (!env.COGNITO_DOMAIN) {
    window.location.assign('/');
    return;
  }
  const params = new URLSearchParams({
    client_id: env.COGNITO_CLIENT_ID,
    logout_uri: `${window.location.origin}/`,
  });
  window.location.assign(`${env.COGNITO_DOMAIN}/logout?${params}`);
};
