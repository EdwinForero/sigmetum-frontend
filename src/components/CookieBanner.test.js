import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieBanner from './CookieBanner';

let writes;
let cookieJar;

const setProtocol = (protocol) => vi.stubGlobal('location', { protocol });

const expectAttributes = (cookie, { secure }) => {
  expect(cookie).toContain('path=/');
  expect(cookie).toContain('max-age=31536000');
  expect(cookie).toContain('SameSite=Lax');
  if (secure) {
    expect(cookie).toContain('Secure');
  } else {
    expect(cookie).not.toContain('Secure');
  }
};

const expectTwoCookies = ({ secure }) => {
  expect(writes).toHaveLength(2);
  expect(writes.some((c) => c.startsWith('cookieConsent=accepted'))).toBe(true);
  expect(writes.some((c) => c.startsWith('cookiePreferences='))).toBe(true);
  writes.forEach((c) => expectAttributes(c, { secure }));
};

describe('CookieBanner', () => {
  beforeEach(() => {
    writes = [];
    cookieJar = '';
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieJar,
      set: (v) => {
        writes.push(v);
      },
    });
  });

  afterEach(() => {
    delete document.cookie;
    vi.unstubAllGlobals();
  });

  it('aceptar todo en https escribe las cookies con SameSite=Lax y Secure', async () => {
    setProtocol('https:');
    const user = userEvent.setup();
    render(<CookieBanner />);

    await user.click(screen.getByText('cookies.banner.acceptAllButton'));

    expectTwoCookies({ secure: true });
  });

  it('aceptar todo en http escribe SameSite=Lax sin Secure', async () => {
    setProtocol('http:');
    const user = userEvent.setup();
    render(<CookieBanner />);

    await user.click(screen.getByText('cookies.banner.acceptAllButton'));

    expectTwoCookies({ secure: false });
  });

  it('aplicar desde el modal en https escribe SameSite=Lax y Secure, con todo en false', async () => {
    setProtocol('https:');
    const user = userEvent.setup();
    render(<CookieBanner />);

    await user.click(screen.getByText('cookies.banner.cookiesConfigurationButton'));
    await user.click(screen.getByText('cookies.modal.applyButton'));

    expectTwoCookies({ secure: true });
    const prefs = writes.find((c) => c.startsWith('cookiePreferences='));
    expect(prefs).toContain(
      `cookiePreferences=${JSON.stringify({
        all: false,
        advertising: false,
        advertisingTracking: false,
        functionality: false,
        personalization: false,
        security: false,
      })}`
    );
  });

  it('aplicar desde el modal en http escribe SameSite=Lax sin Secure', async () => {
    setProtocol('http:');
    const user = userEvent.setup();
    render(<CookieBanner />);

    await user.click(screen.getByText('cookies.banner.cookiesConfigurationButton'));
    await user.click(screen.getByText('cookies.modal.applyButton'));

    expectTwoCookies({ secure: false });
  });

  it('guarda cookiePreferences como JSON sin codificar', async () => {
    setProtocol('https:');
    const user = userEvent.setup();
    render(<CookieBanner />);

    await user.click(screen.getByText('cookies.banner.acceptAllButton'));

    const prefs = writes.find((c) => c.startsWith('cookiePreferences='));
    expect(prefs).toContain(
      `cookiePreferences=${JSON.stringify({
        all: true,
        advertising: true,
        advertisingTracking: true,
        functionality: true,
        personalization: true,
        security: true,
      })}`
    );
  });

  it('no muestra el banner ni escribe cookies si ya se aceptó', () => {
    cookieJar = 'cookieConsent=accepted';
    setProtocol('https:');
    render(<CookieBanner />);

    expect(screen.queryByText('cookies.banner.acceptAllButton')).toBeNull();
    expect(writes).toHaveLength(0);
  });
});
