# Login con Cognito (Hosted UI, PKCE S256): plan

Fecha: 2026-11-09 · Estado: cerrado · Spec: `docs/specs/2026-11-09-cognito-login-design.md`

## Ajustes aprobados tras la segunda opinión (obligatorios; prevalecen sobre el texto de los pasos)

Aprobados por el usuario el 09/11/2026 junto con la retirada de `jwt-decode` (paso 9) y la actualización de `.claude/flujo.json` en un cambio aparte.

- **Orden:** el paso 5 (`LoginForm` sin almacenamiento) se ejecuta **antes** que el paso 4 (`quality`); si no, `quality` falla entre los dos. En el paso 9, «tras los pasos 7 y 9» se lee «tras los pasos 5 y 7».
- **Paso 3, refresco compartido:** una sola promesa de refresco a nivel de módulo (`let refreshing`) que comparten todas las llamadas con 401 simultáneas; solo esa promesa hace `clearSession` y `assign('/login')` si falla. Test: dos `getAuth` con 401 a la vez producen **un único** POST a `/oauth2/token`.
- **Paso 3, 503 solo de autenticación:** se reintenta únicamente si el cuerpo trae `error === 'Authentication service unavailable'`; el cuerpo se lee con `.catch` (un 503 del ALB trae HTML y no debe romper `response.json()`). Un 503 con otro cuerpo no se reintenta ni borra la sesión. Se corrige el supuesto 4 del plan en consecuencia.
- **Paso 3, tests del refresco:** comprobar el cuerpo del refresco (`grant_type=refresh_token`, `refresh_token`, `client_id`, sin secreto) y que el reintento lleve el token nuevo; añadir un caso de fallo de red durante el refresco (no borra la sesión: es indeterminado, se trata como error reintentable, no como sesión caducada) y un caso de 503 tras el refresco. No enviar `Bearer null` si `getAccessToken()` está vacío.
- **Pasos 3 y 7, esperas:** los tests con reintentos usan temporizadores falsos (`vi.useFakeTimers` con `shouldAdvanceTime` o esperas inyectables) para no acercarse al tope de 5 s de Vitest.
- **Decisión 4, riesgo aceptado:** tras un `kid` nuevo el backend puede dar hasta 10 s de 503 y los reintentos de 1 s y 3 s terminan antes; se anota en Riesgos y en `docs/09` como por confirmar, sin subir las esperas.
- **Paso 6, canje único:** el test de `AuthCallback` se renderiza dentro de `<React.StrictMode>` y comprueba **un solo** `fetch`; no se combina el `useRef` con un indicador `cancelled` en el cleanup que descarte el resultado (la pantalla se quedaría cargando). Exigir un `state` guardado no vacío antes de compararlo.
- **Pasos 2, 5 y 6, variables vacías:** si falta `COGNITO_DOMAIN` o `COGNITO_CLIENT_ID`, `startLogin` y `exchangeCode` no redirigen ni hacen POST: lanzan un error que la pantalla muestra con `t()` en el `alert`. Test en `session.test.js` y `LoginForm.test.js`.
- **Pasos 2 y 3, rechazos:** un rechazo de `startLogin` o `exchangeCode` (falta `crypto.subtle`, red) acaba en el `alert` de la pantalla, no en una promesa sin capturar.
- **Paso 2, `logout_uri`:** `logout` monta la URL con `URLSearchParams`; el test lo comprueba con `searchParams.get('logout_uri')` y no comparando la cadena literal.
- **Paso 4, `quality` más estricto:** además del almacenamiento, detectar la importación de `getAccessToken`, `getRefreshToken`, `saveTokens` y `clearSession` fuera de los archivos permitidos, e incluir `src/pages/AuthCallback.js` (que llama a `api.exchangeCode`, no toca tokens directamente) sin permiso adicional. La regla S3 y `CLAUDE.md` (cuya modificación confirma el usuario) nombran `services/api.js`, `services/session.js` y `ProtectedRoute`.

Supuestos de los que parto:

- El diseño crea un módulo de sesión nuevo, `src/services/session.js`, que es el único archivo que toca `localStorage` (claves `token` para el token de acceso y `refreshToken`) y `sessionStorage` (`pkce_verifier`, `pkce_state`). Se mantiene la clave `token` para que un token antiguo que quede en el navegador provoque un 401, no haya refresco y el usuario vaya al login sin hacer nada más.
- Las llamadas HTTP a `/oauth2/token` se hacen en `api.js`, porque CLAUDE.md dice que «las llamadas HTTP van por `src/services/api.js`». Así la dependencia va en un solo sentido: `api.js` importa `session.js` y nunca al revés.
- Las pantallas que ya llaman a la API con token muestran su error genérico cuando se agotan los reintentos del 503. Solo `ProtectedRoute` tiene un mensaje propio para el 503.
- Reintentar un POST tras un 503 solo es seguro si el 503 es el de autenticación (`Authentication service unavailable`), que sale del middleware antes de que la ruta haga nada; cualquier otro 503 no se reintenta (ver ajustes aprobados).

## Fase 1: base de sesión

1. **Variables de Cognito**
   - Archivos exactos: `src/config/env.js` y `.env.example` (los dos se modifican).
   - Firmas que cambian:
     - `env.COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || ''`.
     - `env.COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || ''`.
     - En `.env.example`: `VITE_COGNITO_DOMAIN=https://<dominio-del-hosted-ui>` y `VITE_COGNITO_CLIENT_ID=<id-del-cliente-publico>`, con un comentario en inglés, como las demás, que diga que son públicas, sin barra final y que solo las define la rama de Amplify.
     - Sin valor por defecto: en local el login no se puede probar, por diseño.
   - Comprobación: no tiene test propio; la cubren los tests del paso 2. `npm run quality` no debe marcar ninguna de las dos.
   - Norma o contrato que aplica: infra `para-frontend.md` §2, «Login con Cognito», fila «Variables de compilación»; seguridad S1.

2. **Módulo de sesión (TDD)**
   - Archivos exactos: crear `src/services/session.js` y `src/services/session.test.js`.
   - Firmas que cambian (todas son exportaciones con nombre):
     - Tokens: `getAccessToken()`, `getRefreshToken()`, `saveTokens({ access_token, refresh_token })` (solo escribe `refreshToken` si viene en la respuesta y nunca guarda el `id_token`) y `clearSession()`.
     - URLs: `redirectUri()` devuelve `window.location.origin + '/auth/callback'`. `buildAuthorizeUrl({ state, codeChallenge })` monta `<COGNITO_DOMAIN>/oauth2/authorize` con `response_type=code`, `client_id`, `redirect_uri`, `scope=openid email`, `state`, `code_challenge` y `code_challenge_method=S256`, usando `URLSearchParams`.
     - PKCE: `codeChallengeFor(verifier)` es asíncrona y devuelve el SHA-256 en base64url sin `=`, con `crypto.subtle`. `takePkce()` devuelve `{ verifier, state }` y borra los dos valores de `sessionStorage`.
     - `startLogin()`: genera un verificador de 32 bytes y un `state` de 16 bytes con `crypto.getRandomValues` en base64url, los guarda en `sessionStorage` y llama a `window.location.assign(buildAuthorizeUrl(...))`.
     - `logout()`: llama a `clearSession()` y después a `window.location.assign('<COGNITO_DOMAIN>/logout?client_id=…&logout_uri=' + origin + '/')`.
   - Comprobación: `npm test -- session`, con `vi.stubEnv` para las dos variables, `vi.resetModules()`, importación dinámica y `vi.stubGlobal('location', { assign, origin })`. Casos:
     - el vector del RFC 7636: `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` da `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`;
     - la URL de autorización tiene esos parámetros, comprobados con `searchParams.get` (en concreto `scope === 'openid email'`) y sin `code_verifier`;
     - dos `startLogin` producen verificadores distintos;
     - `takePkce` vacía `sessionStorage`;
     - `logout` borra los tokens y redirige a la URL de logout;
     - `saveTokens` sin `refresh_token` conserva el que ya había.
     - Por confirmar: si `crypto.subtle` existe en el entorno jsdom de Vitest. Si no, el test usa `vi.stubGlobal('crypto', webcrypto)` de `node:crypto`.
   - Norma o contrato que aplica: decisión 1 de la spec; infra §2 (flujo PKCE, `redirect_uri` exacta, `logout_uri`); seguridad S3 y S4 (a `location` no llega ningún dato del usuario).

3. **`api.js`: Bearer de acceso, 401 con refresco y 503 con reintentos (TDD)**
   - Archivos exactos: modificar `src/services/api.js` y `src/services/api.test.js`.
   - Firmas que cambian:
     - La firma pública de `api.get`, `getAuth`, `post`, `postAuth`, `postFormAuth` y `deleteAuth` no cambia.
     - `request(path, options, { authenticated })` añade `Authorization: Bearer ${getAccessToken()}` en cada intento; `authHeader` desaparece.
     - Con 503 en una llamada con token, espera `RETRY_DELAYS_MS = [1000, 3000]` y reintenta. Si se agotan, lanza el error normal con `status: 503`, sin borrar la sesión ni redirigir.
     - Con 401 en una llamada con token, intenta `refreshSession()` una sola vez. Si funciona, repite la petición una vez con el token nuevo. Si no hay refresco, si el refresco falla o si la repetición vuelve a dar 401, llama a `clearSession()` y a `window.location.assign('/login')` y lanza el error 401 con la forma actual.
     - Función interna nueva `cognitoToken(params)`: POST a `${env.COGNITO_DOMAIN}/oauth2/token` con `application/x-www-form-urlencoded`, `client_id` y sin secreto ni `Authorization`. No usa el envoltorio `{ success, data }`.
     - Método público nuevo `api.exchangeCode(code, verifier)`: canje con `grant_type=authorization_code`, `code`, `code_verifier`, `redirect_uri: redirectUri()`, y luego `saveTokens`. Lanza un error si la respuesta no es correcta o falla la red.
   - Comprobación: `npm test -- api`, con `fetch` simulado y temporizadores falsos para el 503. Casos:
     - después de `exchangeCode` con `{access_token:'A', id_token:'I', refresh_token:'R'}`, `getAuth` envía `Bearer A`;
     - el cuerpo del canje contiene `grant_type`, `code`, `code_verifier`, `redirect_uri` y `client_id`, y no contiene `client_secret`;
     - 401, refresco correcto y reintento 200: se resuelve;
     - 401 sin `refreshToken`, 401 con el refresco fallido y 401 seguido de 401: borran la sesión y llevan a `/login`;
     - tres 503 seguidos: `fetch` se llama 3 veces y el error es `status: 503`, con el token conservado y sin `assign`;
     - 503 seguido de 200: se resuelve.
     - El caso de `api.post('/log')` se reescribe con `/send-email`.
   - Norma o contrato que aplica: backend `para-frontend.md` §3, «Autenticación con Cognito (F18)», puntos 3 a 5; infra §2, fila «Respuestas del backend»; buenas prácticas §4 (HTTP por `api.js`); decisiones 2 y 4 de la spec.

4. **`quality`: el módulo de sesión sustituye a `LoginForm`**
   - Archivos exactos: modificar `scripts/quality-check.mjs`.
   - Firmas que cambian: `KNOWN_DEBT.localStorage.allowed` pasa a `['src/services/api.js', 'src/services/session.js', 'src/components/ProtectedRoute.js']`.
     - La expresión regular ya cubría `localStorage` y `sessionStorage`, así que `sessionStorage` para PKCE solo se permite en `session.js`.
     - `LoginForm` y `AuthCallback` no tienen permiso y deben usar `startLogin` y `takePkce`.
     - Las comprobaciones de secretos (Bearer literal de 30 caracteres o más en `src`, `docs` e `index.html`) y de variables `VITE_*SECRET|TOKEN…` no cambian.
     - Nota: en este diseño `api.js` y `ProtectedRoute` ya no tocan el almacenamiento, pero siguen en la lista porque así lo decidió el usuario.
   - Comprobación: `npm run quality` en verde con `session.js` usando los dos almacenes.
   - Norma o contrato que aplica: seguridad S3; decisión 1 de la spec.

## Fase 2: pantallas

5. **`LoginForm` como botón al Hosted UI (TDD)**
   - Archivos exactos: modificar `src/components/LoginForm.js` y reescribir `src/components/LoginForm.test.js`. `src/pages/Login.js` no cambia.
   - Firmas que cambian:
     - Sin campos, sin `api`, sin `useNavigate` y sin almacenamiento.
     - Muestra `<h2>{t('login.title')}</h2>` y `<ButtonPrincipal text={t('login.logInButton')} onClick={startLogin} />`, con las clases de contenedor que ya existen.
     - Se mantiene el nombre `LoginForm` para no mover la documentación ni el área de contrato. Descartado renombrarlo a `LoginButton`.
   - Comprobación: hay un botón con nombre accesible `login.logInButton`; al pulsarlo, `location.assign` recibe una URL `/oauth2/authorize` con `code_challenge_method=S256`; no hay ningún `textbox`.
   - Norma o contrato que aplica: decisión 3 de la spec; accesibilidad A2 (botón nativo) y A3 (no se añade `outline-none`).

6. **Ruta `/auth/callback` (TDD)**
   - Archivos exactos:
     - crear `src/pages/AuthCallback.js` y `src/pages/AuthCallback.test.js`;
     - modificar `src/App.js` (`<Route path="/auth/callback" element={<AuthCallback />} />`, pública, junto a `/login`);
     - modificar `src/hooks/useDocumentTitle.js` (`'/auth/callback': 'login.title'`) y `src/hooks/useDocumentTitle.test.js` (la fila nueva).
   - Firmas que cambian: dentro de un `useEffect`, protegido con un `useRef` para que el canje, que solo se puede hacer una vez, no se ejecute dos veces:
     - lee `code`, `state` y `error` con `useSearchParams` y llama a `takePkce()`;
     - si hay `error`, falta `code` o el verificador, o el `state` no coincide, no llama a `fetch` y muestra el error;
     - si no, llama a `api.exchangeCode` y después a `navigate('/cargar-archivos', { replace: true })`, que es una ruta fija;
     - si el canje falla, muestra el error.
     - Lo que se pinta: siempre `<h1>{t('login.title')}</h1>`; mientras carga, `<p role="status">{t('login.callbackLoading')}</p>`; si hay error, `<p role="alert">{t('login.callbackError')}</p>` y `<ButtonPrincipal text={t('login.retryButton')} onClick={startLogin} />`.
     - Nunca muestra `error_description` de Cognito.
   - Comprobación: `npm test -- AuthCallback useDocumentTitle`. Casos:
     - éxito: llega a `/cargar-archivos` con los tokens guardados;
     - `state` distinto, `error=access_denied` o canje con 400: hay un `alert`, no se guardan tokens y en los dos primeros casos no se llama a `fetch`;
     - el botón de reintento llama a `location.assign` con una URL de autorización nueva;
     - el estado de carga tiene `role="status"`.
     - El test que exige título para todas las rutas de `App.js` cubre la ruta nueva.
   - Norma o contrato que aplica: infra §2 (`redirect_uri` fija); backend F18, punto 2; seguridad S4 y S10; accesibilidad A7 (`<h1>`), A8b y A12.

7. **`ProtectedRoute`: `/auth` en cada entrada, 503 y cierre de sesión (TDD)**
   - Archivos exactos: modificar `src/components/ProtectedRoute.js` y crear `src/components/ProtectedRoute.test.js`.
   - Firmas que cambian:
     - Se quitan `jwtDecode`, `isTokenExpired`, `DialogAdvice` y `tokenExpiration.*`.
     - El estado es `'checking' | 'ok' | 'denied' | 'unavailable'`: sin `getAccessToken()`, `denied`; si `api.getAuth('/auth')` responde bien, `ok`; si el error es `status === 503`, `unavailable`, sin borrar nada y sin redirigir; con cualquier otro error, `denied`.
     - El efecto ignora la respuesta si el componente se desmonta.
     - `unavailable` pinta `<p role="alert">{t('login.serviceUnavailable')}</p>`. `ok` pinta `<ButtonPrincipal text={t('login.logOutButton')} onClick={logout} />` encima del `element`.
     - El cierre de sesión va aquí porque es un único punto, con un botón con texto (no necesita `aria-label`) en todas las rutas privadas. Descartados `Sidebar` (solo botones de icono sin nombre accesible, y se muestra también en `/explorar`) y `Header` (exigiría estado de sesión compartido).
   - Comprobación: usa el `api` y el `session` reales con `fetch` simulado. Casos:
     - sin token, lleva a `/login`;
     - con 200, se ve el elemento y el botón `login.logOutButton`;
     - tres 503 seguidos: aparece `alert` con `login.serviceUnavailable`, el token sigue y no hay `assign`;
     - el botón de cierre borra los tokens y llama a `assign` con `/logout?client_id=…&logout_uri=<origin>/`.
   - Norma o contrato que aplica: decisiones 2, 4 y 5 de la spec; backend F18, puntos 5 y 6; seguridad S3 y S11; accesibilidad A4 y A12.

8. **Traducciones (`es` y `en`)**
   - Archivos exactos: modificar `src/languages/es/translation.json` y `src/languages/en/translation.json`.
   - Firmas que cambian:
     - Se retiran `login.userLable`, `userPlaceholder`, `passwordLable`, `passwordPlaceholder`, `passwordShowButton`, `passwordHideButton`, `unauthorizedLabel` y `tooManyAttemptsLabel`, y el grupo `tokenExpiration` completo.
     - Se añaden `login.callbackLoading`, `login.callbackError`, `login.retryButton`, `login.logOutButton` y `login.serviceUnavailable`.
     - Se conservan `login.title` y `login.logInButton`.
   - Comprobación: `translations.test.js` (paridad entre idiomas). `grep -rE "tooManyAttempts|userLable|passwordLable|tokenExpiration|'/log'|data\.token" src` sin coincidencias (criterio 7).
   - Norma o contrato que aplica: buenas prácticas §7.

## Fase 3: limpieza e `index.html`

9. **Retirar lo huérfano y ajustar el tope de ESLint**
   - Archivos exactos: borrar `src/utilities/TokenExpiration.js`; modificar `package.json` y `package-lock.json`.
   - Firmas que cambian:
     - Borrar `TokenExpiration.js` (sin importadores, verificado).
     - Ejecutar `npm uninstall jwt-decode`: tras los pasos 7 y 9 no queda ningún uso. Pendiente de la puerta humana (pregunta 1).
     - Bajar `--max-warnings 62` al número real (al desaparecer los campos de `LoginForm` caen los avisos `jsx-a11y` de A5).
   - Comprobación: `grep jwt-decode|jwtDecode src` sin coincidencias; `npm test`, `npm run build`, `npm run lint`, `npm run quality` en verde.
   - Norma o contrato que aplica: principio 3 (limpiar lo que deja huérfano el propio cambio); buenas prácticas §12 y §14; seguridad S6.

10. **`index.html` sin `onload` en línea (TDD)**
    - Archivos exactos: modificar `index.html` y `src/utilities/faviconHtml.test.js` (bloque `describe('index.html')`).
    - Firmas que cambian: los dos `<link rel="preload" … onload="this.rel='stylesheet'">` pasan a `<link rel="stylesheet" href="…">` con el mismo `href`. Descartados mantener `preload` más `stylesheet` aparte (redundante) y alojar las fuentes en el sitio (M13 completo, fuera de la spec).
    - Comprobación: un test nuevo comprueba que no hay `onload=` y que las dos URL de Google Fonts tienen `rel="stylesheet"`; `npm run build` e inspección de `dist/index.html`. El efecto en la CSP queda por confirmar en `dev`.
    - Norma o contrato que aplica: infra §2, «Cabeceras», y §3, «Tareas» (CSP, infra:C11); seguridad S8.

## A cargo del tester-documentador

- **Integración:**
  - `docs/integracion/para-backend.md`: §1 Bearer de acceso, 401 con refresco y 503 con reintentos, sin la fila del 429 del login; §2 sin `POST /log`; §4 sesión con `localStorage` de acceso y refresco, sin decodificar `exp` y con cierre de sesión; §6 D7 sin objeto para el login.
  - `docs/integracion/para-infra.md`: §3 las dos variables (obligatorias, solo en la rama, públicas); §6 `connect-src` con el dominio de Cognito y la frase de `localStorage`; `redirect_uri` y `logout_uri`; §8.5 `/login`.
  - Aviso de PR `docs/specs/2026-11-09-cognito-login-aviso-pr.md`: áreas de contrato, orden de despliegue (backend e infra primero) y que no se fusiona a `master` antes de `S18-prod`.
- **Referencia por área:** `docs/03-api.md` (sin `/log`, endpoints de Cognito, 401 y 503); `docs/01-arquitectura.md` (ruta `/auth/callback`); `docs/04-paginas.md` (`AuthCallback` y `Login`); `docs/05-componentes.md` (`LoginForm` y `ProtectedRoute`); `docs/06-utilidades-hooks-config.md` (`session`, variables de `env`, sin `useTokenExpirationHandler`, título de la ruta nueva).
- **Guías y CLAUDE.md:** `docs/guias/seguridad.md` (S3: los tres archivos, refresco, 503 y cierre de sesión; S8 sin `onload`; tabla §3); `docs/guias/accesibilidad.md` (A5 ya no es cierto para `LoginForm`); `docs/guias/buenas-practicas-frontend.md` §14 y `docs/02-tecnologias.md` (tope de avisos, fila de `jwt-decode`, recursos de `index.html`); `CLAUDE.md`, «Lo que nunca se hace», nombra `LoginForm`: pasa a ser el módulo de sesión. Por ser un archivo de instrucciones, lo confirma el usuario.
- **Estilos y desarrollo:** `docs/07-i18n-y-estilos.md` (grupos de claves y carga de fuentes, que hoy cita `public/index.html`); `docs/08-guia-desarrollo.md` (tabla de cobertura con `session.test.js`, `AuthCallback.test.js` y `ProtectedRoute.test.js`, y las de `LoginForm`, `api`, `faviconHtml` y `useDocumentTitle` revisadas; variables; `scripts/`).
- **Estado:** `docs/09-estado-actual-y-deuda-tecnica.md`: fecha de hoy y métricas (`npm run docs:check -- --metrics`); M1 parcial (hay cierre de sesión; sigue en `localStorage`); M8 parcial (sin `TokenExpiration`); M13 parcial (sin `onload`); infra:C17; por confirmar en `dev`: flujo completo, CORS del endpoint `/oauth2/token`, avisos de la CSP y endpoints del pool real.

## Pruebas

- Nuevas: `src/services/session.test.js`, `src/pages/AuthCallback.test.js` y `src/components/ProtectedRoute.test.js`.
- Reescritas o ampliadas: `src/services/api.test.js`, `src/components/LoginForm.test.js`, `src/hooks/useDocumentTitle.test.js` y `src/utilities/faviconHtml.test.js`.
- Sin cambios previstos: `FileUpload.test.js` (su 401 sin refresco sigue llevando a `/login` con la clave `token`; por confirmar al ejecutarlo) y `translations.test.js`.
- Comandos: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate`. `npm run agentes:test` no hace falta (no se toca `plugins/`).
- El login completo contra Cognito no se puede probar en local: queda por confirmar en Amplify `dev`, después del despliegue de backend e infra.

## Cierre

- **Crítico: sí.** Coincide con `criticidad`: «sesión y token (services/api.js, LoginForm, ProtectedRoute)», «contrato con el backend», «variables de entorno», «accesibilidad» y «dependencias» (si se aprueba retirar `jwt-decode`).
- Documentos de `integracion` afectados: `docs/integracion/para-backend.md` y `docs/integracion/para-infra.md`.

## Preguntas para la puerta humana

1. **`jwt-decode`:** retirarla en el paso 9 (el cambio la deja sin uso; el principio 3 obliga a limpiar lo huérfano) o dejarla y anotar la deuda en `docs/09`. Retirarla toca `package.json`, área de contrato.
2. **`.claude/flujo.json`:** `areasContrato` y `criticidad` citan `LoginForm` y `TokenExpiration.js` (que se borra) y no incluyen `src/services/session.js` ni `src/pages/AuthCallback.js`, que tampoco están en `docsPorArea`. Propuesta: actualizarlo en un cambio aparte.
