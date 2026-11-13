# Aviso para PR: revisión del entorno de pruebas (frontend)

Fecha: 12/11/2026 (incluye la vuelta 2) · Spec: `2026-11-12-revision-entorno-pruebas-design.md` · Plan: `2026-11-12-revision-entorno-pruebas-plan.md` (el anexo de la puerta 2 manda)

Áreas de contrato tocadas: `src/components/LoginForm.js` (destino tras iniciar sesión: `/upload-files`) y `src/components/FileUpload.js` (B49, B52 y B53; sin cambio de contrato con la API; vuelta 2: los listeners de `window` solo hacen `preventDefault` si `dataTransfer.types` incluye `Files`). `src/services/api.js`, `src/config/env.js` y `src/config/assets.js` no cambian.

Integración: `docs/integracion/para-backend.md` (D1 resuelta: `GET /get-data` con `.xlsx` da 200 con token, 401 sin token, 422 si el archivo está corrupto y 503 si el backend no alcanza el JWKS de Cognito, con `Cache-Control: no-store` en la respuesta `.xlsx` autenticada; el backend se despliega primero) y `docs/integracion/para-infra.md` (rutas nuevas y redirecciones solo de cliente) actualizados en este commit.

## Qué cambia

1. **`FileDropdown` pide la versión con `api.getAuth`** (`/get-data/<clave>.xlsx`). El backend exige token solo en esa rama; el activo `.json` sigue público.
2. **Rutas de la SPA en inglés y kebab-case:** `/explore`, `/gallery`, `/about-us`, `/upload-files`, `/manage-data`, `/manage-terms`, `/manage-gallery`, `/manage-recipients`. `/`, `/login` y `/cookies` no cambian. `/administrar-contenido` deja de ser una página y se divide en tres.
3. **Redirecciones de las seis URL españolas antiguas** (`/explorar`, `/galeria`, `/sobre-nosotros`, `/cargar-archivos`, `/administrar-datos`, `/administrar-contenido`) con `<Navigate replace>`, solo en el cliente: no conservan `?` ni `#` y el destino sale de una tabla constante.
4. Animaciones de aparición (`Reveal`), cabecera dentro del ancho común, tres páginas de gestión, barra de gestión de seis entradas y deuda B64 a B68, B70, Y1, B49, B52 y B53 (ver `docs/09`).
5. **Vuelta 2 (12/11/2026):** la etiqueta de la barra de gestión pasa a «Correos» / «Emails» y bajo 360 px las etiquetas usan 11 px sin relleno horizontal (a 320 px «Términos» ya no se parte ni «Destinatarios» se sale); `FileUpload` no bloquea el arrastre de texto o enlaces; «Añadir» se describe con «Cargando la lista…» mientras carga el panel de correos; E2E nuevas `private-nav` y `redirects` (privadas antiguas sin sesión acaban en `/login`).

## Qué debe hacer el otro repositorio

- **Backend (`sigmetum-backend`): se despliega primero.** Cambio compatible: la ruta pasa de 500 a 200, 401, 422 o 503 (sin JWKS) con el mismo envoltorio; la respuesta `.xlsx` autenticada lleva `Cache-Control: no-store` (el frontend no depende de ello). Un frontend viejo contra el backend nuevo recibe 401 en vez de 500 (mismo aviso de error); un frontend nuevo contra un backend viejo sigue recibiendo 500. Sin cambios en el cliente de la API.
- **Infra (`sigmetum-infra`, solo lectura aquí):**
  - La regla de reescritura de la SPA es un catch-all (`modules/amplify/main.tf:87-92`, por confirmar en cada entorno; F16 de `docs/09` para preproducción): las rutas nuevas no necesitan cambios. El callback de Cognito (`/auth/callback`) y el cierre de sesión (`/`) no cambian.
  - Las redirecciones son de cliente: **no hay 301**. Si hay QR, favoritos externos o enlaces de buscadores a las URL españolas, siguen funcionando mientras la SPA se sirva, pero un 301 sería una regla de infra (por confirmar si existen).
  - Los documentos de infra que citan `/explorar` como ejemplo los actualiza el usuario cuando proceda.

## Por confirmar

- QR o enlaces externos a las rutas antiguas.
- La medición con sesión real del `.xlsx` (Jaén V1 y V2, Málaga con la clave codificada) tras desplegar el backend y este frontend.
- Versiones `.xlsx` de más de 10 MB anteriores a M6 (el backend no pone tope previo a la conversión).

## Desviación documentada

- **A4** (movimiento reducido): la comprobación se limita a `[data-reveal]` y al contenedor con `animate-page-fade`; el velo de la galería tiene `opacity-0` a propósito.
