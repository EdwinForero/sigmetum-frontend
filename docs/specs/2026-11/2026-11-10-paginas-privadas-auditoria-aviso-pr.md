# Aviso para PR: páginas privadas y cromo compartido (auditoría del 10/11/2026)

Spec: `docs/specs/2026-11/2026-11-10-paginas-privadas-auditoria-design.md`
Plan: `docs/specs/2026-11/2026-11-10-paginas-privadas-auditoria-plan.md`

## Qué cambia

- `src/components/FileUpload.js` (área de contrato): estado por archivo (el botón de subir solo aparece con archivos pendientes) y progreso «n de N» (`role="progressbar"`), errores en línea y avisos con `ToastProvider`; el componente ya no recibe `onLoad`. **Cambio de comportamiento deliberado:** tras un `500` al confirmar o un fallo de red, la lista conserva el estado de error en lugar de vaciarse, y al reintentar solo se suben los archivos que no están en «Subido». Las peticiones (`/upload`, `/upload/confirm`), las cabeceras y los cuerpos no cambian.
- `src/components/LoginForm.js` (área de contrato): solo el marcado y los estilos del aviso de error (icono, color `danger`); no cambia la lógica ni el manejo del token.
- `src/components/ProtectedRoute.js` (área de contrato): en el estado `ok` ya no pinta el botón «Cerrar sesión» (pasa a ser un ítem de la barra de gestión, `Sidebar`); lo conserva en el estado `unavailable`. `api.logout()` es el mismo y `src/services/api.js` no cambia.
- `package.json` (área de contrato): solo baja el tope de avisos de ESLint (`--max-warnings`). Sin dependencias ni scripts nuevos.
- Resto: marcado, estilos (tokens de color y `spacing.nav` en `tailwind.config.js`), textos (claves nuevas en `es` y `en`, con el primer plural; los `translation.json` se reindentaron a 2 espacios, ruido de formato sin cambio de contenido) y estructura de la aplicación (barra de gestión inferior y lateral, enlace de salto, un único pie, avisos, selectores nativos). Detalle en `docs/09`.

Integración: sin impacto — solo marcado, estilos, textos y la posición del botón de cerrar sesión; no cambian rutas, métodos, cabeceras ni cuerpos de ninguna petición, ni la sesión ni api.js; package.json solo baja el tope de avisos

## Qué debe hacer el otro repositorio

- **`sigmetum-infra`:** nada. No hay variables, recursos de S3 ni cabeceras nuevas.
- **`sigmetum-backend`:** nada. Las llamadas a `/list-files`, `/get-data/<key>`, `/delete-file`, `/update-file`, `/list-terms`, `/upload-term`, `/delete-term`, `/list-images`, `/upload-image`, `/delete-image`, `/upload`, `/upload/confirm` y `/send-email` son las mismas.
- **Vuelta atrás:** revertir el commit; no hay migraciones ni variables nuevas.

## Por confirmar

- A mano: orden de Tab real, lector de pantalla (NVDA y VoiceOver), zoom al 200 %, alto contraste de Windows, táctil real, el contorno de `main` tras el enlace de salto y el backend real de `dev`. Lo medido con Playwright (320, 375, 768, 1024 y 1280 px, es y en a 320 px, y el `scroll-padding-bottom` de 20 rem con el banner visible) está en `docs/09`.
