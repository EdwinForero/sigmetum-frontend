// Solo se pide una imagen si la URL es https (o http en localhost/127.0.0.1, para desarrollo): seguridad.md S7.
const isSafeImageUrl = (url) => {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol === 'https:') return true;
    return protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1');
  } catch {
    return false;
  }
};

export default isSafeImageUrl;
