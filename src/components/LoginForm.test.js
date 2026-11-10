import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { webcrypto } from 'node:crypto';

describe('LoginForm', () => {
  let LoginForm;
  let assign;

  const load = async () => {
    vi.resetModules();
    LoginForm = (await import('./LoginForm')).default;
  };

  beforeEach(async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', 'https://auth.example.test');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client123');
    if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
    assign = vi.fn();
    vi.stubGlobal('location', { assign, origin: 'https://app.example.test' });
    await load();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('muestra el título y un botón accesible, sin campos de texto', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'login.title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logInButton' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('al pulsar el botón redirige al Hosted UI con PKCE S256', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    await vi.waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sin configuración de Cognito no redirige y muestra el error en un alert', async () => {
    vi.stubEnv('VITE_COGNITO_DOMAIN', '');
    await load();
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.startError');
    expect(assign).not.toHaveBeenCalled();
  });

  it('no deja una promesa sin capturar si falla el inicio (sin crypto.subtle)', async () => {
    vi.stubGlobal('crypto', { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.startError');
    expect(assign).not.toHaveBeenCalled();
  });
});
