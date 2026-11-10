const env = {
  BASE_URL: import.meta.env.VITE_BASE_URL || 'http://localhost:8000',
  API_PREFIX: import.meta.env.VITE_API_PREFIX || '/api/v1',
  COGNITO_DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN || '',
  COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  S3_URL: import.meta.env.VITE_S3_URL || '',
  CAROUSEL_IMAGE_KEYS: (import.meta.env.VITE_CAROUSEL_IMAGE_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
};

export default env;
