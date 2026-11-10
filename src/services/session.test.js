import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';

const DOMAIN = 'https://auth.example.test';
const CLIENT = 'client123';
const ORIGIN = 'https://app.example.test';

describe('session', () => {
  let session;
  let assign;

  const load = async () => {
    vi.resetModules();
    session = await import('./session');
  };

  beforeEach(async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', DOMAIN);
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', CLIENT);
    if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
    assign = vi.fn();
    vi.stubGlobal('location', { assign, origin: ORIGIN });
    await load();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('codeChallengeFor cumple el vector del RFC 7636', async () => {
    await expect(session.codeChallengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).resolves.toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    );
  });

  it('redirectUri es el origen más /auth/callback', () => {
    expect(session.redirectUri()).toBe(`${ORIGIN}/auth/callback`);
  });

  it('buildAuthorizeUrl lleva los parámetros del contrato y no el verificador', () => {
    const url = new URL(session.buildAuthorizeUrl({ state: 'st', codeChallenge: 'cc' }));

    expect(`${url.origin}${url.pathname}`).toBe(`${DOMAIN}/oauth2/authorize`);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(CLIENT);
    expect(url.searchParams.get('redirect_uri')).toBe(`${ORIGIN}/auth/callback`);
    expect(url.searchParams.get('scope')).toBe('openid email');
    expect(url.searchParams.get('state')).toBe('st');
    expect(url.searchParams.get('code_challenge')).toBe('cc');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.has('code_verifier')).toBe(false);
  });

  it('startLogin guarda verificador y state en sessionStorage y redirige con su challenge', async () => {
    await session.startLogin();

    const verifier = sessionStorage.getItem('pkce_verifier');
    const state = sessionStorage.getItem('pkce_state');
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.searchParams.get('state')).toBe(state);
    expect(url.searchParams.get('code_challenge')).toBe(await session.codeChallengeFor(verifier));
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.search).not.toContain(verifier);
  });

  it('dos startLogin producen verificadores distintos', async () => {
    await session.startLogin();
    const first = sessionStorage.getItem('pkce_verifier');
    await session.startLogin();

    expect(sessionStorage.getItem('pkce_verifier')).not.toBe(first);
  });

  it('startLogin sin dominio o sin cliente no redirige y lanza un error', async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', '');
    await load();

    await expect(session.startLogin()).rejects.toThrow();
    expect(assign).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);

    vi.stubEnv('VITE_COGNITO_DOMAIN', DOMAIN);
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '');
    await load();

    await expect(session.startLogin()).rejects.toThrow();
    expect(assign).not.toHaveBeenCalled();
  });

  it('takePkce devuelve verificador y state y vacía sessionStorage', async () => {
    await session.startLogin();
    const verifier = sessionStorage.getItem('pkce_verifier');
    const state = sessionStorage.getItem('pkce_state');

    expect(session.takePkce()).toEqual({ verifier, state });
    expect(sessionStorage.getItem('pkce_verifier')).toBeNull();
    expect(sessionStorage.getItem('pkce_state')).toBeNull();
  });

  it('saveTokens guarda acceso y refresco, nunca el id_token', () => {
    session.saveTokens({ access_token: 'A', id_token: 'I', refresh_token: 'R' });

    expect(session.getAccessToken()).toBe('A');
    expect(session.getRefreshToken()).toBe('R');
    expect(Object.values({ ...localStorage })).not.toContain('I');
  });

  it('saveTokens sin refresh_token conserva el que ya había', () => {
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    session.saveTokens({ access_token: 'B' });

    expect(session.getAccessToken()).toBe('B');
    expect(session.getRefreshToken()).toBe('R');
  });

  it('clearSession borra acceso y refresco', () => {
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    session.clearSession();

    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
  });

  it('logout borra los tokens y redirige a la URL de logout', () => {
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });
    session.logout();

    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
    const url = new URL(assign.mock.calls[0][0]);
    expect(`${url.origin}${url.pathname}`).toBe(`${DOMAIN}/logout`);
    expect(url.searchParams.get('client_id')).toBe(CLIENT);
    expect(url.searchParams.get('logout_uri')).toBe(`${ORIGIN}/`);
  });

  it('logout sin dominio borra los tokens y va a /', async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', '');
    await load();
    session.saveTokens({ access_token: 'A', refresh_token: 'R' });

    session.logout();

    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/');
    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
  });
});
