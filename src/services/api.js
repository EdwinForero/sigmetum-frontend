import env from '../config/env';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${env.BASE_URL}${env.API_PREFIX}${path}`, options);
  } catch {
    const error = new Error('network_error');
    error.type = 'network';
    throw error;
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    const error = new Error(json.error || `http_${response.status}`);
    error.type = 'http';
    error.status = response.status;
    error.serverMessage = json.error;
    throw error;
  }

  return json.data;
}

const api = {
  get: (path) =>
    request(path),

  getAuth: (path) =>
    request(path, { headers: authHeader() }),

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
    }),

  postFormAuth: (path, formData) =>
    request(path, {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    }),

  deleteAuth: (path, body) =>
    request(path, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(body),
    }),
};

export default api;
