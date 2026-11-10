// Único módulo que toca el almacenamiento del navegador para la sesión:
// localStorage (token de acceso y de refresco).
const ACCESS_KEY = 'token';
const REFRESH_KEY = 'refreshToken';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

// Nunca se guarda el IdToken. El RefreshToken solo se reemplaza si la respuesta trae uno.
export const saveTokens = ({ AccessToken, RefreshToken }) => {
  localStorage.setItem(ACCESS_KEY, AccessToken);
  if (RefreshToken) localStorage.setItem(REFRESH_KEY, RefreshToken);
};

export const clearSession = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};
