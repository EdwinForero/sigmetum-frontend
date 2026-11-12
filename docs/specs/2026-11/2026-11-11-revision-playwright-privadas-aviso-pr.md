# Aviso para PR: revisión Playwright de las páginas privadas (11/11/2026)

Spec: `docs/specs/2026-11/2026-11-11-revision-playwright-privadas-design.md`
Plan: `docs/specs/2026-11/2026-11-11-revision-playwright-privadas-plan.md`

## Qué cambia

- `src/components/ProtectedRoute.js` (área de contrato, sesión y token): prop opcional `onStatusChange(status)`; en el primer `checking` ya no pinta `LoadSpinner` sino nada; tras «Reintentar» pinta una región `status` oculta con `login.loading` (mismo nodo que en `unavailable`) y lleva antes el foco a `main#contenido`. **No cambia** `GET /auth`, el token, la renovación ni `api.js` (`git diff --stat src/services/api.js` vacío).
- `src/App.js`: cada `ProtectedRoute` lleva `key` propia, así que **cambiar de una ruta privada a otra vuelve a llamar a `GET /auth`** (antes React Router reutilizaba la instancia y no revalidaba). Misma petición, más veces; sin cambio de contrato. La barra de gestión solo aparece con la sesión confirmada (`privateSessionOk`) y se conserva entre páginas privadas durante la revalidación (decisión del usuario).
- `src/components/FileUpload.js` (área de contrato, subida): zona de arrastre y filtro `.xlsx` (sin distinguir mayúsculas) también en el botón «Seleccionar archivos»; lo descartado muestra `dropRejected`. El filtro es solo de cliente y por nombre: **el servidor sigue validando**. `POST /upload` y `POST /upload/confirm` no cambian (peticiones, cabeceras ni cuerpos).
- Resto: panel de filtros de `/administrar-datos` eliminado (`dataManagementFilter`), barra lateral `sticky` desde `md`, contenedor común `max-w-6xl px-4 sm:px-5` en las tres privadas, `InfoButton` con `topic` y tooltip dentro del viewport, miniaturas en la galería (URL prefirmada de `GET /list-images`, ya existente), selector de versiones con vacío explicado y contraste, `About us` en una línea, y fuentes: `preconnect`, sin Mukta Malar, Material Symbols por subconjunto (`icon_names`, 21 iconos, `display=block`) y `watchIconFont` (`icons-ready` / `icons-failed`).

Integración: actualizada — para-backend §4 (diagnóstico del 401 en `/auth` y del 400 de `cognito-idp`, comportamiento esperado sin acción, y `/auth` al cambiar de ruta privada) y para-infra §6 (fuentes: subconjunto, `preconnect`, sin `script-src` en línea).

## Qué debe hacer el otro repositorio

- **`sigmetum-backend`:** nada. `/auth`, `/upload`, `/upload/confirm` y `/list-images` son los mismos; `/auth` recibirá algo más de tráfico (una llamada por cambio de ruta privada). El `401` de la primera petición con token caducado es el diseño esperado.
- **`sigmetum-infra`:** nada obligatorio. Solo si, al confirmar en `dev`, el `__type` del `400` de la renovación `REFRESH_TOKEN_AUTH` resultara ser de configuración del cliente del pool, habría que añadirlo a `para-infra.md`. La CSP (Report-Only) ya incluye googleapis y gstatic.
- **Vuelta atrás:** revertir el commit; no hay migraciones ni variables nuevas.

## Pendiente

- **`/security-review` por la subida** (`FileUpload.js`: filtro `.xlsx` solo de cliente y por nombre; el servidor sigue validando) y por `ProtectedRoute.js`: lo ejecuta el orquestador; **aún no se ha ejecutado**.
- **Mediciones con Playwright hechas (11/11 y 12/11/2026, EN LOCAL con la API y la sesión SIMULADAS; no con backend real ni credenciales reales):** barra lateral `sticky` a 1440 y 768 px y pie sin franja blanca; barra inferior `fixed` a 390 px; sin botón «Filters» en `/administrar-datos`; `About us` en una línea a 1440 y 768 px (en inglés); `x` del `<h1>` igual en las tres privadas (212, 132 y 16 px) y sin scroll horizontal; panel de filtros con `scrollHeight` igual a `clientHeight` (900 y 844 px), `aria-labelledby` y bloqueo del `body`; botones «i» con nombres distintos, 44×44 y tooltip dentro del viewport a 1440, 768 y 390 px; selector deshabilitado con `opacity` 1; con Google Fonts cortado, `icons-failed` y caja de 16×16 px (cosmético, B58); zona de arrastre con eventos simulados. Las cifras están en `docs/09`, fila de la vuelta 1.
- **Sigue por confirmar (no medido):** todo con backend real y datos (tabla, miniaturas con URLs prefirmadas, `401` y `400` reales, `__type` de Cognito), español, 1024 px, hueco bajo la barra con una página larga tras desplazar, lector de pantalla y barras de scroll clásicas.
- A mano: lector de pantalla (anuncio de «Reintentar»), foco en `body` si una revalidación entre páginas privadas acaba en `unavailable` (B47) y el `__type` real del `400` en `dev`.

## Cambios de la vuelta 1 (para el revisor)

- `FileUpload.js`: un `drop` sin archivos no borra el error ni el anuncio; el `font-bold` del arrastre solo en el texto de la pista. Sin cambio de peticiones.
- `ImageGalleryManager.js`: `isSafeImageUrl` (solo `https:`, o `http:` en `localhost`/`127.0.0.1`) antes de pedir la miniatura (seguridad.md S7).
- `iconFont.js`: límite de 4 s; `icons-ready` se impone a `icons-failed` si la fuente llega tarde.
- Proceso: en `iconFont.js` el código se escribió antes del test (sin rojo registrado).
