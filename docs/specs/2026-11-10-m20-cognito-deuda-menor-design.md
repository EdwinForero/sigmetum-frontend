# M20, deuda menor del login con Cognito: spec

Fecha: 2026-11-10 · Estado: cerrado

## Objetivo

Cerrar la deuda menor M20 de `docs/09-estado-actual-y-deuda-tecnica.md` (origen: commit 2265013, segunda opinión del 09/11/2026). Son cinco comportamientos del login con Cognito que hoy pueden cerrar una sesión válida, redirigir a una ruta inexistente, o dejar el código de autorización en la barra de direcciones. Se desarrolla con TDD: cada comportamiento tiene un test que falla por el motivo correcto antes del cambio.

## Criterios de aceptación

### De código

1. Carrera de 401 tardío (a). Una petición autenticada recuerda el token de acceso con el que se envió. Si recibe `401` y `getAccessToken()` ya es otro (otra llamada renovó la sesión), se reintenta una vez con el token actual **sin** llamar a `/oauth2/token` ni cerrar la sesión. Test: dos llamadas simultáneas, la primera renueva; el `401` de la segunda llega después de la renovación; `fetch` a `/oauth2/token` se llama una sola vez y `localStorage` conserva el token nuevo. Si el reintento vuelve a dar `401`, se mantiene el comportamiento actual (limpiar sesión y `assign('/login')`).
2. Logout sin dominio (b). Con `COGNITO_DOMAIN` vacío, `logout()` borra la sesión y navega a `/` y **no** llama a `assign` con una URL relativa `/logout?…`. Test en `session`: `assign` recibe `/` y `localStorage` queda sin `token` ni `refreshToken`. Con dominio configurado el comportamiento no cambia (URL `<dominio>/logout?client_id&logout_uri`).
3. Fallo al refrescar (c). Al renovar con el `refresh_token`: un `5xx` o `429` de Cognito se trata como reintentable, igual que un fallo de red: se propaga el error, **no** se borra la sesión y **no** se redirige a `/login`. La sesión se cierra (`clearSession` + `assign('/login')`) con un `4xx` distinto de `429` **que traiga un código OAuth en el cuerpo (`json.error`)** (decisión 1 revisada; el caso estándar es `400 invalid_grant`, por confirmar contra el pool real). Un `4xx` sin `json.error` (HTML de CloudFront, un WAF) se trata como reintentable. Tests: `500`, `503` y `429` conservan tokens y no llaman a `assign`; `400 invalid_grant` los borra y redirige. Caso sin `refresh_token` guardado: se mantiene el cierre actual. Otros `4xx` con `json.error` (`invalid_client`, `400` con otro `error`, `401` con `error`) también cierran la sesión. Test con `400 invalid_client` y `401 unauthorized`; test de `403` sin cuerpo OAuth que conserva la sesión.
4. Test de StrictMode (d). El test de `AuthCallback.test.js` sobre StrictMode debe fallar si se quita la guarda `useRef` (`started`). Comprueba que `fetch` se llama exactamente una vez con el código, y que en ningún momento aparece un `role="alert"` (ni durante ni tras la navegación a `/cargar-archivos`). Verificación: quitar temporalmente la guarda hace fallar el test (el segundo canje lo rechazaría porque `takePkce` ya vació el almacenamiento y mostraría el alert).
5. Barra de direcciones (e). Tras un canje fallido (rechazo de Cognito, red, configuración ausente), `AuthCallback` pasa al estado de error y navega a `/auth/callback` con `replace: true`, de modo que `?code=` y `?state=` desaparecen de la URL; el alert y el botón de reintento siguen visibles. Test: tras un canje `400`, la ubicación del router es `/auth/callback` sin query y se ve el `alert`. Lo mismo en los casos de validación previa (state distinto, `error=…`, sin PKCE): todo camino que acaba en el estado de error navega con `replace` (decisión 2). Un test por camino.
6. Los cinco comandos siguen en verde: `npm test -- --maxWorkers=2` (`npm test` a secas falla por memoria del equipo, entorno), `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check`; más `npm run docs:gate`. `npm run agentes:test` solo si se tocara `plugins/` (no se prevé).

### De documentación

1. `docs/09-estado-actual-y-deuda-tecnica.md`: M20 marcada como resuelta, citando el commit 2265013 como origen; cifras de tests y fecha de "Última actualización" con la de hoy (las cifras solo viven aquí). Dejar la nota del contrato de Cognito pendiente (ver pregunta 1) como **(por confirmar)**.
2. `docs/03-api.md` y `docs/integracion/para-backend.md` (áreas de `src/services/api.js`): reflejar la regla de renovación (401 tardío con token ya renovado; red, 5xx, 429 y 4xx sin `json.error` reintentables; cierre solo con un 4xx distinto de 429 con `json.error`).
3. `docs/04-paginas.md` (área `src/pages/**`) para el callback con `replace`; `docs/08-guia-desarrollo.md` si cambian los tests descritos; `docs/05-componentes.md` solo si cambian cifras o comportamientos de componentes.
4. Aviso de PR `docs/specs/*-aviso-pr.md`: `src/services/api.js` es área de contrato; hace falta el aviso con `Integración: sin impacto — <motivo>` salvo que se decida cambiar `docs/integracion/`.

## Fuera de alcance

- Cambios de contrato con backend o infra más allá de lo ya documentado (F18 y la sección «Login con Cognito»).
- Cambiar el flujo de login, PKCE, `ProtectedRoute`, el reintento del `503` del backend (`Authentication service unavailable`) o la gestión de `TokenExpiration`.
- Probar contra el pool real de Cognito (en local no hay `localhost` registrado).
- Cualquier otra deuda de `docs/09` distinta de M20.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta en el contrato. El backend sigue recibiendo `Authorization: Bearer <access_token>`; solo cambia cuándo el frontend renueva el token (menos refrescos redundantes). Su doc propio habrá que ajustar si describe la regla de renovación.
- `docs/integracion/para-infra.md`: no lo afecta. Se sigue usando `/oauth2/token`, `/logout` y las variables `VITE_COGNITO_*` ya documentadas. La regla de cerrar solo con un `4xx` (no `429`) con `json.error` no pide nada a infra.
- Contrato de infra (`sigmetum-infra/docs/integracion/para-frontend.md`, «Login con Cognito») y F18 del backend: solo dicen «renovar con el refresco o ir al login» y que el `503` del backend es reintentable. **No documentan qué devuelve Cognito para un `refresh_token` inválido o caducado** ni si responde `5xx`/`429`; los endpoints de Cognito están marcados **(por confirmar contra el pool real tras el `apply`)**. El `400 invalid_grant` sale del estándar OAuth 2.0 (RFC 6749 §5.2), no de un documento del proyecto: **(por confirmar)**.

## Decisiones del usuario (resueltas, 10/11/2026)

1. **4xx de Cognito al refrescar (revisada el 10/11/2026 tras la segunda opinión del plan):** se cierra la sesión con un `4xx` distinto de `429` **solo si trae `json.error`**; red, `5xx`, `429` y un `4xx` sin código OAuth son reintentables y conservan la sesión.
2. **Barra de direcciones:** `?code=&state=` se quita con `navigate('/auth/callback', { replace: true })` en todo camino, no solo tras el canje fallido; por la segunda opinión del plan se hace de forma **síncrona** en el efecto, justo tras leer `code` y `state` y antes de validar o canjear (evita navegar al callback tras desmontarse).

## Preguntas abiertas

Ninguna.
