import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NOT_FOUND_KEY = 'notFound.title';

// Ruta -> clave de traducción del título de página (WCAG 2.4.2). Cualquier otra ruta es el 404.
export const PAGE_TITLE_KEYS = {
  '/': 'navbar.homeOption',
  '/explorar': 'navbar.exploreOption',
  '/sobre-nosotros': 'aboutUs.title',
  '/login': 'login.title',
  '/galeria': 'gallery.title',
  '/cookies': 'cookies.title',
  '/cargar-archivos': 'uploadFiles.title',
  '/administrar-contenido': 'contentManagement.title',
  '/administrar-datos': 'dataManagement.title',
};

export const titleKeyFor = (pathname) => {
  const route = Object.keys(PAGE_TITLE_KEYS).find((pattern) => matchPath({ path: pattern, end: true }, pathname));
  return route ? PAGE_TITLE_KEYS[route] : NOT_FOUND_KEY;
};

// El título sigue a la ruta mostrada y al idioma activo. "SIGMETUM-A" es el nombre del proyecto: no se traduce.
export default function useDocumentTitle() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const key = titleKeyFor(pathname);

  useEffect(() => {
    document.title = `${t(key)} · SIGMETUM-A`;
  }, [t, key]);
}
