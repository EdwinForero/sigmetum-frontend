# Aviso para PR: login con formulario propio y SRP contra Cognito

Spec: `docs/specs/2026-11/2026-11-10-cognito-srp-login-design.md`
Plan: `docs/specs/2026-11/2026-11-10-cognito-srp-login-plan.md`

## Qué cambia

- `src/services/api.js` (área de contrato): concentra todas las peticiones a `https://cognito-idp.<región>.amazonaws.com/` (`POST`, `application/x-amz-json-1.1`, `X-Amz-Target`). Métodos nuevos: `signIn` (SRP, `USER_SRP_AUTH`), `respondToChallenge`, `associateSoftwareToken`, `verifySoftwareToken` y `logout` (`RevokeToken`, hasta 3 s, después va a `/`). La renovación pasa a `InitiateAuth` con `REFRESH_TOKEN_AUTH` y una lista blanca de fallos reintentables: cualquier otro `__type` de un `4xx` cierra la sesión, como un `200` sin `AccessToken`. Desaparecen `exchangeCode` y el canje en `/oauth2/token`. El `Authorization: Bearer` con el token de acceso **no cambia**.
- `src/components/LoginForm.js` (área de contrato): formulario propio (correo y contraseña) con los retos `NEW_PASSWORD_REQUIRED`, `MFA_SETUP` y `SOFTWARE_TOKEN_MFA`; la lógica está en `src/hooks/useCognitoLogin.js` (nuevo) y el cálculo SRP en `src/services/srp.js` (nuevo, con `amazon-cognito-identity-js` 6.3.22). `src/components/ProtectedRoute.js` (área de contrato): `api.logout` en los dos botones de cierre de sesión (se deshabilitan mientras dura la revocación).
- `src/config/env.js` y `.env.example` (áreas de contrato): entra `VITE_COGNITO_USER_POOL_ID` (pública, sin valor por defecto) y sale `VITE_COGNITO_DOMAIN`; `VITE_COGNITO_CLIENT_ID` se mantiene.
- `package.json` (área de contrato): dependencia nueva `amazon-cognito-identity-js` (solo `AuthenticationHelper`; el JavaScript de producción crece, medida en M16 de `docs/09`; `npm audit --omit=dev` sin avisos nuevos). `vite.config.js` (área de contrato): `optimizeDeps.esbuildOptions.define { global: 'globalThis' }` solo para el pre-empaquetado de dev (el paquete `buffer` lee `global.TYPED_ARRAY_SUPPORT`).
- Se borran `src/pages/AuthCallback.js` y su test, la ruta `/auth/callback`, PKCE y `sessionStorage`. `src/services/session.js` queda solo con leer, guardar (PascalCase, sin `IdToken`) y borrar los tokens. `scripts/quality-check.mjs`: `console.*` prohibido en `api.js`, `session.js`, `srp.js`, `useCognitoLogin.js` y `LoginForm.js`.

Integración: actualizada — `docs/integracion/para-infra.md` (variables, `connect-src` a `cognito-idp`, sin `redirect_uri` ni `logout_uri`, peticiones a infra, lo desactualizado de la sección 1) y `docs/integracion/para-backend.md` (sin cambio de contrato: solo se quita el Hosted UI del texto).

## Qué debe hacer el otro repositorio

- **`sigmetum-infra`:**
  1. Hacer el `apply` de C18 (cliente con `ALLOW_USER_SRP_AUTH`, `VITE_COGNITO_USER_POOL_ID` en la rama de Amplify y `cognito-idp` en `connect-src`) **antes** de compilar este frontend.
  2. **Subir `auth_session_validity` del cliente de 3 a 15 minutos**: con 3, registrar el TOTP en la aplicación de autenticación puede caducar.
  3. **Desacoplar `cognito-idp` de `cognito_domain_url` en la CSP** (`modules/amplify/main.tf:14`) antes de retirar `VITE_COGNITO_DOMAIN`.
  4. Después, retirar `VITE_COGNITO_DOMAIN` de la rama y las direcciones de retorno del cliente: el frontend ya no las usa.
- **`sigmetum-backend`:** nada en el código (el `Bearer` de acceso no cambia). Su `docs/integracion/para-frontend.md` (F18, «Autenticación con Cognito») describe el Hosted UI, `/auth/callback` y `VITE_COGNITO_DOMAIN`: está desactualizado.
- **Orden de despliegue:** primero el `apply` de C18 y después la compilación del frontend; backend e infra antes que el frontend, y no se fusiona a `master` antes de `S18-prod`.
- **Vuelta atrás:** redesplegar la compilación anterior de Amplify (el Hosted UI sigue activo como respaldo mientras infra no lo retire).

## Por confirmar

- En `dev`: el SRP contra el pool real, el orden de los retos, el bloqueo por intentos, la duración de la sesión del reto, que Cognito invalide la `Session` tras un `CodeMismatchException`, los avisos de la CSP Report-Only, que no haya `requiredAttributes` en `NEW_PASSWORD_REQUIRED` y el CORS de `cognito-idp` desde el origen de Amplify.
- `crypto.subtle` solo existe en un contexto seguro: por la IP de la red local el acceso daría `login.startError`. Desde `localhost`, Cognito responde pero el backend de `dev` rechaza el origen.
- Que el `define` de `vite.config.js` evite el fallo de `buffer` en un navegador en dev (el build y Vitest no lo detectan).
- Que «Comprobando…» se pinte antes del cálculo SRP (`signIn` cede un turno real con `await sleep(0)`; por confirmar en un navegador).
- Reintentos en el alta del TOTP (`AssociateSoftwareToken` o la respuesta `MFA_SETUP` final con red, `5xx` o `429`): contra el pool real, que la `Session` siga vigente para el reintento; con la duración de 3 minutos puede caducar (de ahí la petición de subir `auth_session_validity`).
- Si el componente se desmonta durante `signIn`, los tokens se guardan igualmente (sesión abierta sin navegar), y `renewSession` devuelve `false` sin redirigir si el refresco cambió durante la renovación (carrera con `logout`): decisión por confirmar.
- Si una petición con `401` en vuelo redirige a `/login`, la navegación puede cancelar la revocación del token de refresco (ya borrado del navegador): la revocación es de mejor esfuerzo.
