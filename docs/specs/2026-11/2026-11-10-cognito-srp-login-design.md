# Login con formulario propio y SRP contra Cognito: spec

Fecha: 2026-11-10 · Estado: cerrado

## Objetivo

Sustituir el login por redirección al Hosted UI (PKCE, `/auth/callback`; commits `2265013`, `927d093`, `e37a997`) por un formulario integrado en `/login` que se autentica con SRP directamente contra la API de Cognito (decisión del usuario del 10/11/2026; `infra:C18`). El formulario cubre el acceso normal y los retos del pool (contraseña nueva, registro del TOTP, código TOTP), guarda y renueva los tokens, y cierra sesión revocando el token de refresco. El backend no cambia: recibe el mismo token de acceso como `Bearer`.

## Decisiones del usuario (10/11/2026)

1. **Librería de SRP:** `amazon-cognito-identity-js` usando **solo su `AuthenticationHelper`**. El proyecto hace los `fetch` a `cognito-idp`, y conserva `session.js` y la lectura de `__type`. Datos verificados con `npm view` el 10/11/2026: versión 6.3.22, modificada el 13/10/2026; dependencias `buffer` 4.9.2, `js-cookie`, `fast-base64-decode`, `isomorphic-unfetch` y `@aws-crypto/sha256-js` 1.2.2; 1,39 MB descomprimido (no es el peso en el bundle). Si no es viable (ver criterio 15), el developer se para y lo dice: se vuelve a la puerta humana.
2. **QR del TOTP:** solo la URI `otpauth://` y el secreto en texto. Sin librería de QR ni servicio externo. Accesible, con botón de copiar si procede (textos por `t()`).
3. **Hosted UI:** se retira ya (`AuthCallback`, PKCE, `redirect_uri`/`logout_uri`, canje por `/oauth2/token`, `VITE_COGNITO_DOMAIN`). La ruta `/auth/callback` y su título de `useDocumentTitle` desaparecen. Si el SRP falla en `dev`, se redespliega la compilación anterior de Amplify.
4. **Bloqueo por intentos:** un único mensaje genérico para cualquier fallo de credenciales, que mencione de forma general esperar unos minutos tras varios intentos, sin detectar el caso concreto («Password attempts exceeded»).
5. **Almacén de tokens:** se mantiene `localStorage` con las claves `token` y `refreshToken` y `session.js` como único módulo (decisión del usuario del 09/11/2026, sin cambios). `saveTokens` pasa a recibir `AuthenticationResult` en PascalCase (`AccessToken`, `RefreshToken`); nunca se guarda el `IdToken`. Contraseña, código TOTP, `Session` de los retos y secreto TOTP solo en memoria.

## Estado actual (leído del código, para contraste)

- `services/session.js`: `localStorage` con claves `token` y `refreshToken`; `saveTokens({ access_token, refresh_token })` (snake_case del endpoint OAuth); PKCE en `sessionStorage`; `startLogin`, `logout` (redirige a `/logout` del Hosted UI), `redirectUri`.
- `services/api.js`: `cognitoToken()` hace POST de formulario a `<COGNITO_DOMAIN>/oauth2/token`; `renewSession()` cierra sesión salvo error reintentable, con criterio en el `error` OAuth del cuerpo (`serverMessage`); `exchangeCode`; Bearer, 401 con refresco compartido (`refreshSession`), 503 con reintentos (1 s y 3 s) ya implementados.
- `pages/AuthCallback.js` (+ test), `components/LoginForm.js` (botón que llama a `startLogin`), `ProtectedRoute.js` (`getAccessToken`, `logout`), `config/env.js` (`COGNITO_DOMAIN`, `COGNITO_CLIENT_ID`), `.env.example`, `scripts/quality-check.mjs` (archivos autorizados a tocar `localStorage` y funciones de token: `api.js`, `session.js`, `ProtectedRoute.js`).
- Claves i18n actuales `login.*`: `title`, `logInButton`, `startError`, `callbackLoading`, `callbackError`, `retryButton`, `logOutButton`, `serviceUnavailable`.
- `package.json` no tiene ninguna dependencia de Cognito/AWS. M16 (bundle único mayor de 500 kB) sigue abierto en `docs/09`.

## Supuestos declarados

1. El pool es el descrito en `infra:C18`: cliente público sin secreto con `ALLOW_USER_SRP_AUTH` y `ALLOW_REFRESH_TOKEN_AUTH`, MFA TOTP obligatorio, registro cerrado, `prevent_user_existence_errors` activo, refresco de 8 h, revocación activa.
2. El orden de retos en el primer acceso (`NEW_PASSWORD_REQUIRED`, luego `MFA_SETUP`) y los nombres exactos de parámetros son **(por confirmar contra el pool real tras el `apply` de infra)**.
3. La región sale del prefijo de `VITE_COGNITO_USER_POOL_ID` antes del `_` (p. ej. `eu-west-3` en `dev`).
4. No hay «olvidé mi contraseña» ni registro: la pantalla no los ofrece.
5. Una sesión abierta con el flujo anterior (tokens de Hosted UI en las mismas claves) puede seguir renovándose con `REFRESH_TOKEN_AUTH` del mismo cliente: **(por confirmar en `dev`)**; si no, el usuario vuelve a `/login`, sin consecuencias.

## Criterios de aceptación

### De código

1. **Inicio de sesión SRP.** Con usuario y contraseña válidos y MFA ya registrado, el formulario de `/login` ejecuta `InitiateAuth` (`USER_SRP_AUTH`) y `RespondToAuthChallenge` (`PASSWORD_VERIFIER`) contra `https://cognito-idp.<región>.amazonaws.com/` y, tras el reto `SOFTWARE_TOKEN_MFA` resuelto, guarda la sesión y navega a `/cargar-archivos`. Tests unitarios con `fetch` simulado verifican `X-Amz-Target`, `AuthFlow`, `ClientId` y que la contraseña no viaja en claro en ninguna petición. El cálculo SRP lo hace `AuthenticationHelper`; las peticiones las hace el proyecto con `fetch`.
2. **Región.** Un test comprueba que la URL del endpoint se deriva del prefijo del id del pool y que, con la variable vacía o sin `_`, el login muestra un error traducido sin hacer ninguna petición.
3. **Reto `NEW_PASSWORD_REQUIRED`.** Pantalla accesible que pide contraseña nueva y su confirmación; valida en cliente mínimo 14 caracteres con mayúsculas, minúsculas, números y símbolos (la autoridad es Cognito; sus rechazos se muestran con mensaje traducido). Responde con `RespondToAuthChallenge` y continúa con el reto siguiente.
4. **Reto `MFA_SETUP`.** Pantalla que llama a `AssociateSoftwareToken`, muestra **la URI `otpauth://` y el secreto en texto** (sin QR, sin librería de QR, sin servicio externo), con botón de copiar si procede (textos por `t()`, anuncio `role="status"` al copiar), pide el código de seis dígitos, lo confirma con `VerifySoftwareToken` y completa el reto. El secreto no se escribe en consola, en el almacenamiento del navegador ni en mensajes de error.
5. **Reto `SOFTWARE_TOKEN_MFA`.** Pantalla accesible que pide el código de seis dígitos (`autocomplete="one-time-code"`, `inputmode="numeric"`); un código incorrecto da un mensaje traducido y permite reintentar sin repetir usuario y contraseña mientras la sesión del reto siga vigente; si caduca, vuelve al primer paso con aviso.
6. **Errores del login.** Usuario inexistente, contraseña incorrecta y bloqueo por intentos muestran el **mismo** mensaje genérico traducido, que menciona de forma general esperar unos minutos tras varios intentos; no se inspecciona el `message` de Cognito para detectar el bloqueo (tests con las tres respuestas simuladas, mismo texto). Red, 5xx o 429 muestran un mensaje de servicio no disponible distinto y reintentable.
7. **Almacenamiento.** `session.js` sigue siendo el único módulo que toca `localStorage` (claves `token` y `refreshToken`). `saveTokens` recibe `AuthenticationResult` en PascalCase y guarda `AccessToken` y, si viene, `RefreshToken`; el `IdToken` nunca se guarda ni se usa. Contraseña, código TOTP, `Session` de los retos y secreto TOTP solo viven en memoria del componente y se descartan al terminar o desmontar.
8. **Renovación.** `renewSession` usa `InitiateAuth` con `REFRESH_TOKEN_AUTH`; si la respuesta no trae `RefreshToken`, se conserva el existente. Una única renovación compartida por los 401 simultáneos.
9. **Regla de errores al renovar (rehace M20).** Se lee `__type` del cuerpo de Cognito (`{__type, message}`), no `error`. Se cierra la sesión (borrar tokens y redirigir a `/login`) **solo** con `__type` igual a `NotAuthorizedException`. Red, 5xx, 429 y 4xx sin `__type` reconocible siguen siendo reintentables: error `auth_unavailable` con status 503, sin cerrar sesión. Tests por caso, incluido un cuerpo no JSON. Otros `__type` explícitos (`TooManyRequestsException`, `LimitExceededException`, `InternalErrorException`…) se tratan como reintentables; lo valida el arquitecto.
10. **Backend sin cambios.** Se conservan el `Bearer` con el token de acceso y el tratamiento de 401 y 503 de `request()`; los tests de `api.test.js` que no dependen del Hosted UI siguen en verde.
11. **Cierre de sesión.** Borra los tokens **siempre** (aunque falle la revocación o no haya red) y revoca el token de refresco con `RevokeToken` o `GlobalSignOut` (elección del arquitecto). La navegación a `/` no depende de la revocación. Test con revocación fallida.
12. **Retirada del Hosted UI, sin huérfanos.** Se eliminan `AuthCallback.js` y su test, la ruta `/auth/callback` de `App.js` y su título en `useDocumentTitle`, PKCE (`pkce_verifier`, `pkce_state`, `codeChallengeFor`, `buildAuthorizeUrl`, `takePkce`), `redirectUri`, `logout_uri`, `exchangeCode`, el canje por `/oauth2/token`, `VITE_COGNITO_DOMAIN` (en `env.js`, `.env.example` y documentación) y las claves i18n que dejen de usarse (`callbackLoading`, `callbackError`, `startError` si procede) en `es` y `en`. Comprobable con `grep` sin coincidencias y `npm run lint` sin imports sin uso.
13. **Variables.** `VITE_COGNITO_USER_POOL_ID` en `src/config/env.js` (sin valor por defecto) y en `.env.example` con un valor de ejemplo no real. Ninguna variable `VITE_*` con secretos.
14. **`quality-check`.** `scripts/quality-check.mjs` se actualiza solo si cambia qué archivos tocan tokens o almacenamiento; un módulo de SRP que no los toque no se añade a la lista. `npm run quality` pasa.
15. **Dependencia `amazon-cognito-identity-js` (solo `AuthenticationHelper`).** Comprobables:
    1. `AuthenticationHelper` se exporta públicamente y funciona con Vite 6 (build y tests). Si hace falta polyfill de `Buffer`/`global`, es el mínimo necesario, sin globals ni plugins innecesarios.
    2. El peso real en el bundle se mide con `npm run build` antes y después, se compara con el actual y se anota.
    3. `npm audit --omit=dev` sin avisos nuevos sin aceptar; nunca `npm audit fix --force`.
    4. Justificación escrita de la dependencia en `docs/02-tecnologias.md` y en `docs/guias/seguridad.md`.
    5. Si algo de lo anterior no es viable, el developer se **para y lo dice**: se vuelve a la puerta humana (no se cambia de librería por su cuenta).
16. **Accesibilidad.** Cada campo con `<label>` asociado, errores con `role="alert"` y `aria-describedby`, campos obligatorios indicados, estados de carga con `role="status"`, sin doble envío mientras hay una petición en vuelo, foco con `.focus-ring`, foco movido al encabezado o primer campo al cambiar de pantalla de reto, `autocomplete` correcto (`username`, `current-password`, `new-password`, `one-time-code`), contraste según `docs/guias/accesibilidad.md` y `DESIGN.md`. Sin enlaces de registro ni de recuperación.
17. **i18n.** Todos los textos por `t()` con clave en `es` y `en` (`translations.test.js` pasa; se actualiza su lista de claves si procede).
18. **Contraseña y secretos.** Contraseña, código TOTP y secreto no se guardan en almacenamiento ni se escriben en consola ni en mensajes de error (revisión del diff y, donde sea posible, test que espía `console` y `Storage`). Ningún texto de error muestra el `message` crudo de Cognito.
19. **Verificación.** `npm test -- --maxWorkers=2` (`npm test` a secas falla por memoria del equipo: es del entorno), `npm run build`, `npm run lint` (sin superar `--max-warnings`; si baja, se ajusta), `npm run quality`, `npm run docs:check`, `npm run docs:gate` y, si se toca `plugins/`, `npm run agentes:test`.
20. **Verificación manual en `dev` (por confirmar, no automatizable).** El flujo completo contra el pool real (primer acceso, registro del TOTP, accesos siguientes, bloqueo, renovación, cierre de sesión) solo se prueba contra la rama desplegada en Amplify: el backend de `dev` rechaza `http://localhost` por CORS. Los avisos de la CSP Report-Only se revisan en la consola. Hasta hacerlo queda **(por confirmar)** en la documentación; si el SRP falla, se redespliega la compilación anterior de Amplify.

### De documentación

1. `docs/integracion/para-infra.md`: documenta `VITE_COGNITO_USER_POOL_ID` y `VITE_COGNITO_CLIENT_ID`; retira `VITE_COGNITO_DOMAIN` y la tabla de `redirect_uri`/`logout_uri`; añade a `connect-src` `https://cognito-idp.<región>.amazonaws.com` y quita `/oauth2/token`; corrige lo desactualizado: tabla de la sección 1 (I2, I4, I5, I7 figuran abiertos aunque infra los resolvió), `NODE_ENV = var.environment` (infra lo quitó, M2), el commit de infra citado (`19bdde3`) y la comprobación de la sección 8 (punto 5, flujo del Hosted UI). Se contrasta con `sigmetum-infra/docs/integracion/para-frontend.md`; lo no comprobable, **(por confirmar)**.
2. `docs/guias/seguridad.md`: sesión y token (SRP, qué se guarda, revocación, fin de la nota «no se llama a `/oauth2/revoke`»), justificación de la dependencia y tabla de estado; M1 en `docs/09` coherente con `localStorage`.
3. `docs/02-tecnologias.md`: dependencia nueva con su justificación, peso medido y resultado de `npm audit`.
4. `docs/09-estado-actual-y-deuda-tecnica.md`: fecha de hoy en «Última actualización», cifras recalculadas, M1/M16/M20 actualizados y la verificación manual en `dev` **(por confirmar)** si no se hizo.
5. Documentos que `docsPorArea` asocia a lo tocado: `docs/01`, `03`, `04`, `05`, `06`, `07`, `08` y `docs/integracion/para-backend.md` (sin cambio de contrato; se aclara que ya no hay `/auth/callback`).
6. Aviso `docs/specs/*-aviso-pr.md` (se tocan áreas de contrato: `api.js`, `env.js`, `LoginForm.js`, `ProtectedRoute.js`, `.env.example`, `package.json`) con la línea de integración.
7. Todo lo escrito se contrasta con el código; lo no comprobable, **(por confirmar)**.

## Fuera de alcance

- Cambios en el backend y en la infraestructura (pool, cliente, CSP, variables de Amplify: de infra, hechos en código y pendientes de `apply`); retirar el Hosted UI del pool es decisión posterior de infra.
- Registro de usuarios, «olvidé mi contraseña», cambio de contraseña con sesión iniciada, gestión de usuarios o grupos.
- Cookie `HttpOnly` (M1 de fondo) y decodificar tokens en el navegador.
- Dividir el paquete con `React.lazy` / `import()` (M16), más allá de medir el efecto de la dependencia.
- Otros métodos de MFA, QR del TOTP y otros flujos de Cognito.
- Arreglos de avisos de ESLint o deuda que no deje huérfano este cambio.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: **no lo afecta en el contrato** (mismas rutas, mismo `Bearer` con el token de acceso, mismos 401 y 503, `GET /auth`). Se corrige el texto del frontend sobre Hosted UI y `/auth/callback`; la sección F18 del `para-frontend.md` del backend también habla de Hosted UI y debe actualizarla su repositorio (señalado, no tocado).
- `docs/integracion/para-infra.md`: **lo afecta.** Variable nueva `VITE_COGNITO_USER_POOL_ID`; `VITE_COGNITO_DOMAIN` y las direcciones de retorno dejan de usarse; `connect-src` debe incluir el endpoint `cognito-idp`; el cliente necesita `ALLOW_USER_SRP_AUTH` y `ALLOW_REFRESH_TOKEN_AUTH` (hecho en código por infra, pendiente de `apply`). El `apply` de infra de C18 debe preceder a la compilación nueva del frontend (las `VITE_*` se incrustan al compilar). Hay que avisar a infra de que ya puede retirar `VITE_COGNITO_DOMAIN` y las URLs de retorno.
- Contrato nuevo: API pública de Cognito (`cognito-idp`), CORS abierto (comprobado por infra el 10/11/2026), errores `{__type, message}`.

## Discrepancias detectadas entre documentos (para el arquitecto)

1. El `para-frontend.md` de infra (cabecera) afirma que el frontend «aún no lee ninguna `VITE_COGNITO_*`»; es falso desde `2265013`.
2. El `para-frontend.md` del backend (F18) sigue pidiendo la redirección al Hosted UI; la decisión del 10/11/2026 lo invierte.
3. El `para-infra.md` del frontend dice que localhost «no se puede probar»; con SRP es técnicamente posible, pero el backend de `dev` rechaza `localhost` por CORS.

## Preguntas abiertas

Ninguna. Las cinco preguntas iniciales (librería, QR, Hosted UI, bloqueo por intentos, almacén de tokens) están resueltas en «Decisiones del usuario».
