# Login con formulario propio y SRP contra Cognito: plan

Fecha: 2026-11-10 · Estado: cerrado · Spec: `docs/specs/2026-11/2026-11-10-cognito-srp-login-design.md`

El `architect` no pudo comprobar el paquete en `node_modules` ni con `npm view`/`npm pack` (sin Bash; la dependencia no está instalada). Lo que se dice de `amazon-cognito-identity-js` sale del `npm view` que recoge la spec y del conocimiento del paquete: va **(por confirmar)**. Por eso el paso 1 es una puerta de parada.

## Decisiones (con lo descartado)

1. **Dónde vive cada cosa.**
   - Todas las peticiones a `cognito-idp` van en `src/services/api.js` (CLAUDE.md y buenas-practicas §4: «Las llamadas HTTP van por api.js»). Descartado un `cognito.js` con `fetch`.
   - Los métodos de login de `api` guardan ellos mismos el `AuthenticationResult` con `saveTokens`; así `LoginForm` nunca toca tokens y la lista de `quality-check` no cambia.
   - El cálculo SRP va en `src/services/srp.js`: sin HTTP y sin almacenamiento.
   - El cierre de sesión pasa a `api.logout`; en `session.js` crearía un ciclo `session` ↔ `api`.
2. **Máquina de estados.**
   - Hook nuevo `src/hooks/useCognitoLogin.js`, con los pasos `credentials | newPassword | mfaSetup | totp`. `LoginForm` solo pinta.
   - La `Session` del reto y `USER_ID_FOR_SRP` van en `useRef`; el secreto TOTP, en estado porque hay que mostrarlo.
   - Contraseña, contraseña nueva y código son campos controlados en `LoginForm` (buenas-practicas §3) y se vacían al terminar cada petición.
   - Al desmontar, la limpieza pone a `null` los refs y una bandera `mountedRef` impide actualizar el estado después (con StrictMode: el efecto pone `mountedRef.current = true` y la limpieza `false`).
   - `AssociateSoftwareToken` se llama desde el manejador que recibe `MFA_SETUP`, no desde un efecto (StrictMode no puede pedir dos secretos).
   - Descartado meter todo en `LoginForm` (un componente largo que mezcla pintar y borrar secretos).
3. **`AuthenticationHelper`.**
   - Se importa desde la raíz: `import { AuthenticationHelper } from 'amazon-cognito-identity-js'`. Nunca por ruta profunda (en dev Vite duplicaría la clase y fallaría `instanceof`).
   - `srp.js` llama a `getLargeAValue` y luego a `getPasswordAuthenticationKey(USER_ID_FOR_SRP, password, B, salt)`, que devuelve la clave hkdf de 16 bytes. El pool tiene `username_attributes = ["email"]`: hay que usar `USER_ID_FOR_SRP`, no el correo escrito.
   - B y la sal deben ser del mismo `BigInteger` del paquete (`padHex` comprueba `instanceof`): se usa el `BigInteger` exportado si la raíz lo exporta; si no, `helper.N.constructor`.
   - La firma `PASSWORD_CLAIM_SIGNATURE` la calcula el proyecto: HMAC-SHA256 con Web Crypto sobre `poolName + USER_ID_FOR_SRP + SECRET_BLOCK (base64 decodificado) + TIMESTAMP`; `TIMESTAMP` también lo genera el proyecto. Así se respeta «solo `AuthenticationHelper`» sin `DateHelper` ni `CognitoUser`.
   - `Buffer`: el paquete importa `buffer` 4.9.2 de forma explícita; no hay `Buffer` global. Ese `buffer` lee `global.TYPED_ARRAY_SUPPORT`: en el build el plugin commonjs de Rollup reescribe `global`; en dev el pre-empaquetado con esbuild no. Por eso se añade solo `optimizeDeps.esbuildOptions.define: { global: 'globalThis' }` (no toca el código propio, ni el build ni los tests). Vitest carga el `buffer` nativo de Node, así que los tests no detectan este problema; lo cubre el paso 9. Descartados `<script>window.global = window</script>` (la CSP `script-src 'self'` lo bloquea) y el `define` global.
4. **Errores de Cognito.**
   - Se lee `__type` normalizado: `split('#').pop().split(':')[0]`. El `message` de Cognito nunca se guarda.
   - Al renovar, solo `NotAuthorizedException` cierra la sesión. Todo lo demás da `auth_unavailable` con status 503: 5xx, 429, `TooManyRequestsException`, `LimitExceededException`, `InternalErrorException`, cualquier otro `__type`, un 4xx sin `__type`, un cuerpo no JSON, la configuración vacía y un 200 sin `AccessToken`. Un fallo de red sube como `network`.
   - Con `UserNotFoundException` o `PasswordResetRequiredException` el usuario no queda atrapado: ve «servicio no disponible», que tiene botón de cerrar sesión (y `prevent_user_existence_errors` los convierte en `NotAuthorized`).
   - El 200 sin `AccessToken` cambia respecto de hoy (cierra la sesión) por la regla literal del criterio 9.
5. **Cierre de sesión.**
   - `RevokeToken` con `{ Token: refreshToken, ClientId }`. Orden: leer el refresco, `clearSession()`, revocar con `Promise.race([revocar, sleep(3000)])` ignorando el error, y después `window.location.assign('/')`.
   - Descartados `GlobalSignOut` (cierra todas las sesiones del administrador y necesita el token de acceso vigente), la revocación sin esperar (la navegación cancela el `fetch`) y `keepalive` (con preflight CORS no es fiable, por confirmar).

Supuestos de partida: no hay `requiredAttributes` en `NEW_PASSWORD_REQUIRED` (si los hubiera, saldría `login.startError`, por confirmar en dev); la sesión del reto dura 3 minutos (valor por defecto; `auth_session_validity` no está fijado en infra, por confirmar).

## Ajustes aprobados tras la segunda opinión (prevalecen sobre el texto de los pasos y las decisiones)

Decididos por el usuario el 10/11/2026.

- **Pasos 2 y 5, `poolName` y oráculo (crítico):** `poolName = USER_POOL_ID.split('_')[1]` (igual que `CognitoUserPool.getUserPoolName` del paquete); el mismo valor entra en el constructor del cálculo de x y en la firma. Oráculo independiente en `srp.test.js`: ejecutar `CognitoUser.authenticateUser` del propio paquete **solo en el test** (con `CognitoUserPool({ UserPoolId: '<región>_AbC' })`, `pool.client.request` simulado para capturar `ChallengeResponses`, `crypto.getRandomValues` determinista y `vi.setSystemTime`) y exigir `SRP_A`, `TIMESTAMP` y `PASSWORD_CLAIM_SIGNATURE` idénticos byte a byte; el oráculo con `createHmac` sobre las mismas piezas se mantiene solo como prueba complementaria. Un test con el id de pool completo como `poolName` debe fallar (documenta el error). `getPasswordAuthenticationKey` entrega el resultado por callback síncrono y lanza excepciones síncronas (`B cannot be zero`): se envuelve en una promesa con try/catch que resuelve una sola vez; el hkdf es un `Uint8Array(16)`, no un `Buffer`; `BigInteger` no se exporta: se usa `helper.N.constructor` sin «si la raíz lo exporta».
- **Decisión 4 y paso 4, lista blanca de reintentables:** al renovar son reintentables solo red, 5xx, 429, `TooManyRequestsException`, `LimitExceededException`, `InternalErrorException`, un 4xx sin `__type` y un cuerpo no JSON (y la configuración vacía). **Cualquier otro `__type` de un 4xx cierra la sesión** (incluidos `InvalidParameterException`, `ResourceNotFoundException`, `UserNotFoundException`, `PasswordResetRequiredException`, `NotAuthorizedException`). Un 200 sin `AccessToken` cierra la sesión (como hoy; se retira la frase contraria). Tests `it.each` de ambas listas. El mismo criterio se aplica a `signIn` y a los retos donde corresponda (`useCognitoLogin`).
- **Paso 7, la contraseña nunca en la URL:** el manejador de envío empieza con `e.preventDefault()` en la primera línea, el `form` lleva `method="post"` y los campos contraseña, contraseña nueva, confirmación, código y secreto **no llevan atributo `name`** (el autocompletado funciona con `autocomplete`); en el paso `newPassword` se añade un campo `username` de solo lectura (`autocomplete="username"`, con el correo) para que los gestores de contraseñas guarden la nueva. Test: un envío cuyo manejador falla no cambia `location` ni `window.history`.
- **Paso 7, retos:** al volver a `credentials` se vacían `secret` y `otpUri`; se considera que Cognito puede invalidar la `Session` tras un `CodeMismatchException` (por confirmar en `dev`): si el reintento da `NotAuthorizedException` tras un código erróneo, el mensaje es `sessionExpired` pero el texto no debe sugerir que pasó demasiado tiempo si hubo un código erróneo previo (decídelo con el texto existente o una clave `codeSessionLost` en es y en); un `MFA_SETUP` repetido genera otro secreto: se avisa en el paso (`login.mfaSetupAgain`, es y en) de que la entrada anterior de la aplicación de autenticación quedó obsoleta; el cálculo SRP cede un turno (`await` de una promesa resuelta) antes de calcular para que «Comprobando…» se pinte.
- **Pasos 6 y 7, tests y logout:** test de doble envío en el mismo tick (pasa solo con `busyRef`, no con `disabled`); caso de `srpTimestamp` con día local distinto del día UTC; el botón de cerrar sesión de `ProtectedRoute` se deshabilita mientras dura la revocación; si una petición con 401 en vuelo dispara `redirectToLogin`, la navegación a `/login` puede cancelar la revocación: el token de refresco ya se borró y la revocación es de mejor esfuerzo (se documenta); nota de que `crypto.subtle` solo existe en contexto seguro (dev por IP de red local da `startError`).
- **Paso 1 y paso 9, medida (M16):** importar desde la raíz arrastra todo el paquete (sin `sideEffects`: `isomorphic-unfetch`, `js-cookie`, `getUserAgent()` al cargar). Se anota en la medida de `docs/09` (M16) con el tamaño antes y después.
- **Infra y preguntas del architect aceptadas:** (1) pedir a infra subir `auth_session_validity` de 3 a 15 minutos; (2) regla en `scripts/quality-check.mjs` que prohíba `console.` en `api.js`, `session.js`, `srp.js`, `useCognitoLogin.js` y `LoginForm.js` (con su comprobación en el chequeo y documentada); (3) el cierre de sesión puede tardar hasta 3 s. **CSP de infra:** `modules/amplify/main.tf:14` solo incluye `cognito-idp` en `connect-src` si existe `cognito_domain_url`; `para-infra.md` y el aviso de PR piden a infra desacoplarlo antes de retirar `VITE_COGNITO_DOMAIN`.

## Fase 1: dependencia y piezas sin interfaz (suite verde al final de cada paso)

1. **Medir, instalar y comprobar que la dependencia es viable (puerta de parada)**
   - Archivos: `package.json`, `package-lock.json` y `vite.config.js` (modificar).
   - Firmas: ninguna en `src/`. En `vite.config.js`, `optimizeDeps.esbuildOptions` pasa a `{ loader: { '.js': 'jsx' }, define: { global: 'globalThis' } }`, solo si se cumple la comprobación c.
   - Comprobación, en este orden: a) `npm run build` antes de instalar; anotar tamaño y gzip de `dist/assets/*.js`. b) `npm install amazon-cognito-identity-js@6.3.22`. c) En `node_modules/amazon-cognito-identity-js`: campo `module` o `main` de `package.json` (y `exports`, `sideEffects` si existen); que el índice ES exporta `AuthenticationHelper` y si exporta `BigInteger`; que existen `getLargeAValue(callback)` y `getPasswordAuthenticationKey(username, password, serverBValue, salt, callback)`; que el `index.js` del `buffer` que resuelve contiene `global.TYPED_ARRAY_SUPPORT` (decide el `define`). d) `npm audit --omit=dev` sin avisos nuevos. e) `npm test -- --maxWorkers=2` y `npm run build` siguen en verde.
   - **Parar y avisar** (criterio 15.5) si falta la exportación, si cambian las firmas o si aparece cualquier aviso nuevo de `npm audit`.
   - Norma: buenas-practicas §12; seguridad.md S6.

2. **`src/services/srp.js`: cálculo SRP sin red**
   - Archivos: crear `src/services/srp.js` y `src/services/srp.test.js`.
   - Firmas: `srpTimestamp(date)` → `'Mon Nov 9 07:05:03 UTC 2026'` (UTC, día sin cero delante, hora/minutos/segundos con dos dígitos); `passwordClaimSignature({ hkdf, poolName, userId, secretBlock, timestamp })` → base64; `srpStart(poolName)` → `{ helper, srpA }` (A en hexadecimal); `srpPasswordVerifier(helper, poolName, password, challengeParameters, date = new Date())` → `{ USERNAME: USER_ID_FOR_SRP, PASSWORD_CLAIM_SECRET_BLOCK, PASSWORD_CLAIM_SIGNATURE, TIMESTAMP }`.
   - Comprobación (TDD; primero falla porque el módulo no exporta las funciones): vectores de `srpTimestamp` para un día de una cifra y otro de dos; la firma contra un oráculo independiente (`createHmac` de `node:crypto` sobre `Buffer.concat` de las mismas piezas); con el `AuthenticationHelper` real y B, sal y `SECRET_BLOCK` arbitrarios: `srpA` en hexadecimal, una firma de 32 bytes, `USERNAME === USER_ID_FOR_SRP` y ningún valor de la salida contiene la contraseña; si `crypto.subtle` no existe en jsdom, stub de `webcrypto` como en `session.test.js`; si un test pasa de 5 s, `{ timeout: 15000 }`. **No hay vector SRP público verificable para Cognito**: la corrección matemática contra el pool queda **(por confirmar en dev)** (criterio 20).
   - Norma: decisión 1 de la spec; contrato de infra §2, fila «Autenticación».

3. **`src/utilities/passwordPolicy.js`: ayuda en cliente**
   - Archivos: crear `src/utilities/passwordPolicy.js` y `passwordPolicy.test.js`.
   - Firma: `meetsPasswordPolicy(password)` → `boolean`: longitud ≥ 14, `/[a-z]/`, `/[A-Z]/`, `/\d/` y `/[^A-Za-z0-9]/`.
   - Comprobación (TDD): 13 caracteres da `false`; falta cada clase por separado da `false`; uno válido da `true`. Cognito es la autoridad (sus rechazos se tratan en el paso 7).
   - Norma: buenas-practicas §2; seguridad.md S5.

## Fase 2: cambio de sesión, un cambio atómico

Dentro de esta fase el developer ejecuta solo los tests del paso. Suite, build y lint se exigen al cerrar el paso 8.

4. **Variables, almacén y renovación por `cognito-idp`**
   - Archivos: `src/config/env.js`, `.env.example`, `src/services/session.js`, `src/services/api.js`, `src/services/api.test.js`, `src/services/session.test.js`.
   - Firmas: `env` gana `COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || ''` y pierde `COGNITO_DOMAIN`. `.env.example`: `VITE_COGNITO_USER_POOL_ID=<region>_<id-del-pool>` con comentario en inglés (valor público, su prefijo es la región, solo en la rama de Amplify); sale `VITE_COGNITO_DOMAIN` y se corrige el comentario de `CLIENT_ID`. `saveTokens({ AccessToken, RefreshToken })`. En `api.js`, internas: `cognitoEndpoint()` (`https://cognito-idp.<región>.amazonaws.com/`, o `null` si el pool está vacío, no tiene `_` o falta el cliente); `cognito(action, payload)` (`POST`, `Content-Type: application/x-amz-json-1.1`, `X-Amz-Target: AWSCognitoIdentityProviderService.<action>`); errores `{ type: 'cognito', status, code }`, `{ type: 'config' }` o `network`. `renewSession` usa `InitiateAuth` con `AuthFlow: 'REFRESH_TOKEN_AUTH'`, `ClientId` y `AuthParameters: { REFRESH_TOKEN }`, con la regla de la decisión 4. Se borran `cognitoToken`, `exchangeCode` y el import de `redirectUri`. `refreshSession`, `redirecting`, `request()` y los 503 no cambian.
   - Comprobación (TDD; primero fallan porque se sigue llamando a `/oauth2/token`): se reescribe el bloque «401 con refresco» con la URL de `cognito-idp`, cabeceras, cuerpo JSON y `AuthenticationResult`; `NotAuthorizedException` cierra la sesión, también con prefijo `com.amazonaws…#`; `it.each` de todos los casos reintentables de la decisión 4, con la sesión conservada y sin redirigir; un `RefreshToken` nuevo sustituye al anterior y su ausencia conserva el que había; siguen en verde los tests de refresco compartido, 401 tardío, otra pestaña y 503; `session.test.js` comprueba `saveTokens` en PascalCase y que `IdToken` nunca se guarda.
   - Norma: seguridad.md S3; spec, criterios 8, 9, 10 y 13; planes del 09/11 y del 10/11.

5. **Métodos de login en `api`**
   - Archivos: `src/services/api.js` y `src/services/api.test.js`.
   - Firmas: `api.signIn(username, password)` (valida la configuración antes de calcular nada; `srpStart`, `InitiateAuth` con `USER_SRP_AUTH`, `ClientId`, `AuthParameters: { USERNAME, SRP_A }`, `srpPasswordVerifier`, `RespondToAuthChallenge` con `PASSWORD_VERIFIER` y `Session` si viene; devuelve `{ ...settle(r), username: USER_ID_FOR_SRP }`); `api.respondToChallenge(name, session, responses)` → `settle(...)`; `api.associateSoftwareToken(session)` → `{ secretCode, session }`; `api.verifySoftwareToken(session, code)` → `{ ok: Status === 'SUCCESS', session }`; `settle(r)` interna: con `AccessToken`, `saveTokens` y `{ done: true }`; con `ChallengeName`, `{ challenge, session }`; si no, lanza `cognitoError(200, '')`. `ClientId` solo va en `InitiateAuth`, `RespondToAuthChallenge` y `RevokeToken`.
   - Comprobación (TDD; primero falla porque `api.signIn` no existe): `X-Amz-Target`, `AuthFlow` y `ClientId` correctos; la contraseña no aparece en ningún `body` de `fetch`; con el pool vacío o sin `_`, lanza `{ type: 'config' }` sin llamar a `fetch` (criterio 2); se guardan `AccessToken` y `RefreshToken` y no el `IdToken`.
   - Norma: spec, criterios 1, 2, 7 y 18; CLAUDE.md (HTTP por `api.js`).

6. **Cierre de sesión con revocación y limpieza de `session.js`**
   - Archivos: `src/services/api.js`, `src/services/session.js`, `src/components/ProtectedRoute.js`, `src/services/api.test.js`, `session.test.js`, `ProtectedRoute.test.js`.
   - Firmas: `api.logout()` con la secuencia de la decisión 5 y `REVOKE_TIMEOUT_MS = 3000`. `session.js` queda solo con `getAccessToken`, `getRefreshToken`, `saveTokens` y `clearSession` (se borran PKCE, `redirectUri`, `buildAuthorizeUrl`, `codeChallengeFor`, `takePkce`, `startLogin`, `logout` y el import de `env`). `ProtectedRoute` usa `onClick={api.logout}` en los dos botones.
   - Comprobación (TDD; primero falla porque `api.logout` no existe): dentro del mock de `fetch`, el token ya es `null` cuando se llama a `RevokeToken`; el cuerpo es `{ Token: 'R', ClientId }`; navega a `/` tanto si la revocación va bien como si falla (rechazo o 400); sin refresco no hay `fetch`; con temporizadores falsos y un `fetch` que no responde, navega a `/` a los 3000 ms; en `ProtectedRoute.test.js` se sustituyen las expectativas de `/logout` y `logout_uri`.
   - Norma: spec, criterio 11; seguridad.md S3; quality-check (la lista de token no cambia).

7. **`useCognitoLogin` y `LoginForm` con los retos**
   - Archivos: crear `src/hooks/useCognitoLogin.js`; reescribir `src/components/LoginForm.js` y `LoginForm.test.js`; `src/languages/es/translation.json`, `en/translation.json`, `src/languages/translations.test.js`.
   - Firmas del hook: `useCognitoLogin({ onAuthenticated })` → `{ step, busy, error: { key, seq } | null, secret, otpUri, signIn(email, password), submitNewPassword(pw, confirmation), confirmMfaSetup(code), submitTotp(code) }`. `busyRef` impide el doble envío. `otpUri` = `otpauth://totp/SIGMETUM-A:${encodeURIComponent(email)}?secret=${encodeURIComponent(secret)}&issuer=SIGMETUM-A`; solo se muestra como texto, nunca en `href` ni en `navigate`.
   - Validación en cliente (sin petición): campos vacíos → `login.requiredFields`; `meetsPasswordPolicy` falsa → `passwordPolicyError`; contraseñas distintas → `passwordMismatch`; código que no cumple `/^\d{6}$/` → `codeFormatError`.
   - Errores de `signIn`: reintentable (`network`, status ≥ 500, 429, los tres `__type` reintentables o un 4xx sin código) → `serviceUnavailable`; `NotAuthorizedException`, `UserNotFoundException`, `PasswordResetRequiredException` o `UserNotConfirmedException` → `credentialsError`; el resto, incluida la configuración vacía → `startError`.
   - Errores en los retos: reintentable → `serviceUnavailable` y se queda en el paso; `CodeMismatchException`, `ExpiredCodeException`, `EnableSoftwareTokenMFAException` o `ok: false` → `codeError` y se queda; `InvalidPasswordException` → `passwordRejected` y se queda; `NotAuthorizedException` → vuelve a `credentials` con `sessionExpired`; el resto → vuelve a `credentials` con `startError`.
   - Retos: `NEW_PASSWORD_REQUIRED` responde `{ USERNAME, NEW_PASSWORD }`; `MFA_SETUP` llama a `associateSoftwareToken`, luego `verifySoftwareToken` y luego `respondToChallenge('MFA_SETUP', session, { USERNAME })`; `SOFTWARE_TOKEN_MFA` responde `{ USERNAME, SOFTWARE_TOKEN_MFA_CODE }`; cualquier otro reto → `startError`.
   - `LoginForm`, estructura: tarjeta actual, `h1` `login.title` en `text-[#0C1811]` y un `h2` por reto con `tabIndex={-1}` y `focus-ring`; `form noValidate`; cada campo con el patrón `<label htmlFor={id}><span id={id+'-label'}>texto</span><input id={id} aria-labelledby={id+'-label'} required …/></label>` (evita avisos nuevos de jsx-a11y); clases de campos: `focus-ring`, `border-[#4B644A]` y texto `#0C1811`, sin placeholders; correo con `type="email" autoComplete="username" maxLength={254}`; contraseña con `autoComplete="current-password" maxLength={256}`; contraseña nueva y confirmación con `autoComplete="new-password"` y `aria-describedby` de la política; código con `autoComplete="one-time-code" inputMode="numeric" maxLength={6}`; error en `<p key={seq} id={errorId} role="alert">` referenciado en `aria-describedby` de los campos del paso; `<p role="status">` siempre presente, con `login.loading` mientras `busy`; `ButtonPrincipal type="submit" disabled={busy}`.
   - `LoginForm`, contraseñas y foco: `password` se vacía en el `finally` de `signIn`; contraseña nueva y código, tras cada petición; el foco va al `h2` al entrar en un reto y al campo de correo al volver a `credentials`; tras un error va a un campo (la contraseña en `credentials`; el primer campo en los demás pasos).
   - `LoginForm`, paso `mfaSetup`: secreto y URI en `<code className="break-all">`; el botón de copiar va **fuera del `form`** (`ButtonAlternative` no tiene `type`) y solo aparece si existe `navigator.clipboard?.writeText`; el resultado de copiar se anuncia en `role="status"` con `copied` o `copyFailed`. Al terminar: `navigate('/cargar-archivos', { replace: true })`. No hay enlaces.
   - Claves nuevas `login.*` (es / en):
     - `emailLabel`: Correo electrónico / Email
     - `passwordLabel`: Contraseña / Password
     - `allRequired`: Todos los campos son obligatorios. / All fields are required.
     - `requiredFields`: Rellena todos los campos. / Fill in all the fields.
     - `credentialsError`: El correo o la contraseña no son correctos. Si has hecho varios intentos seguidos, espera unos minutos antes de volver a probar. / The email or password is incorrect. If you have made several attempts in a row, wait a few minutes before trying again.
     - `loading`: Comprobando… / Checking…
     - `sessionExpired`: Ha pasado demasiado tiempo. Vuelve a iniciar sesión. / Too much time has passed. Please log in again.
     - `newPasswordTitle`: Elige una contraseña nueva / Choose a new password
     - `passwordPolicy`: Mínimo 14 caracteres, con mayúsculas, minúsculas, números y símbolos. / At least 14 characters, with uppercase and lowercase letters, numbers and symbols.
     - `newPasswordLabel`: Contraseña nueva / New password
     - `confirmPasswordLabel`: Repite la contraseña nueva / Repeat the new password
     - `passwordPolicyError`: La contraseña no cumple los requisitos. / The password does not meet the requirements.
     - `passwordMismatch`: Las contraseñas no coinciden. / The passwords do not match.
     - `passwordRejected`: El servicio no ha aceptado la contraseña. Elige otra que cumpla los requisitos. / The service did not accept the password. Choose another one that meets the requirements.
     - `continueButton`: Continuar / Continue
     - `mfaSetupTitle`: Configura la verificación en dos pasos / Set up two-step verification
     - `mfaSetupHelp`: Añade esta clave a tu aplicación de autenticación y escribe el código de seis dígitos que muestre. / Add this key to your authenticator app and enter the six-digit code it shows.
     - `secretLabel`: Clave / Key
     - `otpUriLabel`: Dirección para aplicaciones que la admitan / Address for apps that support it
     - `copyButton`: Copiar clave / Copy key
     - `copied`: Clave copiada. / Key copied.
     - `copyFailed`: No se pudo copiar. Selecciona la clave y cópiala a mano. / Could not copy. Select the key and copy it manually.
     - `totpTitle`: Verificación en dos pasos / Two-step verification
     - `codeLabel`: Código de seis dígitos / Six-digit code
     - `codeFormatError`: El código debe tener seis dígitos. / The code must have six digits.
     - `codeError`: El código no es correcto o ha caducado. Inténtalo de nuevo. / The code is incorrect or has expired. Please try again.
     - `verifyButton`: Verificar / Verify
     - Se reutilizan `title`, `logInButton`, `startError` y `serviceUnavailable`.
   - Comprobación (TDD; primero falla un test nuevo de `translations.test.js` que exige `login.credentialsError`, `sessionExpired`, `codeError`, `passwordRejected` y `serviceUnavailable`; después los de `LoginForm`): `LoginForm.test.js` usa `MemoryRouter`, `fetch` simulado y enrutado por `X-Amz-Target`, y el SRP real. Casos: estructura, `autocomplete` y que no hay enlaces; acceso con TOTP con el foco en el `h2` y los tokens guardados; las tres respuestas de credenciales dan el mismo texto; red, 500 y `TooManyRequests` dan `serviceUnavailable`; un código erróneo permite reintentar con un solo `InitiateAuth`; la sesión del reto caducada vuelve al primer paso con aviso; primer acceso completo (política, `InvalidPassword`, `MFA_SETUP` con un solo `Associate` y la copia anunciada); sin doble envío; espía de `console.*` y de `Storage.prototype.setItem`: ninguna llamada lleva la contraseña, el código ni el secreto, y `sessionStorage` queda vacío.
   - Norma: accesibilidad.md A3, A5, A7 y A12; DESIGN.md; buenas-practicas §3 y §7; seguridad.md S4.

8. **Retirar el Hosted UI sin huérfanos**
   - Archivos: borrar `src/pages/AuthCallback.js` y `AuthCallback.test.js`; modificar `src/App.js` (import y ruta), `src/hooks/useDocumentTitle.js` y su test (entrada `/auth/callback`), `es/translation.json` y `en/translation.json` (quitar `callbackLoading` y `callbackError`).
   - Firmas: `PAGE_TITLE_KEYS` pierde `/auth/callback`.
   - Comprobación: el test de `useDocumentTitle` pasa; `grep -rnE "auth/callback|AuthCallback|pkce|codeChallengeFor|buildAuthorizeUrl|takePkce|startLogin|redirectUri|logout_uri|exchangeCode|oauth2|COGNITO_DOMAIN|callbackLoading|callbackError|access_token|refresh_token|id_token" src .env.example vite.config.js` sin coincidencias; al cerrar la fase: `npm test -- --maxWorkers=2`, `npm run build` y `npm run lint` con 58 avisos o menos (si baja, se ajusta el tope).
   - Norma: spec, criterio 12; buenas-practicas §3.

## Fase 3: cierre técnico

9. **Medir y verificar el empaquetado real**
   - Archivos: ninguno; si bajan los avisos, `package.json` (`--max-warnings`).
   - Comprobación: `npm run build` y tamaño de `dist/assets/*.js` frente al del paso 1a; `grep -E "\bglobal\.TYPED_ARRAY_SUPPORT" dist/assets/*.js` sin coincidencias; `npm run dev` en segundo plano y `curl http://localhost:3000/src/index.js`; después, en `node_modules/.vite/deps/`, el fichero del paquete no contiene `\bglobal\.` y el de `react` no contiene `process.env.NODE_ENV` sin reemplazar; `npm run quality`, `npm audit --omit=dev` y `npm run docs:check` (el último lo deja en verde el tester). **Parar y avisar** si falla cualquier grep (criterio 15.5).
   - Norma: spec, criterios 15 y 19; buenas-practicas §14.

## A cargo del tester-documentador

- **Arquitectura y referencia:** `docs/01` (rutas sin `/auth/callback`, nuevo flujo de login); `docs/03` (acciones de `cognito-idp`, cabeceras, regla de `__type`, renovación y `RevokeToken`; quitar `/oauth2/token`); `docs/04` (quitar `AuthCallback`, describir `Login`); `docs/05` (`LoginForm`; `ProtectedRoute` con `api.logout`); `docs/06` (`VITE_COGNITO_USER_POOL_ID`, `useCognitoLogin`, `srp.js`, `passwordPolicy`, nuevo `session.js`); `docs/07` (claves `login.*` nuevas y retiradas).
- **Desarrollo y dependencias:** `docs/02` (`amazon-cognito-identity-js` 6.3.22, solo `AuthenticationHelper`, justificación, peso medido en los pasos 1 y 9, resultado de `npm audit`, el `define` de `vite.config.js`); `docs/08` (tabla de cobertura: `srp`, `passwordPolicy`, `LoginForm`; sale `AuthCallback`; variables; `npm test -- --maxWorkers=2`; nota de prueba en local: Cognito funciona, pero el backend de `dev` rechaza `localhost`).
- **Guías y estado:** `seguridad.md` S3 (SRP; PascalCase sin `IdToken`; contraseña, código y secreto solo en memoria; `RevokeToken` con 3 s; regla de `__type`; `LoginForm` sin acceso a tokens), S6 (la dependencia), S8 (`connect-src` a `https://cognito-idp.<región>.amazonaws.com` en vez de `/oauth2/token`) y su tabla de estado; `accesibilidad.md` A5, A7 (`h1` en el login) y A12; `docs/09`: fecha de hoy y métricas (`docs:check -- --metrics`), M1, M16 (diferencia de tamaño) y M20 (regla rehecha), verificación en `dev` (por confirmar). No escribir `eu-west-3` en `docs/` (término obsoleto según mantenimiento §4): usar `<región>`.
- **`para-infra.md`:** §3 entra `USER_POOL_ID` y sale `DOMAIN`; quitar la tabla de `redirect_uri`/`logout_uri` y su párrafo; cambiar la fila de CSP a `cognito-idp`; §1: I2, I4, I5 e I7 según infra; quitar `NODE_ENV = var.environment`; actualizar el commit de infra (sustituye a `19bdde3`); §8 punto 5: flujo SRP; duración de la sesión del reto (por confirmar); avisar a infra de que ya puede retirar `VITE_COGNITO_DOMAIN` y las direcciones de retorno.
- **`para-backend.md` y aviso de PR:** `para-backend.md` sin cambio de contrato; quitar Hosted UI y `/auth/callback`; señalar que su F18 está desactualizado. Aviso nuevo `docs/specs/2026-11/2026-11-10-cognito-srp-login-aviso-pr.md` con las áreas de contrato tocadas (`api.js`, `env.js`, `LoginForm`, `ProtectedRoute`, `.env.example`, `package.json`, `vite.config.js`), la integración (`para-infra` cambia), el orden (primero el `apply` de C18 y después la compilación del frontend) y la vuelta atrás (redesplegar la compilación anterior de Amplify).

## Pruebas

- Nuevas: `src/services/srp.test.js`, `src/utilities/passwordPolicy.test.js` y `src/components/LoginForm.test.js` (reescrito). Modificadas: `api.test.js`, `session.test.js`, `ProtectedRoute.test.js`, `useDocumentTitle.test.js`, `translations.test.js`. Se borra `AuthCallback.test.js`.
- Comando: `npm test -- --maxWorkers=2`, y después `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate`. `agentes:test` solo si se toca `plugins/` (no previsto).
- Sin automatizar **(por confirmar en dev)**: que el SRP sea correcto contra el pool real, el orden de los retos, el bloqueo por intentos, la CSP Report-Only y la duración de la sesión del reto.

## Cierre

- **Crítico: sí.** Coincide con «sesión y token (services/api.js, LoginForm, ProtectedRoute)», «dependencias», «accesibilidad» y «variables de entorno». No coincide con «contrato con el backend» (el `Bearer` no cambia) ni con «CI».
- Documentos de `integracion` afectados: `para-infra.md` (cambio real) y `para-backend.md` (solo texto).

## Plan B si el paso 1 para (para la puerta)

1. `aws-amplify` v6 (`aws-amplify/auth`): resuelve SRP y los retos, pero gestiona su propio almacén de tokens; exigiría un adaptador para conservar `token`/`refreshToken` (decisión 5) y pesa más. Es la única alternativa propuesta y necesita aprobación del usuario.
2. SRP propio con `BigInt` y Web Crypto: descartado (choca con el contrato de infra: «No se implementa SRP a mano»).

## Preguntas para la puerta humana

1. **Duración de la sesión del reto:** con 3 minutos por defecto, registrar el TOTP puede caducar. ¿Se pide a infra subir `auth_session_validity` (de 3 a 15 min)? No bloquea el plan.
2. **Regla de `console` en `quality-check`:** prohibir `console.` en `api.js`, `session.js`, `srp.js`, `useCognitoLogin.js` y `LoginForm.js` sería una línea, pero el criterio 14 lo deja fuera de alcance. ¿Se añade? Hoy lo cubren los tests espía y `no-console`, que solo avisa y permite `error` y `warn`.
3. **Cierre de sesión:** ¿es aceptable que tarde hasta 3 s antes de navegar? A cambio la revocación tiene tiempo de completarse.
