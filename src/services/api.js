import env from '../config/env';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${env.BASE_URL}${path}`, options);
  } catch {
    const error = new Error('network_error');
    error.type = 'network';
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`http_${response.status}`);
    error.type = 'http';
    error.status = response.status;
    throw error;
  }
  return response.json();
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
