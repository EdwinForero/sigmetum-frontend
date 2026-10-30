import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  it('asocia cada etiqueta con su campo y conserva el mismo campo al mostrar la contraseña', async () => {
    const user = userEvent.setup();
    renderLogin();

    const usuario = screen.getByLabelText('login.userLable');
    expect(usuario).toHaveAttribute('type', 'text');
    const clave = screen.getByLabelText('login.passwordLable');
    expect(clave).toHaveAttribute('type', 'password');
    const idClave = clave.id;

    await user.click(screen.getByText('login.passwordShowButton'));

    const claveVisible = screen.getByLabelText('login.passwordLable');
    expect(claveVisible).toBe(clave);
    expect(claveVisible.id).toBe(idClave);
    expect(claveVisible).toHaveAttribute('type', 'text');
  });

  it('envía con Enter desde el campo de usuario, una sola vez', async () => {
    api.post.mockResolvedValue({ token: 'jwt-123' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('login.userLable'), 'ana{Enter}');

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/log', { username: 'ana', password: '' });
  });

  it('envía con Enter desde el campo de contraseña, una sola vez', async () => {
    api.post.mockResolvedValue({ token: 'jwt-123' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('login.passwordLable'), 'secreto{Enter}');

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/log', { username: '', password: 'secreto' });
  });

  it('el botón por rol es de envío dentro del formulario y envía una sola vez', async () => {
    api.post.mockResolvedValue({ token: 'jwt-123' });
    const user = userEvent.setup();
    renderLogin();

    const boton = screen.getByRole('button', { name: 'login.logInButton' });
    expect(boton.closest('form')).not.toBeNull();
    expect(boton).toHaveProperty('type', 'submit');

    await user.click(boton);

    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('pulsar el texto interior del botón envía una sola vez', async () => {
    api.post.mockResolvedValue({ token: 'jwt-123' });
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByText('login.logInButton'));

    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('el envío del formulario cancela la acción por defecto', async () => {
    api.post.mockRejectedValue(httpError(401));
    const { container } = renderLogin();

    const notPrevented = fireEvent.submit(container.querySelector('form'));
    expect(notPrevented).toBe(false);

    await screen.findByRole('alert');
  });

  it('dos instancias tienen ids distintos en sus cuatro campos', () => {
    render(
      <MemoryRouter>
        <LoginForm />
        <LoginForm />
      </MemoryRouter>
    );

    const ids = [
      ...screen.getAllByLabelText('login.userLable'),
      ...screen.getAllByLabelText('login.passwordLable'),
    ].map((el) => el.id);
    expect(ids).toHaveLength(4);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(4);
  });
});
