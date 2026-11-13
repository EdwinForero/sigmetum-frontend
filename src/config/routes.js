// Rutas de la SPA en inglés (kebab-case). /, /login y /cookies no cambian.
export const PRIVATE_PATHS = [
  '/upload-files',
  '/manage-data',
  '/manage-terms',
  '/manage-gallery',
  '/manage-recipients',
];

// React Router no distingue mayúsculas y acepta la barra final: se normaliza para comparar rutas (App y Sidebar).
// Solo se compara; no se redirige ni se pasa el dato del usuario a ningún enlace (S6).
export const normalizePath = (pathname) => pathname.replace(/\/+$/, '').toLowerCase() || '/';

// URL antigua -> ruta actual. Solo de cliente (sin 301). El destino sale siempre de esta tabla constante (S4).
export const LEGACY_REDIRECTS = {
  '/explorar': '/explore',
  '/galeria': '/gallery',
  '/sobre-nosotros': '/about-us',
  '/cargar-archivos': '/upload-files',
  '/administrar-datos': '/manage-data',
  '/administrar-contenido': '/manage-terms',
};
