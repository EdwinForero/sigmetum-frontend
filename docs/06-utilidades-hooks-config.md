# 06. Utilidades, hooks, servicios y configuración

## Configuración (`src/config/`)

### `env.js`
Único punto de lectura de `import.meta.env`. Vite sustituye las variables `VITE_*` **en tiempo de build**: cambiarlas exige volver a compilar. Las variables sin el prefijo `VITE_` no llegan al navegador.

| Clave | Variable | Valor por defecto | Uso |
|---|---|---|---|
| `BASE_URL` | `VITE_BASE_URL` | `http://localhost:8000` | Origen del backend |
| `API_PREFIX` | `VITE_API_PREFIX` | `/api/v1` | Prefijo de versión (debe coincidir con el backend) |
| `S3_URL` | `VITE_S3_URL` | `''` | Base pública de S3 o CloudFront para los recursos estáticos. También se lee **al compilar** (`vite.config.js`) para el favicon: ver [Favicon](#favicon-viteconfigjs-y-faviconhtml) |
| `COGNITO_USER_POOL_ID` | `VITE_COGNITO_USER_POOL_ID` | `''` | Id del pool de Cognito, `<región>_<id>`: su prefijo es la región con la que `api.js` construye el endpoint `cognito-idp`, y la parte posterior al guion bajo entra en el cálculo SRP. Pública. Sin valor por defecto: en local el login no se puede probar, por diseño. Vacía o sin `_`: las llamadas a Cognito lanzan `{ type: 'config' }` sin hacer `fetch` |
| `COGNITO_CLIENT_ID` | `VITE_COGNITO_CLIENT_ID` | `''` | Id del cliente público de la app en el pool de Cognito (`ClientId` de las peticiones). Pública, sin secreto. Vacía: igual que la anterior |
| `CAROUSEL_IMAGE_KEYS` | `VITE_CAROUSEL_IMAGE_KEYS` | `[]` | Claves separadas por comas para `ImageCarrousel` (sin uso) |

### `assets.js`
Catálogo de claves de S3 de los recursos estáticos y la función `assetUrl`.

| Constante | Clave en S3 |
|---|---|
| `ASSETS.LOGO` | `assets/logos/app-logo.jpg` |
| `ASSETS.BANNER` | `assets/banners/home-banner.jpg` |
| `ASSETS.ABOUT` | `assets/about/about-us.jpg` |
| `ASSETS.GLOSSARY` | `assets/documents/glossary.pdf` |
| `ASSETS.LOGOS.UMA` | `assets/logos/UMA.jpg` |
| `ASSETS.LOGOS.UAL`, `UGR`, `UHU`, `UJA` | `assets/logos/other-universities/<SIGLA>.jpg` |
| `ASSETS.LOGOS.EFYVE`, `GEOSPACE`, `MAFO` | `assets/logos/collaborators/<NOMBRE>.jpg` |

`assetUrl(key)` → `` `${env.S3_URL}/${key}` ``. Para añadir un recurso: súbelo a esa ruta del bucket, añade la clave aquí y úsalo con `assetUrl(ASSETS.X)`. `ASSETS.LOGO` es además la **única fuente** de la clave del favicon (ver abajo): no se copia en ningún otro sitio.

### `routes.js` (`src/config/routes.js`)
Rutas de la SPA en inglés y kebab-case. `PRIVATE_PATHS` (`/upload-files`, `/manage-data`, `/manage-terms`, `/manage-gallery`, `/manage-recipients`) la usa `App` para `isPrivateRoute`; `LEGACY_REDIRECTS` (`/explorar`, `/galeria`, `/sobre-nosotros`, `/cargar-archivos`, `/administrar-datos` y `/administrar-contenido` hacia su ruta nueva; la última a `/manage-terms`) la usan `App` (una `<Route>` con `<Navigate replace to={to} />` por entrada) y `useDocumentTitle`. El destino sale siempre de esta tabla constante y no se conservan `?` ni `#` (S4). Las rutas españolas solo deben aparecer aquí y en los tests de redirección (`git grep --untracked -nE` o `rg -n`).

### `reveal.js` (`src/config/reveal.js`)
Valores únicos de la animación de aparición: `REVEAL = { durationMs: 450, distancePx: 12, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', staggerMs: 60, maxStaggered: 6, threshold: 0, rootMargin: '0px 0px -10% 0px' }` y `staggerDelay(i)` (`min(i, 5) × 60` ms). Es un módulo **puro** (sin JSX ni `import.meta.env`): `tailwind.config.js` lo importa desde Node como `./src/config/reveal.js` (con la extensión) para `transitionDuration.reveal`, `transitionTimingFunction.reveal` y la animación `page-fade`. Lo consume `Reveal` ([05](05-componentes.md#reveal)).

### `institutions.js` (`src/config/institutions.js`)
Datos de los logos institucionales, compartidos por `Footer` y `Home`: `UNIVERSITIES` (UMA, UAL, UGR, UHU y UJA; la primera es la líder del proyecto) y `ENTITIES` (EFYVE, 3D Geospace y Malagueña Forestal). Cada elemento es `{ id, url, asset }`: `url` es el enlace externo (todas `https://`; EFYVE responde 200 con `https`, comprobado el 12/11/2026, y su entrada de `KNOWN_DEBT` en `scripts/quality-check.mjs` se retiró), `asset` la clave de `ASSETS.LOGOS` y el nombre accesible sale de `institutions.<id>` en las traducciones. Los nombres de los colaboradores siguen fijos en `Home.js`.

### Favicon (`vite.config.js` y `faviconHtml`)
El `<link rel="icon">` ya no está en `index.html`: lo inyecta el plugin inline `sigmetum-favicon` de `vite.config.js` con `transformIndexHtml`, así que la primera petición del navegador ya va a la URL correcta y no depende de JavaScript (`Header` no toca el favicon). Actúa en `npm run build` y en `npm run dev`.

| Pieza | Qué hace |
|---|---|
| `faviconTags(s3Url, logoKey)` (`src/utilities/faviconHtml.js`) | Devuelve la etiqueta `<link rel="icon" href="<s3Url>/<logoKey>">` (sin `type`: el logo es JPEG y el navegador detecta el formato) o `[]` si `s3Url` no es una URL `https://` (vacía, `http://`, `//cdn...`, sin esquema o con espacios iniciales; la comparación es estricta y en minúsculas). La barra final no se normaliza, igual que `assetUrl`; **solo en eso es igual**: `assetUrl` no valida el esquema (con `VITE_S3_URL=http://...` el logo de la cabecera y demás recursos cargan en runtime) y solo el favicon exige `https://` (ver B20 en `docs/09`). `npm run quality` y `seguridad.md` solo detectan `http://` literales en el código, no el valor de una variable de entorno |
| `logoKeyFromSource(texto)` (`src/utilities/faviconHtml.js`) | Extrae la clave `LOGO` del texto de `src/config/assets.js` (lanza error si no la encuentra) |
| `isHttpsUrl(s3Url)` (`src/utilities/faviconHtml.js`) | `true` solo si `s3Url` es una cadena que empieza por `https://`; la usan `faviconTags` y el plugin |
| Plugin `sigmetum-favicon` | Guarda `VITE_S3_URL` en `configResolved` (mezcla `.env*` y `process.env`, que es donde Amplify la inyecta); si hay valor y no empieza por `https://`, avisa por la consola del build (`[sigmetum-favicon] VITE_S3_URL no empieza por https://: no se emite el favicon.`) sin romper el build (con la variable ausente o vacía no hay aviso). Solo si el valor es `https://`, lee `assets.js` como texto dentro de `transformIndexHtml` |

- `vite.config.js` no puede importar `assets.js` (importa `env.js`, que usa `import.meta.env`, no disponible al cargar la configuración), por eso lo lee como texto. Un test compara la clave extraída con `ASSETS.LOGO` real.
- **`VITE_S3_URL` también se usa al compilar.** **El favicon exige `https://`** (`seguridad.md` prohíbe los enlaces externos `http://`): un valor que no empiece por `https://` se trata como ausente. Sin ella (vacía, ausente o sin `https://`) el build no falla y `dist/index.html` no lleva ningún `rel="icon"`: el navegador usa el suyo por defecto. No hay icono de respaldo en `public/`.
- La lectura de `assets.js` es diferida para que Vitest, que usa esta misma configuración, no la toque. Un cambio de formato en la línea `LOGO:` haría fallar `dev` y `build` (en voz alta), no `npm test`.

## Servicio HTTP (`src/services/api.js`)

Documentado en [03-api.md](03-api.md#métodos-del-cliente). Resumen:

| Función interna | Descripción |
|---|---|
| `request(path, options, { authenticated })` | `fetch` a `BASE_URL + API_PREFIX + path`. Con `authenticated` añade `Bearer ${getAccessToken()}` en cada intento (nada si no hay token). Convierte los fallos de red en `Error('network_error')`, parsea el JSON y lanza un error si `!response.ok \|\| !json.success`. Devuelve `json.data`. Con token: reintenta el `503` de autenticación (`RETRY_DELAYS_MS = [1000, 3000]`) y ante `401` renueva la sesión una vez y repite |
| `cognitoEndpoint()` / `cognito(action, payload)` | La región (prefijo del id de pool) debe cumplir `/^[a-z]{2}(-[a-z]+)+-\d$/`; si no, o sin `_` o sin cliente, es un error de configuración sin `fetch`. `POST https://cognito-idp.<región>.amazonaws.com/` con `Content-Type: application/x-amz-json-1.1` y `X-Amz-Target: AWSCognitoIdentityProviderService.<acción>`, sin secreto ni `Authorization` y sin el envoltorio `{ success, data }`. Errores: `{ type: 'cognito', status, code }` (el `__type` normalizado; nunca el `message`), `{ type: 'config' }` o `network` |
| `isRetryableAuthError(error)` (exportada) | Lista blanca de fallos que no significan «credencial rechazada» (red, configuración vacía, `5xx`, `429`, `TooManyRequestsException`, `LimitExceededException`, `InternalErrorException`, `4xx` sin `__type`). La usan `renewSession` y `useCognitoLogin` |
| `renewSession()` / `refreshSession()` | Renovación con `InitiateAuth` (`REFRESH_TOKEN_AUTH`). Si `getRefreshToken()` cambió mientras esperaba la respuesta (carrera con `logout`), no guarda los tokens: devuelve `false` sin redirigir (decisión **(por confirmar)**, B31 en [09](09-estado-actual-y-deuda-tecnica.md)). `refreshSession` comparte una única promesa (`refreshing`) entre las llamadas con `401` simultáneas; solo ella borra la sesión y va a `/login` si falla. Solo los fallos de la lista blanca la conservan; cualquier otro `__type` de un `4xx` la cierra |
| `api.signIn`, `respondToChallenge`, `associateSoftwareToken`, `verifySoftwareToken` | Acceso por SRP y retos (ver [03](03-api.md#métodos-del-cliente)); `settle` guarda el `AuthenticationResult` con `saveTokens` |
| `api.logout()` | Lee el refresco, `clearSession()`, `RevokeToken` con `Promise.race` de 3 s (`REVOKE_TIMEOUT_MS`; un fallo no impide cerrar) y `window.location.assign('/')`. El temporizador de 3 s queda pendiente aunque la revocación acabe antes (inocuo) |

### Sesión (`src/services/session.js`)

Único archivo que escribe `localStorage` (`token` = acceso y `refreshToken`); `api.js` y `ProtectedRoute` lo usan, nunca al revés (`api.js` importa `session.js`). Ya no hay `sessionStorage` ni PKCE. Exportaciones con nombre:

| Exporta | Descripción |
|---|---|
| `getAccessToken()`, `getRefreshToken()` | Lectura de `localStorage` |
| `saveTokens({ AccessToken, RefreshToken })` | Claves en PascalCase, como las devuelve Cognito. Guarda el de acceso; el de refresco solo si viene (si no, conserva el anterior). Nunca guarda el `IdToken` |
| `clearSession()` | Borra los dos tokens |

### Cálculo SRP (`src/services/srp.js`)

Sin red ni almacenamiento. Usa solo `AuthenticationHelper` de `amazon-cognito-identity-js` (importado de la raíz); la firma y la fecha las calcula el proyecto con Web Crypto. `poolName` es la parte del id de pool posterior al guion bajo (igual que `CognitoUserPool.getUserPoolName` del paquete); el mismo valor entra en el cálculo de x y en la firma.

| Exporta | Descripción |
|---|---|
| `srpTimestamp(date)` | `'Mon Nov 9 07:05:03 UTC 2026'`: UTC, día sin cero delante, hora, minutos y segundos con dos dígitos |
| `passwordClaimSignature({ hkdf, poolName, userId, secretBlock, timestamp })` | HMAC-SHA256 (Web Crypto) sobre `poolName + userId + secretBlock (base64 decodificado) + timestamp`, en base64 |
| `srpStart(poolName)` | `{ helper, srpA }` (A en hexadecimal) |
| `srpPasswordVerifier(helper, poolName, password, challengeParameters, date)` | `{ USERNAME: USER_ID_FOR_SRP, PASSWORD_CLAIM_SECRET_BLOCK, PASSWORD_CLAIM_SIGNATURE, TIMESTAMP }`. Ya no cede turno: lo hace `api.signIn` con `await sleep(0)` (un turno real, antes de `srpStart`) para que «Comprobando…» pueda pintarse antes del cálculo; que se pinte **(por confirmar en un navegador)**. B y la sal se crean con `helper.N.constructor` (el `BigInteger` del paquete, que no se exporta). No devuelve ni conserva la contraseña |

El test de `srp.js` usa como oráculo `CognitoUser.authenticateUser` del propio paquete **solo en el test** (`SRP_A`, `TIMESTAMP` y firma idénticos byte a byte). Que el SRP sea correcto contra el pool real **(por confirmar en `dev`)**.

## Hooks

### `useDialog()` (`src/hooks/useDialog.js`)
Estado estándar de un diálogo `DialogAdvice`. Desde la auditoría de las páginas privadas solo lo usan los diálogos de confirmación (`DataManagement`, `TermsManager`, `ImageGalleryManager`) y la decisión de campos vacíos de `FileUpload`; `ContactForm`, `Explore` y `FileDropdown` ya no lo usan.

| Devuelve | Descripción |
|---|---|
| `dialog` | `{ visible, title, message, details, onConfirm, onCancel }` |
| `showDialog(title, message, { details?, onConfirm?, onCancel? })` | Abre el diálogo. `onCancel` permite al llamador saber que el usuario lo cerró sin confirmar (la subida de archivos lo usa para cancelar el borrador) |
| `closeDialog()` | Lo cierra y reinicia el estado |

Patrón de uso:

```jsx
const { dialog, showDialog, closeDialog } = useDialog();
// ...
<AnimatePresence>
  {dialog.visible && (
    <DialogAdvice dialogTitle={dialog.title} dialogMessage={dialog.message} onClose={closeDialog} />
  )}
</AnimatePresence>
```

### Acceso con Cognito (`src/hooks/useCognitoLogin.js`)
`useCognitoLogin({ onAuthenticated })` devuelve `{ step, busy, error: { key, seq } | null, secret, otpUri, mfaSetupAgain, retry, signIn, submitNewPassword, confirmMfaSetup, submitTotp }`. Pasos: `credentials`, `newPassword`, `mfaSetup` y `totp`. No toca tokens (los guarda `api`) ni guarda la contraseña en un `ref` del hook, pero esta sí pasa por el estado de React del formulario durante el SRP y la petición (visible en React DevTools, B29 en [09](09-estado-actual-y-deuda-tecnica.md)); la `Session` y el `USER_ID_FOR_SRP` en los `ref` tampoco son secretos frente a las herramientas del navegador.

| Aspecto | Descripción |
|---|---|
| Estado interno | La `Session` del reto y el `USER_ID_FOR_SRP` van en `useRef`; el secreto TOTP, en estado porque se muestra. `busyRef` impide el doble envío en el mismo tick; `mountedRef` evita actualizar el estado tras desmontar (compatible con `StrictMode`). `AssociateSoftwareToken` se llama desde el manejador del reto, no desde un efecto |
| Validación sin petición | Campos vacíos: `login.requiredFields`; contraseña que no cumple `meetsPasswordPolicy`: `passwordPolicyError`; no coinciden: `passwordMismatch`; código que (tras quitar los espacios, `cleanCode`) no son seis dígitos: `codeFormatError`. El código enviado es el ya limpio |
| `retry` | `null`, `'associate'` o `'respond'` (ref y estado). `'associate'`: `AssociateSoftwareToken` falló de forma reintentable (red, `5xx` o `429`, también cuando `MFA_SETUP` llega directo de `signIn`); el hook pasa a `mfaSetup` sin secreto, con `serviceUnavailable`, y `confirmMfaSetup` repite **solo** `AssociateSoftwareToken` con la `Session` del `MFA_SETUP` (nunca reenvía `NEW_PASSWORD`). Un `NotAuthorizedException` en esa llamada da `sessionExpired`. `'respond'`: `VerifySoftwareToken` ya fue bien y el `RespondToAuthChallenge('MFA_SETUP')` final falló de forma reintentable; el reintento repite solo la respuesta, sin otro código. Un `CodeMismatch`/`Expired` en el reintento limpia `retry` y vuelve el campo del código. Un `SecretCode` ausente en la respuesta es `startError` |
| Errores de `signIn` | Reintentable: `serviceUnavailable`; `NotAuthorizedException`, `UserNotFoundException`, `PasswordResetRequiredException` o `UserNotConfirmedException`: `credentialsError` (mismo texto, sin revelar si el usuario existe); el resto, incluida la configuración vacía y un `200` sin tokens ni reto: `startError` |
| Errores en los retos | Reintentable: `serviceUnavailable` y se queda; `CodeMismatchException`, `ExpiredCodeException`, `EnableSoftwareTokenMFAException` o `ok: false`: `codeError`; `InvalidPasswordException`: `passwordRejected`; `NotAuthorizedException`: vuelve a `credentials` con `sessionExpired` (o `codeSessionLost` si hubo un código erróneo antes, porque Cognito puede invalidar la `Session` tras un `CodeMismatchException`, **(por confirmar en `dev`)**); el resto: vuelve con `startError` |
| Retos | `NEW_PASSWORD_REQUIRED` responde `{ USERNAME, NEW_PASSWORD }`; `MFA_SETUP`: `associateSoftwareToken`, `verifySoftwareToken` y `respondToChallenge('MFA_SETUP')`; `SOFTWARE_TOKEN_MFA` responde con el código. Cualquier otro reto: `startError`. Un `MFA_SETUP` repetido genera otro secreto (`mfaSetupAgain`). Se asume que no hay `requiredAttributes` en `NEW_PASSWORD_REQUIRED` (**por confirmar en `dev`**) |
| `otpUri` | `otpauth://totp/SIGMETUM-A:<correo>?secret=…&issuer=SIGMETUM-A` (con `encodeURIComponent`); ya no se pinta como texto: solo alimenta el QR (`QrCode`), nunca va en `href` ni en `navigate` |

### `useToast()` (`src/hooks/useToast.js`)
Avisos no modales. Exporta `ToastContext` (valor por defecto `null`) y el hook `useToast()`, que devuelve `{ notifySuccess(message), notifyError(message) }` y **lanza un error** si se usa fuera de `ToastProvider` (ver [05](05-componentes.md#toastprovider)). Reparto de los mensajes: éxitos de los tres gestores, `FileUpload`, `ContactForm` y las acciones de `DataManagement` → `notifySuccess` (`role="status"`, se cierra solo a los 8 s con pausa); errores de los gestores y de `Explore` → `notifyError` (`role="alert"`, persistente); validaciones y errores de un campo o de una tarjeta → `InlineError`; borrados → `DialogAdvice` de confirmación. Los tests de los componentes que lo usan se envuelven en `ToastProvider`.

### `useDialogFocus(isOpen, onClose)` (`src/hooks/useDialogFocus.js`)
Gestiona el foco de un diálogo modal (A6) y devuelve la `ref` de su caja, que debe llevar `tabIndex={-1}`. Lo usan `DialogAdvice`, `DialogSpecies` y `GalleryViewer`; un diálogo nuevo debe reutilizarlo.

| Comportamiento | Descripción |
|---|---|
| Al abrir (`isOpen` pasa a `true`) | Guarda `document.activeElement` como origen y enfoca la caja con `preventScroll` (empieza fuera de pantalla). El foco va a la caja y no al primer botón, para que Enter no confirme sin querer |
| `keydown` en `document` | `Escape` llama a `onClose` (la última versión, vía `ref`, porque `onClose` cambia en cada render de `FileUpload`). `Tab` y `Shift+Tab` se atrapan entre el primer y el último elemento enfocable (`a[href]`, botones, campos, `summary` y `[tabindex]` distinto de `-1`); si el foco está fuera de la caja, entra por el primero o el último. `Shift+Tab` desde la propia caja o desde un elemento del diálogo que no es de esa lista (por ejemplo, un contenedor con scroll enfocable) va al último control. Ignora el evento si `defaultPrevented` |
| Diálogos anidados | Una pila a nivel de módulo registra los diálogos abiertos: solo atiende el teclado el último abierto, así que Escape y Tab actúan solo sobre el de encima |
| Al cerrar o desmontar | Quita el listener, saca el diálogo de la pila y devuelve el foco al origen si sigue en el documento y no es `body`; si no (el origen se desmontó, o fue un clic en algo no enfocable, como la ficha de `SpeciesCard`), pone `tabindex="-1"` al `main` si no lo tiene y le da el foco. Si no hay `main`, el foco se pierde. El `tabindex="-1"` del `main` queda permanente (ver B26 en [09](09-estado-actual-y-deuda-tecnica.md)) |

Con `AnimatePresence`, el llamador pasa `isOpen && useIsPresent()` (Framer Motion) para que el listener y la trampa se desactiven mientras el diálogo sale.
### `useDocumentTitle()` (`src/hooks/useDocumentTitle.js`)
Pone `document.title` con el formato `` `${t(clave)} · SIGMETUM-A` `` según la ruta mostrada. `App` lo llama **una vez**; no se llama en cada página porque `ProtectedRoute` puede mostrar el spinner o redirigir y el título quedaría desfasado.

| Exporta | Descripción |
|---|---|
| `PAGE_TITLE_KEYS` | Mapa ruta → clave de traducción (tabla en [04](04-paginas.md#título-de-página-por-ruta)) |
| `titleKeyFor(pathname)` | Resuelve primero una ruta antigua de `LEGACY_REDIRECTS` a su destino (durante la redirección no se ve el título del 404) y después la clave con `matchPath` (sin distinguir mayúsculas y con o sin barra final); si ninguna ruta coincide, `notFound.title`. `/manage-terms`, `/manage-gallery` y `/manage-recipients` usan `contentManagement.noLatinTermsTitle`, `contentManagement.galleryManagementTitle` y `contactRecipients.title` |
| `useDocumentTitle()` (por defecto) | Efecto con dependencias `[t, key]`: se recalcula al navegar y al cambiar de idioma (en react-i18next `t` cambia de identidad con el idioma) |

Al añadir una ruta en `App.js` hay que añadirla a `PAGE_TITLE_KEYS`: un test lee `App.js` y falla si falta alguna.

## Utilidades

### `noticeStyles.js` (`NOTICE_BASE` y `noticeVariant(variant)`)
Sistema de avisos único. `NOTICE_BASE` (`flex items-start gap-2 rounded-lg border p-stack-md`) es la caja; `noticeVariant` devuelve `{ box, icon, iconClass }` para `info` (`border-moss`, icono `info`), `success` (`border-brand-deep`, `check_circle`), `warning` (`border-warning`, `warning`) y `error` (`border-danger text-danger`, `error`), y `info` si la variante no existe. Todas llevan `bg-surface`, borde de 1 px y texto `ink` (`danger` en el error), sin fondos tintados. Lo usan `InlineError`, `InfoButton`, `ToastProvider`, `DialogAdvice` y `LoginForm`; el banner de cookies usa los mismos tokens (`border-moss bg-surface text-ink`) sin importarlo.

### `validateContact({ username, email, subject, message })` (`validateContact.js`)
Validación en cliente de `ContactForm`: aplica `trim` y devuelve `{ [campo]: { key, count? } }` solo con los campos inválidos, sin mutar la entrada. Campos vacíos: `form.errors.required`; correo: `form.errors.email` si no cumple la expresión fija `/^[^s@]+@[^s@]+.[^s@]+$/`; mensaje: `form.errors.minLength` con `count` si tiene menos de `MESSAGE_MIN_LENGTH` (20) caracteres. **No sustituye a la validación del servidor** (S5): el backend sigue siendo la autoridad y su límite propio para el mensaje es **(por confirmar)**.

### `photoName(fileName)` (`photoName.js`)
Nombre legible de una foto de la galería: quita la extensión y cambia los `_` por espacios; devuelve `''` con `null` o `undefined`. Lo usan `VegetationGallery` (pie, `alt` y nombre accesible del botón) y `GalleryViewer` (título y `alt`).

### `isSafeImageUrl(url)` (`isSafeImageUrl.js`)
Devuelve `true` solo si la URL se analiza con `new URL` (dentro de un `try/catch`) y su protocolo es `https:`, o `http:` con host `localhost` o `127.0.0.1` (desarrollo). Con cualquier otra cosa (otro host con `http:`, `javascript:`, `data:`, texto que no es una URL, cadena vacía, `null` o `undefined`) devuelve `false`. La usan `ImageGalleryManager` (miniaturas), `VegetationGallery` (fotos) y `GalleryViewer` (visor): si da `false` no se pide la imagen y queda una caja vacía ([seguridad](guias/seguridad.md), S7). Es una defensa en profundidad: las URL vienen prefirmadas del backend. Cubierta por `isSafeImageUrl.test.js`.

### `validateRecipientEmail(value, list)` (`validateRecipientEmail.js`)
Regla de correo del panel de destinatarios, solo por usabilidad (manda el servidor). Devuelve `null` o `'required'` (vacío tras `trim`), `'email'` (formato, más de 254 caracteres o caracteres de control `/[\p{Cc}\u2028\u2029]/u`) o `'duplicate'` (ya está en `list`, sin distinguir mayúsculas ni espacios). Exporta `RECIPIENT_EMAIL_PATTERN` (**copia literal** de la expresión de `validateContactMessage.js` del backend, con un comentario que la cita: si el backend la cambia, hay que cambiarla aquí), `EMAIL_MAX_LENGTH = 254`, `RECIPIENTS_MIN = 1`, `RECIPIENTS_MAX = 5` y `normalizeEmail(s)` (`trim` y minúsculas). No muta la lista. La usa `ContactRecipientsManager` ([05](05-componentes.md#contactrecipientsmanager)); cubierta por los casos de `send-email.test.js` del backend (`a(b)@x.com`, `o'brien@…`, coma, 255 caracteres, `nombre+tag@sub.dominio.es`).

### `galleryColumns(width)` y `splitInColumns(items, columns)` (`galleryLayout.js`)
Rejilla de `VegetationGallery`. `GALLERY_MAX_CELL = 200` y `GALLERY_GAP = 12`; `galleryColumns(width) = max(1, ceil((width + 12) / 212))` (1 si no es un número finito), de modo que la celda mide como mucho 200 px por construcción: 343, 705, 945, 1361 y 1841 px dan 2, 4, 5, 7 y 9 columnas. `splitInColumns` reparte en **bloques contiguos equilibrados** (las primeras `N % n` columnas reciben `⌈N/n⌉` elementos y el resto `⌊N/n⌋`) y devuelve `{ start, items }` por columna, sin las vacías; el orden concatenado es el de los datos y no muta la lista.

### `ipniUrl(name)` (`ipniUrl.js`)
Enlace «Leer más» a IPNI, el único sitio donde vive el formato (IPNI ya cambió la URL una vez). `IPNI_SEARCH_URL = 'https://www.ipni.org/search?q='`. `ipniQuery(name, variant)` con `variant` igual a `'asIs'` (nombre recortado), `'noAuthor'` (género, epíteto y el primer `subsp.`/`var.`/`f.` con su epíteto, sin el autor) o `'binomial'` (género y epíteto). `IPNI_VARIANT = 'noAuthor'`, fijada el 12/11/2026 con la medición de 20 nombres **de ejemplo** (ver [09](09-estado-actual-y-deuda-tecnica.md)); con datos reales **(por confirmar)**. `ipniUrl` devuelve `null` si el nombre no es una cadena o queda vacío y, si no, `IPNI_SEARCH_URL + encodeURIComponent(consulta)`. La usa `DialogSpecies` ([05](05-componentes.md#dialogspecies)); seguridad en [S4](guias/seguridad.md#s4-enlaces-y-navegación).

### `ipniCheck.js` (lógica pura de `scripts/ipni-check.mjs`)
`flattenSpecies(data)` (aplana `Especies Características`, cadena o array, sin duplicados y ordenado; lanza si `data` no es un array), `sampleNames(names, size)` (hasta 5 nombres abreviados `J. macrocarpa` y el resto a intervalos regulares), `normalizeName`, `classifyResult(searched, response)` (devuelve un **objeto** `{ status, total }` con `status` igual a `'exact'`, `'approx'`, `'zero'` o `'unknown'`; con cero resultados la API **no** trae `results`), `buildGenusMap` y `expandGenus` (la inicial se expande solo si tiene un único género en el dataset). Vive en `src/` porque Vitest solo recoge `src/**`; el script es un envoltorio fino con red ([08](08-guia-desarrollo.md#scripts-manuales-fuera-de-la-ci)).

### `meetsPasswordPolicy(password)` (`passwordPolicy.js`)
Ayuda en cliente que replica la política del pool: devuelve `true` con 14 caracteres o más y con minúsculas, mayúsculas, números y símbolos. Cognito es la autoridad: solo evita una petición que se sabe que será rechazada (sus rechazos se tratan como `passwordRejected`).

### `watchIconFont(doc = document)` (`iconFont.js`)
Marca `<html>` según el estado de la fuente de iconos (Material Symbols, de Google Fonts); `src/index.js` la llama una vez tras montar la aplicación. Llama a `doc.fonts.load('24px "Material Symbols Outlined"', 'close')`, con una ligadura como texto porque `load()` sin texto comprueba `" "` y una fuente con subconjunto podría no incluirlo (en la petición real con `icon_names` el `@font-face` no trae `unicode-range`, así que `U+0020` está incluido; ver [07](07-i18n-y-estilos.md#fuentes-e-iconos)). La carga compite con un límite de `FONT_TIMEOUT_MS` (4000 ms, exportado) mediante `Promise.race`: con al menos una cara añade `icons-ready`; con `[]`, con un rechazo o si gana el límite, añade `icons-failed` (salvo que ya esté `icons-ready`); si no existe `doc.fonts`, `icons-ready`. Si la fuente llega después del límite, `icons-ready` se impone y retira `icons-failed`: las dos clases nunca conviven. `src/index.css` oculta los iconos hasta que haya una de las dos clases y, con `icons-failed`, pinta una caja en lugar del texto de la ligadura. Probada en `iconFont.test.js`.

### `formatSecret(secret)` (`formatSecret.js`)
Devuelve la clave del MFA en grupos de 4 caracteres separados por espacios (`secret.match(/.{1,4}/g)?.join(' ') ?? ''`): 16 caracteres dan 4 grupos, 17 dejan el último de 1 y una clave vacía o ausente da `''`. Solo es para pintar en `LoginForm`: «Copiar clave» copia el secreto **sin espacios**; quien seleccione la clave a mano copia los espacios (las aplicaciones habituales los aceptan, **por confirmar**). Está en `NO_CONSOLE_FILES`.

### `convertToXLSX(data)` (`CSVfunctions.js`)
Crea un libro de SheetJS con una hoja `Sigmetum-A` a partir de un array de objetos (`json_to_sheet`).

### `downloadXLSX(filteredData)` (`CSVfunctions.js`)
1. Crea copias de las filas y convierte cada valor array en una cadena `'a, b, c'`. **No modifica los datos originales** (corregido en A2).
2. Genera el libro con `convertToXLSX`, lo escribe como `ArrayBuffer` y crea un `Blob`.
3. Crea un enlace temporal con `download="Sigmetum-A.xlsx"`, lo pulsa y lo retira. No libera la URL con `URL.revokeObjectURL`.

### `highlightTerms(text, terms)` (`highlightTerms.js`)
Divide un nombre científico en fragmentos `{ text, isItalic }` para pintar en redonda los términos no latinos (`subsp.`, `var.`...) y en cursiva el resto.

| Entrada | Salida |
|---|---|
| Sin términos o lista vacía | `[{ text, isItalic: true }]` |
| `terms` como `[{ term }]` (respuesta de la API) o como cadenas | Se aceptan ambos formatos |
| Términos con `.`, `(`, `+`, etc. | Se escapan: el punto es literal y un paréntesis sin cerrar no lanza error |

Lo usan `SpeciesCard` y `DialogSpecies`.

### `FormatFileName(fileName)` (`FormatFileName.js`)
Convierte el nombre técnico de una versión en un texto legible.

Usa el formato real del backend, `AAAA-MM-DD_vN.xlsx`, buscado **al final** del nombre (con o sin ruta delante).

| Entrada | Salida |
|---|---|
| `2026-09-15_v3.xlsx`, `2026-09-15_v10.xlsx` | `15/09/2026 · V3`, `15/09/2026 · V10` |
| `data/Malaga/2026-09-15_v3.xlsx` | `15/09/2026 · V3` |
| Cualquier nombre que no siga el patrón | El mismo nombre sin cambios |

Expresión: `(\d{4})-(\d{2})-(\d{2})_v(\d+)\.xlsx$`. Si el `name` real de `GET /list-files` lleva o no ruta **(por confirmar)**; ambos casos están cubiertos por los tests.

### `SortItemsList(items)` (`SortItemsList.js`)
Ordena **en el propio array** (usa `sort`, que muta) con estas reglas:
- Los textos van antes que los números.
- Los textos se ordenan con `localeCompare` sin distinguir mayúsculas ni acentos (`sensitivity: 'base'`).
- Los números se ordenan de menor a mayor.

Ejemplo: `['300', 'roble', '1200', 'Alcornoque']` → `['Alcornoque', 'roble', '300', '1200']`.
