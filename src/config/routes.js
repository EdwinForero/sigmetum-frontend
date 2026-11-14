// Rutas de la SPA en inglés (kebab-case). /, /login y /cookies no cambian.
export const PRIVATE_PATHS = [
  '/upload-files',
  '/manage-data',
  '/manage-terms',
  '/manage-gallery',
  '/manage-recipients',
];

// Como decodePath de React Router: cada segmento se decodifica y una «/» decodificada vuelve a «%2F».
// Si la URL está mal formada (p. ej. «%E0%A4%A») se deja la original: no lanza.
const decodePath = (pathname) => {
  try {
    return pathname
      .split('/')
      .map((segment) => decodeURIComponent(segment).replace(/\//g, '%2F'))
      .join('/');
  } catch {
    return pathname;
  }
};

// React Router no distingue mayúsculas, acepta la barra final y decodifica el «%» de la ruta: se normaliza igual
// para comparar rutas (App, Sidebar y título). Solo se compara; no se redirige ni se pasa el dato del usuario a
// ningún enlace (S6).
// Minúsculas solo ASCII, como la bandera i sin u de React Router: toLowerCase() convertiría el signo Kelvin
// (U+212A) en «k» y la ruta no coincidiría con la de React Router. La barra final se recorta con un bucle (lineal).
const lowerAscii = (text) => text.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
const trimTrailingSlashes = (text) => {
  let end = text.length;
  while (end > 0 && text[end - 1] === '/') end -= 1;
  return text.slice(0, end);
};
export const normalizePath = (pathname) => lowerAscii(trimTrailingSlashes(decodePath(pathname))) || '/';

// URL antigua -> ruta actual. Solo de cliente (sin 301). El destino sale siempre de esta tabla constante (S4).
export const LEGACY_REDIRECTS = {
  '/explorar': '/explore',
  '/galeria': '/gallery',
  '/sobre-nosotros': '/about-us',
  '/cargar-archivos': '/upload-files',
  '/administrar-datos': '/manage-data',
  '/administrar-contenido': '/manage-terms',
};
