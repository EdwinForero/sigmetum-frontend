// Rutas de la SPA en inglés (kebab-case). /, /login y /cookies no cambian.
export const PRIVATE_PATHS = [
  '/upload-files',
  '/manage-data',
  '/manage-terms',
  '/manage-gallery',
  '/manage-recipients',
];

// URL antigua -> ruta actual. Solo de cliente (sin 301). El destino sale siempre de esta tabla constante (S4).
export const LEGACY_REDIRECTS = {
  '/explorar': '/explore',
  '/galeria': '/gallery',
  '/sobre-nosotros': '/about-us',
  '/cargar-archivos': '/upload-files',
  '/administrar-datos': '/manage-data',
  '/administrar-contenido': '/manage-terms',
};
