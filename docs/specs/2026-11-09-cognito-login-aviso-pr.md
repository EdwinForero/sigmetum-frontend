# Aviso para PR: login con Cognito (Hosted UI, PKCE S256)

Spec: `docs/specs/2026-11-09-cognito-login-design.md`
Plan: `docs/specs/2026-11-09-cognito-login-plan.md`

## Qué cambia

- `src/services/api.js` (área de contrato): `Authorization: Bearer` con el token de **acceso** de Cognito; un `401` intenta una renovación (`grant_type=refresh_token` en `/oauth2/token`, compartida entre llamadas simultáneas) y un reintento; el `503` con `error: 'Authentication service unavailable'` se reintenta dos veces (1 s y 3 s) sin borrar la sesión; método nuevo `api.exchangeCode`. Desaparece `POST /log`.
- `src/services/session.js` (nuevo): único módulo que toca `localStorage` (`token`, `refreshToken`) y `sessionStorage` (`pkce_verifier`, `pkce_state`).
- `src/components/LoginForm.js` (área de contrato): botón que redirige al Hosted UI; sin campos. `src/components/ProtectedRoute.js` (área de contrato): `GET /auth` en cada entrada, solo un `401` lleva a `/login` (`Navigate replace`); red, `403` y `5xx` muestran el aviso de servicio no disponible con `<h1>` y botón «Reintentar», sin borrar tokens; botón de cierre de sesión. `src/pages/AuthCallback.js` (nuevo) y ruta `/auth/callback`.
- `src/config/env.js` y `.env.example` (áreas de contrato): `VITE_COGNITO_DOMAIN` y `VITE_COGNITO_CLIENT_ID` (públicas, sin valor por defecto).
- `package.json` (área de contrato): se retira `jwt-decode` y `--max-warnings` baja de 62 a 58. `src/utilities/TokenExpiration.js` (área de contrato) se borra.
- `index.html`: las hojas de Google Fonts pasan a `rel="stylesheet"` (sin `onload` en línea). `scripts/quality-check.mjs`: el módulo de sesión sustituye a `LoginForm` en la regla del almacenamiento.

Integración: actualizada — `docs/integracion/para-backend.md` (Bearer de acceso, `401` con renovación, `503` con reintentos, sin `POST /log`, sesión) y `docs/integracion/para-infra.md` (variables de Cognito, `redirect_uri` y `logout_uri`, `connect-src`, comprobación 8.5).

## Qué debe hacer el otro repositorio

- **`sigmetum-infra`:** definir `VITE_COGNITO_DOMAIN` (con `https://`, sin barra final) y `VITE_COGNITO_CLIENT_ID` (cliente público) **solo en la rama** de Amplify; registrar en el cliente `<origen>/auth/callback` como dirección de retorno y `<origen>/` como `logout_uri`; permitir el dominio de Cognito en `connect-src` de la CSP.
- **`sigmetum-backend`:** nada nuevo en el código (ya espera tokens de acceso de Cognito, F18). Confirmar que el `503` de autenticación mantiene el cuerpo `Authentication service unavailable`, porque el frontend solo reintenta ese.
- **Orden de despliegue:** backend e infra primero, frontend después. No se fusiona a `master` antes de `S18-prod`.

## Por confirmar

- El flujo completo contra Cognito no se puede probar en local: **(por confirmar en `dev`)**, igual que el CORS de `/oauth2/token`, los avisos de la CSP Report-Only (incluido el efecto de quitar el `onload`) y los endpoints del pool real.
- Que los reintentos del `503` (1 s y 3 s) cubran los hasta 10 s de 503 tras un `kid` nuevo del backend: riesgo aceptado, **(por confirmar)**.
- Que un 5xx de Cognito durante la renovación cierre la sesión (hoy solo un fallo de red es indeterminado): **(por confirmar)**.
- `ProtectedRoute` hace dos `GET /auth` bajo `StrictMode` en desarrollo (no en producción **(por confirmar)**).
