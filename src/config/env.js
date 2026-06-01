const env = {
  BASE_URL: process.env.REACT_APP_BASE_URL || 'http://localhost:8000',
  S3_URL: process.env.REACT_APP_S3_URL || '',
  CAROUSEL_IMAGE_KEYS: (process.env.REACT_APP_CAROUSEL_IMAGE_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
};

export default env;
