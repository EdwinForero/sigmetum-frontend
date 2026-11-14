import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGACY_REDIRECTS, normalizePath } from '../config/routes';

const NOT_FOUND_KEY = 'notFound.title';

// Ruta -> clave de traducción del título de página (WCAG 2.4.2). Cualquier otra ruta es el 404.
export const PAGE_TITLE_KEYS = {
  '/': 'navbar.homeOption',
  '/explore': 'navbar.exploreOption',
  '/about-us': 'aboutUs.title',
  '/login': 'login.title',
  '/gallery': 'gallery.title',
  '/cookies': 'cookies.title',
  '/upload-files': 'uploadFiles.title',
  '/manage-data': 'dataManagement.title',
  '/manage-terms': 'contentManagement.noLatinTermsTitle',
  '/manage-gallery': 'contentManagement.galleryManagementTitle',
  '/manage-recipients': 'contactRecipients.title',
};

// Una ruta antigua se resuelve a su destino: durante la redirección no se ve el título del 404.
const resolveLegacy = (pathname) => {
  const from = Object.keys(LEGACY_REDIRECTS).find((pattern) => matchPath({ path: pattern, end: true }, pathname));
  return from ? LEGACY_REDIRECTS[from] : pathname;
};

export const titleKeyFor = (pathname) => {
  const target = resolveLegacy(normalizePath(pathname));
  const route = Object.keys(PAGE_TITLE_KEYS).find((pattern) => matchPath({ path: pattern, end: true }, target));
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
