import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('session', () => {
  let session;

  const load = async () => {
    vi.resetModules();
    session = await import('./session');
  };

  beforeEach(async () => {
    await load();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saveTokens guarda AccessToken y RefreshToken (PascalCase), nunca el IdToken', () => {
    session.saveTokens({ AccessToken: 'A', IdToken: 'I', RefreshToken: 'R' });

    expect(session.getAccessToken()).toBe('A');
    expect(session.getRefreshToken()).toBe('R');
    expect(Object.values({ ...localStorage })).not.toContain('I');
  });

  it('saveTokens sin RefreshToken conserva el que ya había', () => {
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    session.saveTokens({ AccessToken: 'B' });

    expect(session.getAccessToken()).toBe('B');
    expect(session.getRefreshToken()).toBe('R');
  });

  it('clearSession borra acceso y refresco', () => {
    session.saveTokens({ AccessToken: 'A', RefreshToken: 'R' });
    session.clearSession();

    expect(session.getAccessToken()).toBeNull();
    expect(session.getRefreshToken()).toBeNull();
  });
});
