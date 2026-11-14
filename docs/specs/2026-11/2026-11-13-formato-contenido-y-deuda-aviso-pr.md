# Aviso para PR: formato del contenido y deuda (frontend)

Integración: sin impacto — el único archivo de un área de contrato que cambia es `src/components/ProtectedRoute.js`, y solo sustituye el color `#0C1811` por el token `ink` (mismo valor, sin cambio visual); no cambian la sesión, el token, las llamadas HTTP, las variables de entorno ni los recursos de S3.

## Qué cambia

- Sistema de contenido (`src/utilities/contentStyles.js`), `/cookies` con listas reales, Sobre nosotros en dos columnas, `isValidEmailAddress`, `normalizePath` (decodifica, minúsculas solo ASCII) y `Sidebar` con `Link` y `aria-current`. Detalle en `docs/09-estado-actual-y-deuda-tecnica.md`.

## Qué debe hacer el otro repositorio

- Backend e infraestructura: nada.
