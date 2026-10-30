import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginForm from './LoginForm';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: { post: vi.fn() } }));

const httpError = (status) => Object.assign(new Error(`http_${status}`), { type: 'http', status });

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/cargar-archivos" element={<p>pagina-carga</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('LoginForm', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('con 429 muestra el mensaje de demasiados intentos', async () => {
    api.post.mockRejectedValue(httpError(429));
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByText('login.logInButton'));

    expect(await screen.findByText('login.tooManyAttemptsLabel')).toBeInTheDocument();
    expect(screen.queryByText('login.unauthorizedLabel')).not.toBeInTheDocument();
  });

  it('con 401 muestra el mensaje de credenciales', async () => {
    api.post.mockRejectedValue(httpError(401));
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByText('login.logInButton'));

    expect(await screen.findByText('login.unauthorizedLabel')).toBeInTheDocument();
    expect(screen.queryByText('login.tooManyAttemptsLabel')).not.toBeInTheDocument();
  });

  it('con 401 anuncia el error como alerta', async () => {
    api.post.mockRejectedValue(httpError(401));
    const user = userEvent.setup();
    renderLogin();

    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(screen.getByText('login.logInButton'));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.unauthorizedLabel');
  });

  it('con 429 anuncia el error como alerta', async () => {
    api.post.mockRejectedValue(httpError(429));
    const user = userEvent.setup();
    renderLogin();

    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(screen.getByText('login.logInButton'));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.tooManyAttemptsLabel');
  });

  it('con éxito guarda el token y navega a /cargar-archivos', async () => {
    api.post.mockResolvedValue({ token: 'jwt-123' });
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByText('login.logInButton'));

    expect(await screen.findByText('pagina-carga')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('jwt-123');
  });
});
