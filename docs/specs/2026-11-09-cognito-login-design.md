# Login con Cognito (Hosted UI, PKCE S256): spec

Fecha: 2026-11-09 · Estado: cerrado

## Objetivo

El backend solo acepta ya tokens de acceso de Cognito y el login antiguo (`POST /log`, `data.token`) deja de existir al desplegarlo. El frontend debe iniciar sesión por el Hosted UI de Cognito con código de autorización y PKCE S256, y usar el token de acceso en las rutas protegidas. Sin esto, `dev` queda sin login utilizable (infra:C17, ruta crítica). Fuente del contrato: `sigmetum-infra/docs/integracion/para-frontend.md` (sección 2, «Login con Cognito», y sección 3) y `sigmetum-backend/docs/integracion/para-frontend.md` («Autenticación con Cognito (F18)»).

Comportamiento actual (verificado en el código): `LoginForm` pide usuario y contraseña, llama a `POST /log` y guarda `data.token` en `localStorage` (`token`); `api.js` manda `Bearer` desde `localStorage` y ante cualquier `401` borra el token y va a `/login`; `ProtectedRoute` llama a `GET /auth` y comprueba `exp` con `jwt-decode`; `TokenExpiration.js` comprueba `exp` y navega a `/login`; no hay ninguna variable `VITE_COGNITO_*` ni ruta `/auth/callback`; el `index.html` tiene dos `<link rel="preload">` con `onload` inline.

Supuestos: el contrato de infra y backend citado es vigente; los endpoints del Hosted UI son los estándar de Cognito (por confirmar contra el pool real tras el `apply` de infra).

## Criterios de aceptación

### De código

1. Iniciar sesión redirige a `<VITE_COGNITO_DOMAIN>/oauth2/authorize` con `response_type=code`, `client_id=<VITE_COGNITO_CLIENT_ID>`, `scope=openid email`, `redirect_uri=origin + '/auth/callback'` (exacta, sin barra final añadida), `code_challenge` y `code_challenge_method=S256`, y un `state`. Comprobable con test unitario sobre la URL generada (`npm test`).
2. `code_challenge` es el SHA-256 en base64url del `code_verifier`; el `code_verifier` se genera aleatoriamente en cada inicio y no se envía en la redirección de autorización. Test unitario con vector conocido.
3. La ruta `/auth/callback` canjea el código en `<VITE_COGNITO_DOMAIN>/oauth2/token` (`grant_type=authorization_code`, `code_verifier`, mismo `redirect_uri`, sin secreto de cliente), guarda los tokens y lleva al usuario a `/cargar-archivos`. Con `state` distinto del guardado, con `error` en la URL o con canje fallido, no guarda nada y muestra un mensaje (clave `t()`). Tests unitarios con `fetch` simulado.
4. Las rutas protegidas reciben `Authorization: Bearer <token de acceso>`; nunca el de identidad. Test sobre `api.js`.
5. `401` en una ruta protegida: se intenta una renovación (`grant_type=refresh_token` en `/oauth2/token`) y, si va bien, se reintenta la petición una vez; si falla o no hay refresco, se borra la sesión y se va al login. `503` (`Authentication service unavailable`): se reintenta tras unos segundos, sin borrar tokens ni cerrar sesión; agotados los reintentos, se muestra un error y la sesión se conserva. Tests unitarios de ambos caminos, que prueban que `503` no borra tokens.
6. Cerrar sesión borra los tokens y redirige a `<VITE_COGNITO_DOMAIN>/logout?client_id=…&logout_uri=origin + '/'`. Existe un control accesible para ello (con nombre accesible y textos por `t()`).
7. No queda en `src/` ninguna referencia a `POST /log`, `data.token`, `login.tooManyAttemptsLabel`/`429` del login ni campos de usuario y contraseña. `grep` sin coincidencias; las claves `login.*` sin uso se retiran o se justifican en `es` y `en`.
8. `src/config/env.js` expone los dos valores nuevos; `.env.example` lista `VITE_COGNITO_DOMAIN` y `VITE_COGNITO_CLIENT_ID` sin valores reales (infra:C17).
9. En `index.html`, los dos `<link rel="preload">` de fuentes no usan manejador inline (`onload`), y las fuentes siguen cargándose. Comprobable por inspección del HTML compilado y `npm run build`; el efecto en la CSP Report-Only es **(por confirmar)** en `dev` desplegado.
10. Los textos nuevos están en `es` y `en`; el flujo cumple `docs/guias/accesibilidad.md` (foco, `role="alert"` o equivalente en errores, estados de carga).
11. `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check`, `npm run docs:gate` y `npm run agentes:test` (solo si se toca `plugins/`) en verde. El flujo completo contra Cognito **no se puede probar en local** (no hay `localhost` como `redirect_uri`): queda **(por confirmar)** contra la rama desplegada en Amplify (`dev`), después de que se desplieguen backend e infra.

### De documentación

1. `docs/integracion/para-infra.md`: las dos variables nuevas en la sección 3 (obligatoriedad, valor por entorno solo como descripción, públicas, solo en la rama de Amplify), `connect-src` con el dominio de Cognito en la sección 6, las `redirect_uri` y `logout_uri` que usa el frontend, y la corrección de lo que ya no es cierto (`localStorage` como almacén y la frase sobre el token, la comprobación 8.5 de `/login`). Node 22 ya está alineado: no se toca.
2. `docs/integracion/para-backend.md` y `docs/03-api.md`: `POST /log` retirado, `Bearer` con token de acceso, tratamiento de `401` y `503`, D7 sin objeto para el login.
3. `docs/guias/seguridad.md` (almacén del token y regla de archivos), `docs/04-paginas.md`, `docs/05-componentes.md`, `docs/06-utilidades-hooks-config.md`, `docs/08-guia-desarrollo.md` y `docs/09-estado-actual-y-deuda-tecnica.md` (fecha de hoy, cifras, estado de infra:C17 y de las comprobaciones pendientes en `dev`), según `docs/guias/mantenimiento.md`.
4. Aviso de PR `docs/specs/*-aviso-pr.md`: se tocan áreas de contrato (`services/api.js`, `LoginForm`, `ProtectedRoute`, `TokenExpiration`, `env.js`, `.env.example`); `docs/integracion/` cambia.

## Fuera de alcance

- Probar el login en local, o registrar `localhost` como dirección de retorno (es de infra).
- Crear usuarios, MFA TOTP, «olvidé mi contraseña» o registro (los gestiona el Hosted UI/infra).
- Validar `client_id`, grupos o `userId` (C16, aceptado).
- Convivencia con el login antiguo o vuelta atrás.
- Endurecer la CSP o quitar `style-src 'unsafe-inline'` (de infra).
- Fusionar a `master`/`prod` (condicionado a `S18-prod` en infra) y despliegue del frontend antes que el backend (orden: backend e infra primero).
- Cambios en backend o Terraform.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: lo afecta. Cambia el origen y forma del token (Cognito, acceso, `Bearer`), desaparece `POST /log`, y el cliente distingue `401` de `503`. El backend ya lo espera (`578c59c`); sin cambio de backend.
- `docs/integracion/para-infra.md`: lo afecta. Dos variables nuevas (`VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID`), `connect-src` con el dominio de Cognito, rutas `/auth/callback` y `/` creadas por el frontend, y la CSP afectada por el cambio de `index.html`.
- Contratos afectados en `areasContrato`: `src/services/api.js`, `src/config/env.js`, `src/components/LoginForm.js`, `src/components/ProtectedRoute.js`, `src/utilities/TokenExpiration.js`, `.env.example`.

## Decisiones del usuario (resueltas, 09/11/2026)

1. **Almacén de tokens:** `localStorage`, con el token de acceso y el `refresh_token` juntos. Un único **módulo de sesión** sustituye a `LoginForm` en la regla de los tres archivos (`services/api.js`, módulo de sesión, `ProtectedRoute`); se actualizan `docs/guias/seguridad.md` y el chequeo de `npm run quality`. `code_verifier` y `state` van en `sessionStorage`.
2. **Caducidad:** renovación en silencio ante `401`; solo se va al login si el refresco falla. Se retira el diálogo `tokenExpiration.*` y `TokenExpiration.js` si nadie más lo usa (el architect lo confirma).
3. **Pantallas:** `/login` con botón accesible que va al Hosted UI; `/auth/callback` con mensaje de error y botón de reintento ante `error` o `access_denied`.
4. **503:** 2 reintentos con espera creciente (1 s y 3 s), también en `GET /auth`; agotados, mensaje de servicio no disponible sin borrar tokens ni expulsar al usuario.
5. **Sesión y cierre:** `GET /auth` en cada entrada a ruta protegida; cierre solo con `/logout` (sin `/oauth2/revoke`, sin cambio de `connect-src` por ello).

## Preguntas abiertas

Ninguna.
