import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CookieBanner from './CookieBanner';

// El simulacro global de Trans no pinta los componentes: este lo hace para poder ver el enlace «aquí» del banner.
vi.mock('react-i18next', async () => {
  const { cloneElement } = await import('react');
  return {
    useTranslation: () => ({ t: (key) => key, i18n: { language: 'es', changeLanguage: vi.fn() } }),
    Trans: ({ i18nKey, components }) => (components?.a ? cloneElement(components.a, {}, i18nKey) : i18nKey),
    initReactI18next: { type: '3rdParty', init: () => {} },
  };
});

let writes;
let cookieJar;

// El enlace «aquí» es un Link: necesita un Router. El banner va fuera de Routes, como en App, y /cookies pinta una marca.
const renderBanner = (props = {}) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<p>pagina-inicio</p>} />
        <Route path="/cookies" element={<p>pagina-cookies</p>} />
      </Routes>
      <CookieBanner {...props} />
    </MemoryRouter>
  );

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
    renderBanner();

    await user.click(screen.getByText('cookies.banner.acceptAllButton'));

    expectTwoCookies({ secure: true });
  });

  it('aceptar todo en http escribe SameSite=Lax sin Secure', async () => {
    setProtocol('http:');
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByText('cookies.banner.acceptAllButton'));

    expectTwoCookies({ secure: false });
  });

  it('aplicar desde el modal en https escribe SameSite=Lax y Secure, con todo en false', async () => {
    setProtocol('https:');
    const user = userEvent.setup();
    renderBanner();

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
    renderBanner();

    await user.click(screen.getByText('cookies.banner.cookiesConfigurationButton'));
    await user.click(screen.getByText('cookies.modal.applyButton'));

    expectTwoCookies({ secure: false });
  });

  it('guarda cookiePreferences como JSON sin codificar', async () => {
    setProtocol('https:');
    const user = userEvent.setup();
    renderBanner();

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
    renderBanner();

    expect(screen.queryByText('cookies.banner.acceptAllButton')).toBeNull();
    expect(writes).toHaveLength(0);
  });

  it('con aboveBottomBar el banner es sticky sobre la barra y sin fixed', () => {
    setProtocol('https:');
    renderBanner({ aboveBottomBar: true });

    const banner = screen.getByRole('region', { name: 'cookies.banner.title' });
    expect(banner).toHaveClass('sticky', 'bottom-nav', 'md:bottom-0', 'z-40');
    expect(banner).not.toHaveClass('fixed');
  });

  it('en móvil el banner es compacto: padding y tipografía menores, botones en una fila y enlace a /cookies', () => {
    setProtocol('https:');
    renderBanner({ aboveBottomBar: true });

    const banner = screen.getByRole('region', { name: 'cookies.banner.title' });
    expect(banner).toHaveClass('p-3', 'sm:p-4');
    const botones = screen.getByRole('button', { name: 'cookies.banner.acceptAllButton' }).parentElement;
    expect(botones).toHaveClass('flex', 'gap-2');
    expect(botones).not.toHaveClass('flex-col');
    expect(banner.querySelector('p')).toHaveClass('text-xs', 'sm:text-sm');
    expect(screen.getByRole('button', { name: 'cookies.banner.acceptAllButton' })).toHaveClass('!px-3', '!text-sm');
  });

  it('el enlace a /cookies del banner mide 24×24 como mínimo (WCAG 2.5.8), con foco visible y subrayado', () => {
    setProtocol('https:');
    renderBanner({ aboveBottomBar: true });

    const enlace = screen.getByRole('link', { name: 'cookies.banner.description' });
    expect(enlace).toHaveAttribute('href', '/cookies');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    expect(enlace).toHaveClass('focus-ring', 'inline-flex', 'min-h-6', 'min-w-6', 'items-center', 'justify-center', 'rounded', 'underline');
  });

  it('pulsar «aquí» navega en cliente a /cookies (sin recargar) y el banner sigue montado', () => {
    setProtocol('https:');
    renderBanner();
    expect(screen.getByText('pagina-inicio')).toBeInTheDocument();

    const enlace = screen.getByRole('link', { name: 'cookies.banner.description' });
    // Un <a href> recargaría la página: el Link cancela la navegación del navegador (preventDefault).
    expect(fireEvent.click(enlace)).toBe(false);

    expect(screen.getByText('pagina-cookies')).toBeInTheDocument();
    expect(screen.queryByText('pagina-inicio')).toBeNull();
    expect(screen.getByRole('region', { name: 'cookies.banner.title' })).toBeInTheDocument();
  });

  it('el banner es una barra compacta sobre surface con borde moss, sin gris ni hexadecimales', () => {
    setProtocol('https:');
    renderBanner();

    const banner = screen.getByRole('region', { name: 'cookies.banner.title' });
    expect(banner).toHaveClass('border-t', 'border-moss', 'bg-surface', 'text-ink');
    expect(banner.className).not.toMatch(/gray|black|#/);
  });

  it('el título es un h2 con el icono info oculto a lectores en su fila', () => {
    setProtocol('https:');
    renderBanner();

    const titulo = screen.getByRole('heading', { level: 2, name: 'cookies.banner.title' });
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    const icono = titulo.parentElement.querySelector('[aria-hidden="true"]');
    expect(icono).toHaveClass('material-symbols-outlined', 'text-moss');
    expect(icono).toHaveTextContent('info');
  });

  it('el modal usa los tokens ink, surface y sage, sin bg-black ni hexadecimales', async () => {
    setProtocol('https:');
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByText('cookies.banner.cookiesConfigurationButton'));

    const caja = screen.getByText('cookies.modal.title').parentElement;
    const fondo = caja.parentElement;
    expect(fondo).toHaveClass('bg-ink/70');
    expect(caja).toHaveClass('bg-surface');
    expect(screen.getByText('cookies.modal.description')).toHaveClass('text-ink');
    expect(screen.getByText('cookies.modal.categories.security').parentElement).toHaveClass('border-sage');
    expect(fondo.outerHTML).not.toMatch(/#|bg-black|bg-gray|bg-opacity/);
  });

  it('sin aboveBottomBar el banner usa bottom-0', () => {
    setProtocol('https:');
    renderBanner();

    const banner = screen.getByRole('region', { name: 'cookies.banner.title' });
    expect(banner).toHaveClass('sticky', 'bottom-0');
    expect(banner).not.toHaveClass('bottom-nav');
    expect(banner).not.toHaveClass('fixed');
  });

  it('el modal de configuración queda fuera de la sección sticky del banner', async () => {
    setProtocol('https:');
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByText('cookies.banner.cookiesConfigurationButton'));

    const banner = screen.getByRole('region', { name: 'cookies.banner.title' });
    expect(banner.contains(screen.getByText('cookies.modal.title'))).toBe(false);
  });
});
