import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from './api';

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });
const nonJsonResponse = (status) => ({
  ok: status < 400,
  status,
  json: async () => {
    throw new SyntaxError('Unexpected token <');
  },
});

describe('api ante un 401', () => {
  let fetchMock;
  let assign;

  beforeEach(() => {
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign });
    localStorage.setItem('token', 'abc');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it.each([
    ['getAuth', () => api.getAuth('/auth')],
    ['postAuth', () => api.postAuth('/x', {})],
    ['postFormAuth', () => api.postFormAuth('/x', new FormData())],
    ['deleteAuth', () => api.deleteAuth('/x', {})],
  ])('%s borra el token, redirige a /login y lanza el error', async (_name, call) => {
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Unauthorized' }));

    await expect(call()).rejects.toMatchObject({ status: 401, type: 'http' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('con un 401 de cuerpo no JSON también borra el token y redirige', async () => {
    fetchMock.mockResolvedValue(nonJsonResponse(401));

    await expect(api.getAuth('/auth')).rejects.toMatchObject({ status: 401, type: 'http' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('api.post (login) con 401 no borra el token ni redirige y lanza status 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Invalid' }));

    await expect(api.post('/log', {})).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('token')).toBe('abc');
    expect(assign).not.toHaveBeenCalled();
  });

  it('api.get con 401 no borra el token ni redirige', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { success: false, error: 'Invalid' }));

    await expect(api.get('/x')).rejects.toMatchObject({ status: 401 });

    expect(localStorage.getItem('token')).toBe('abc');
    expect(assign).not.toHaveBeenCalled();
  });

  it('getAuth con 200 devuelve los datos sin redirigir', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: 'ok' }));

    await expect(api.getAuth('/auth')).resolves.toBe('ok');

    expect(localStorage.getItem('token')).toBe('abc');
    expect(assign).not.toHaveBeenCalled();
  });
});
