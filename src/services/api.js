import env from '../config/env';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function request(path, options = {}, { authenticated = false } = {}) {
  let response;
  try {
    response = await fetch(`${env.BASE_URL}${env.API_PREFIX}${path}`, options);
  } catch {
    const error = new Error('network_error');
    error.type = 'network';
    throw error;
  }

  if (authenticated && response.status === 401) {
    localStorage.removeItem('token');
    window.location.assign('/login');
    const json = await response.json().catch(() => ({}));
    const error = new Error(json.error || 'http_401');
    error.type = 'http';
    error.status = 401;
    error.serverMessage = json.error;
    throw error;
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    const error = new Error(json.error || `http_${response.status}`);
    error.type = 'http';
    error.status = response.status;
    error.serverMessage = json.error;
    if (json.data !== undefined) error.data = json.data;
    throw error;
  }

  return json.data;
}

const api = {
  get: (path) =>
    request(path),

  getAuth: (path) =>
    request(path, { headers: authHeader() }, { authenticated: true }),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  postAuth: (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(body),
    }, { authenticated: true }),

  postFormAuth: (path, formData) =>
    request(path, {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    }, { authenticated: true }),

  deleteAuth: (path, body) =>
    request(path, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(body),
    }, { authenticated: true }),
};

export default api;
