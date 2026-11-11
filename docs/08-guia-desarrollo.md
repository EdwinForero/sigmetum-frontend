# 08. Guía de desarrollo

## Requisitos

- Node.js 22 o superior (`engines.node` de `package.json` es `>=22`; es la versión que fija el build de Amplify) y npm. Con nvm, `nvm use` lee `.nvmrc` (contiene `22`). La CI prueba también Node 24. `jsdom` se mantiene en la 26 por cambio mínimo; valorar subirlo está en M19 de [09](09-estado-actual-y-deuda-tecnica.md).
- El backend `sigmetum-backend` arrancado en local o una URL de un entorno desplegado.
- Acceso de lectura al bucket de S3 o a su CloudFront para ver logos, banner y glosario.

## Puesta en marcha

```bash
git clone <repo> sigmetum-frontend
cd sigmetum-frontend
npm ci
cp .env.example .env        # y rellena los valores
npm run dev                 # http://localhost:3000
```

### Variables de entorno (`.env`)

| Variable | Obligatoria | Ejemplo | Descripción |
|---|---|---|---|
| `VITE_BASE_URL` | Sí | `http://localhost:8000` | Origen del backend, sin barra final |
| `VITE_API_PREFIX` | Sí | `/api/v1` | Debe coincidir con `API_PREFIX` del backend |
| `VITE_S3_URL` | Sí | URL pública desde la que se sirven los `assets/…` (CloudFront, ver [integración con infraestructura](integracion/para-infra.md)) | Base pública de los recursos estáticos |
| `VITE_COGNITO_USER_POOL_ID` | Sí para el login (solo en la rama de Amplify; en local no se define) | `<región>_<id-del-pool>` | Id del pool de Cognito: su prefijo es la región del endpoint `cognito-idp`. Pública. Cognito en sí sí responde desde `localhost` (el login ya no usa direcciones de retorno), pero **el backend de `dev` rechaza el origen `localhost`**, así que desde local el resto de llamadas no funcionará; además `crypto.subtle` exige HTTPS o `localhost` (por la IP de la red local, el acceso daría `startError`) |
| `VITE_COGNITO_CLIENT_ID` | Igual | `<id-del-cliente-publico>` | Id del cliente público de Cognito (sin secreto), `ClientId` del acceso SRP y de la renovación. Pública |
| `VITE_CAROUSEL_IMAGE_KEYS` | No | `gallery/a.jpg,gallery/b.jpg` | Solo para el carrusel, que no se usa |

- `.env` está en `.gitignore`: nunca lo subas al repositorio.
- **`VITE_S3_URL` también se lee al compilar `index.html`:** el plugin `sigmetum-favicon` de `vite.config.js` la usa para inyectar el favicon (`VITE_S3_URL` + `/` + `ASSETS.LOGO`). Debe empezar por `https://`: un valor que no lo haga se trata como ausente y el build lo avisa en la consola (`[sigmetum-favicon] ...`). Si falta, está vacía o no empieza por `https://`, el build no falla pero `dist/index.html` queda **sin favicon** (sin icono de respaldo); lo mismo en `npm run dev` si tu `.env` no la define. Detalle en [06](06-utilidades-hooks-config.md#favicon-viteconfigjs-y-faviconhtml). Para probar el build sin ella sin tocar tu `.env`, una variable de proceso vacía lo pisa: `VITE_S3_URL= npx vite build --outDir <carpeta-temporal> --emptyOutDir`.
- Vite incrusta estas variables en el JavaScript al compilar y solo expone las que empiezan por `VITE_`. **Todo lo que pongas aquí es público**: no guardes secretos.
- Si vienes de la versión anterior (Create React App), renombra las claves de tu `.env` de `REACT_APP_*` a `VITE_*`.
- El backend debe tener `ALLOWED_ORIGIN` apuntando al origen del frontend (por ejemplo `http://localhost:3000`) o el navegador bloqueará las peticiones por CORS.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` (o `npm start`) | Servidor de desarrollo con recarga en caliente en el puerto 3000 |
| `npm run build` | Build de producción optimizado en `dist/` |
| `npm run preview` | Sirve `dist/` en local para probar el build |
| `npm test` | Ejecuta todos los tests una vez (Vitest). En un equipo con poca memoria virtual libre y muchos núcleos puede morir con `heap out of memory` y `Channel closed` (un worker por núcleo): usa `npm test -- --maxWorkers=2` (observado en un equipo de 16 núcleos; el 09/11/2026 pasó con 4 y el 10/11/2026 se usó 2). Los tests del SRP real tardan ~400 ms cada uno en jsdom: los de `srp.test.js` y `LoginForm.test.js` llevan un tope de 15 s |
| `npm run test:watch` | Tests en modo observación |
| `npm run lint` | ESLint. Falla si hay errores o si los avisos superan el tope fijado en el script (`--max-warnings`). Al corregir avisos, se baja el tope |
| `npm run quality` | Puerta de calidad y seguridad: patrones prohibidos, secretos, `npm audit` de producción y ESLint. El almacenamiento del navegador (`localStorage`, `sessionStorage`) y las funciones de token (`getAccessToken`, `getRefreshToken`, `saveTokens`, `clearSession`) solo se permiten en `services/api.js`, `services/session.js` y `ProtectedRoute`. Además prohíbe `console.*` en `api.js`, `session.js`, `srp.js`, `useCognitoLogin.js` `LoginForm.js`, `QrCode.js` y `formatSecret.js`, que manejan contraseñas, códigos, secretos y tokens (`NO_CONSOLE_FILES` en `scripts/quality-check.mjs`) |
| `npm run docs:check` | Comprueba que la documentación no se ha quedado atrás respecto al código (ver [mantenimiento.md](guias/mantenimiento.md)) |
| `npm run docs:gate` | Cierre documental del ciclo (plugin `ciclo-agentico`): comprueba, contra `.claude/flujo.json` y `git status`, que se tocaron los documentos de cada área, que `docs/09` tiene la fecha de hoy y que hay aviso para PR si se tocó un área de contrato. Se ejecuta antes del commit; no está en la CI |
| `npm run agentes:test` | Tests (`node:test`) del plugin `ciclo-agentico` en `plugins/`. Vitest no los recoge (`test.include` en `vite.config.js`) |
| `npm run agentes:bootstrap` | Comprueba e instala, pidiendo confirmación, las dependencias del plugin y los plugins del marketplace local (`-- --dry-run` solo informa) |

## Despliegue

Según `sigmetum-infra`, el frontend se despliega con **AWS Amplify** (región `eu-west-1`, dominio `sigmetum-a.org`), con compilación automática en cada push a la rama configurada. El frontend ya es un proyecto Vite, como espera el `build_spec` de Terraform, pero el módulo de Amplify sigue pendiente de ajustes: ver el hallazgo [A5](09-estado-actual-y-deuda-tecnica.md#prioridad-alta-pendiente).

Checklist para que un despliegue funcione:

1. Directorio de artefactos: `dist` (coincide con el `build_spec` de `sigmetum-infra`).
2. Variables de entorno de Amplify con los nombres que lee el código: `VITE_BASE_URL`, `VITE_API_PREFIX`, `VITE_S3_URL` y, para el login, `VITE_COGNITO_USER_POOL_ID` y `VITE_COGNITO_CLIENT_ID` (solo en la rama). **`sigmetum-infra` solo define `VITE_API_URL`**, que este código no lee: hay que ajustar el módulo de Amplify.
3. Regla de reescritura de la SPA: origen `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|pdf)$)([^.]+$)/>`, destino `/index.html`, tipo `200`.
4. Recursos estáticos accesibles: CloudFront con OAC delante del bucket y `VITE_S3_URL` apuntando a esa distribución. `VITE_S3_URL` debe estar definida **en el build** de Amplify: de ella sale también el favicon (sin ella no hay favicon). Debe empezar por `https://` (si no, se trata como ausente y el build avisa) y cambiarla exige un nuevo despliegue.
5. `ALLOWED_ORIGIN` del backend igual al dominio final.

## Convenciones del código

Es un resumen. Las normas completas, con el motivo y cómo se comprueban, están en las [guías de trabajo](README.md#guías-de-trabajo).

- **Componentes:** funcionales, en PascalCase, uno por archivo y con exportación por defecto. Las props se desestructuran en la firma.
- **Llamadas HTTP:** siempre a través de `services/api.js`, nunca con `fetch` directo. Los errores se capturan en el componente y se muestran con `useDialog` y `DialogAdvice`.
- **Textos:** siempre con `t()`, añadiendo la clave en `es` y `en`.
- **Recursos de S3:** declara la clave en `config/assets.js` y usa `assetUrl()`.
- **Estilos:** Tailwind en línea. Reutiliza `ButtonPrincipal` y `ButtonAlternative` en lugar de crear botones nuevos.
- **Animaciones:** Motion (`import { motion } from 'motion/react'`). Envuelve los elementos que se desmontan en `<AnimatePresence>`.
- **Rutas:** en español (`/explorar`, `/sobre-nosotros`). Las privadas se envuelven en `ProtectedRoute`.
- **Ramas y commits:** ramas `feature/<nombre>` sobre `master`. Mensajes en inglés, en imperativo, describiendo el cambio (por ejemplo "Adapt frontend to backend API v2 breaking changes").

## Añadir cosas habituales

**Una página nueva**
1. Crea `src/pages/MiPagina.js`.
2. Añade la `<Route>` en `App.js` (dentro de `ProtectedRoute` si es privada).
3. Si debe estar en el menú, añádela a `menuItems` de `Navbar.js` y a `Footer.js`.
4. Añade sus textos en los dos archivos de traducción.

**Una columna nueva en los datos**
El filtro y la tabla la detectan solos. Añade su nombre visible en `attributes` y, si debe aparecer en el detalle de especie, añádela a `uniqueAttributes` de `DialogSpecies.js` y a `explore.dialogSpecies.attributes`.

**Un endpoint nuevo**
Usa el método adecuado de `api` (`get`, `postAuth`...). Si necesitas un verbo que no existe (por ejemplo `PUT`), añádelo en `services/api.js` siguiendo el mismo patrón.

## Tests

Vitest con Testing Library, en modo `jsdom`. Los tests van junto al código (`Componente.test.js`). `npm test` los ejecuta todos.

### Convenciones

- `src/setupTests.js` simula `react-i18next`: `t('clave')` devuelve la propia clave, así que los tests buscan textos por clave (`screen.getByText('dialogAdvice.cancelButton')`) y no dependen del idioma.
- La red se simula con `vi.stubGlobal('fetch', ...)` y se restaura con `vi.unstubAllGlobals()`.
- Flujo para corregir un fallo: primero un test que falle por el motivo correcto, después el cambio mínimo y por último toda la suite.
- Al crear archivos con barras invertidas (expresiones regulares), no uses `cat <<EOF` desde el shell: puede comerse las barras. Usa el editor.

### Cobertura actual

| Archivo | Qué verifica |
|---|---|
| `utilities/CSVfunctions.test.js` | `downloadXLSX` no modifica los datos y exporta los arrays como texto |
| `utilities/highlightTerms.test.js` | Términos no latinos en redonda, escape de caracteres especiales y punto literal |
| `components/TextInput.test.js`, `FilterSearchBar.test.js` | Los campos son controlados y se vacían cuando el padre los vacía; el `input` lleva `focus-ring-inset` y ya no las clases de contorno antiguas |
| `components/ButtonPrincipal.test.js`, `ButtonAlternative.test.js` | `ariaLabel` da nombre al botón de icono, la ligadura va en `aria-hidden`, `focus-ring` en las dos ramas, `type="button"` por defecto y `type="submit"` si se pide; chevrons en `aria-hidden` |
| `components/Navbar.test.js`, `Pagination.test.js`, `Sidebar.test.js`, `TermsManager.test.js`, `InfoButton.test.js`, `ScrollIndicator.test.js` | Cada botón de solo icono se localiza por rol y nombre (`iconButton.*` o el `name` de la opción); papeleras con `focus-ring`; sin hacer clic en `ScrollIndicator` (jsdom no implementa `scrollBy`) |
| `components/DialogAdvice.test.js` | `role="dialog"` con nombre y `aria-modal`; foco inicial en la caja; Escape llama a `onClose` y no a `onConfirm`; Tab y Shift+Tab atrapados; el foco vuelve al origen (con un harness que cambia `isOpen` y con `AnimatePresence` que desmonta, también al `main` si el origen desapareció); clic en el fondo cierra y dentro no. Dos tests de la trampa son menos discriminantes (orden natural de Tab de `user-event`) **(por confirmar en un navegador)** |
| `hooks/useDialogFocus.test.js` | Pila de diálogos anidados (Escape y Tab solo sobre el de encima), foco al abrir, trampa de Tab y Shift+Tab (también desde un elemento fuera de la lista de enfocables) y devolución del foco, con respaldo al `main` si el origen se desmontó o era `body` |
| `components/FileUpload.test.js` | Con campos vacíos, confirmar activa el borrador y cancelar envía `confirmed: false`; `accept` solo `.xlsx`; `404` al confirmar y al cancelar; fallo al cancelar; cabecera `Authorization` en `/upload` y en `/upload/confirm`; `401` en `/upload`, al confirmar y al cancelar (borra el token y redirige); `400` sin `emptyFields`; confirmar con `500` vacía la cola. Papeleras con nombre accesible y `focus-ring`; Escape sobre la confirmación envía `confirmed: false` una sola vez y no muestra el éxito; un segundo Escape cierra el diálogo de error (si es el comportamiento deseado, **(por confirmar)**). Simula `fetch` y también `location` y el token |
| `services/api.test.js` | Acceso por SRP (`signIn`: `InitiateAuth` `USER_SRP_AUTH` y `PASSWORD_VERIFIER`, tokens guardados sin `IdToken`, la contraseña no aparece en ningún cuerpo, sin `Session`, otro reto, `200` vacío, `__type` normalizado sin el `message`, red, configuración vacía sin `fetch`), el `poolName` del `signIn` contra el oráculo `CognitoUser.authenticateUser` con `getRandomValues` y `Date` deterministas (`SRP_A`, `TIMESTAMP` y firma; comprobado por mutación), región con formato inválido sin `fetch`; `respondToChallenge`, `associateSoftwareToken` y `verifySoftwareToken`; `renewSession` no guarda los tokens si el refresco cambió durante la renovación (carrera con `logout`); `logout` (la sesión ya está borrada cuando se llama a `RevokeToken`, cuerpo `{ Token, ClientId }`, navega a `/` con éxito o fallo, sin refresco no llama a Cognito, a los 3000 ms si Cognito no responde); `Bearer` con el token de acceso y sin cabecera si no hay token; `401` con refresco (`InitiateAuth` `REFRESH_TOKEN_AUTH`, reintento con el token nuevo, `RefreshToken` nuevo sustituye al anterior), sin `refreshToken`, con refresco rechazado o con segundo `401`: borra la sesión y va a `/login`; `it.each` de la lista blanca de reintentables (red, `5xx`, `429`, los tres `__type`, `4xx` sin `__type` o no JSON, configuración vacía: sesión conservada y `auth_unavailable` con `status: 503`) y de los `__type` que cierran la sesión; un `200` sin `AccessToken` la cierra; dos `401` simultáneos hacen un único refresco; un `401` tardío con el token ya renovado reintenta sin otro refresco (y sin token redirige una sola vez); `503` de autenticación con reintentos (temporizadores falsos); `api.get` y `api.post` no renuevan; `error.data` en errores con `data`; `200` con cuerpo no JSON lanza `SyntaxError` |
| `components/QrCode.test.js` | Matriz reconstruida desde el `d` del path (patrón `^(M\d+ \d+h1v1h-1z)*$`) idéntica a `qrcode(0, 'M')` de la URI y distinta de la de nivel `L`; geometría (`viewBox` con quiet zone de 4, coordenadas dentro del margen); `crispEdges`, colores `white` y `#0C1811`; `role="img"` con nombre sin la URI ni el secreto; sin `img`, `image`, `use`, `foreignObject` ni `data:`; un valor que desborda la capacidad devuelve `null` sin lanzar |
| `utilities/formatSecret.test.js` | 16 caracteres en 4 grupos, 17 con el último de 1 y vacía dando `''` |
| `components/LoginForm.test.js` | Con `MemoryRouter`, `fetch` simulado y enrutado por `X-Amz-Target` y el SRP real: `<h1>`, `autocomplete` y ningún `name` ni enlace; acceso con TOTP (foco en el `<h2>`, tokens guardados, navegación); las tres respuestas de credenciales dan el mismo texto; red, `500` y `TooManyRequestsException` dan `serviceUnavailable`; código erróneo reintentable con un solo `InitiateAuth`; sesión del reto caducada vuelve al primer paso (`sessionExpired` o `codeSessionLost`); primer acceso completo (política, `InvalidPasswordException`, `MFA_SETUP` con un solo `AssociateSoftwareToken`, copia anunciada, secreto repetido); reintento de `AssociateSoftwareToken` por red, `5xx` o `429` (también desde `signIn`): sin secreto ni campo, `serviceUnavailable`, botón `retryButton`, repite solo Associate sin reenviar `NEW_PASSWORD` y `NotAuthorizedException` da `sessionExpired`; reintento del reto final con el código ya verificado (solo `respondToChallenge`, sin otro `VerifySoftwareToken`; `CodeMismatch` limpia el reintento); `SecretCode` ausente; código con espacios; foco al primer campo vacío y `aria-invalid` solo en validación; clave y copia antes del aviso de error; sin doble envío en el mismo tick (solo lo impide `busyRef`); `preventDefault` aunque falle el manejador; espías de `console.*` y `Storage.prototype.setItem`: ninguna llamada lleva la contraseña, el código ni el secreto (alternando antes los dos campos de `newPassword`) y `sessionStorage` queda vacío; **mostrar u ocultar la contraseña:** botón por rol y nombre, `aria-pressed` sin cambiar el nombre, sin `fetch` ni `alert`, campos independientes en `newPassword`, sin botón en el código TOTP, mismo nodo con valor, selección (2-4), `id` y `autocomplete` conservados y sin `name`, foco en el botón con `user.click` y con `fireEvent.click`, orden de Tab, Enter envía y no alterna, `spellCheck`, `autoCapitalize` y `autoCorrect` con el campo oculto y visible, y vuelve a `password` al enviar con error (los tests de «sesión caducada» y de «entrar otra vez en `newPassword`» se comprobaron quitando los 4 `setShown({})`), con contraseñas distintas, por sesión caducada, al cambiar de paso y al desmontar (los temporizadores falsos usan `shouldAdvanceTime` y `userEvent.setup({ advanceTimers })`; sin ello el `asyncWrapper` de Testing Library se cuelga); **QR:** `role="img"` con `login.qrLabel`, matriz idéntica a `qrcode(0, 'M')` de la URI esperada (si recibiera el secreto, falla), ausente en `retrying`, al volver a credenciales y sin `otpUri`, orden ayuda, clave, copiar, QR y campo del código, clave en grupos como `<code>` y copia sin espacios, y ni el texto ni el HTML contienen `otpauth` ni la clave sin espacios. La comprobación visual del 10/11/2026 se hizo a mano con Chrome headless y CDP (no Playwright): es/en a 320, 375 y 1280 px, sin desbordamiento horizontal; no hay capturas «antes» |
| `services/srp.test.js` | `srpTimestamp` (día de una y de dos cifras, día UTC distinto del local); firma contra `node:crypto`; **oráculo** `CognitoUser.authenticateUser` del paquete (solo en el test): `SRP_A`, `TIMESTAMP` y firma idénticos byte a byte, y con el id de pool completo como `poolName` la firma no coincide; con el `AuthenticationHelper` real (`srpA` hexadecimal, firma de 32 bytes, la contraseña no aparece) y rechazo sin excepción síncrona con `B` igual a cero |
| `utilities/passwordPolicy.test.js` | Longitud mínima de 14 y cada clase de caracteres por separado |
| `components/ContactForm.test.js` | Campos con `focus-ring`; «Cerrar» del diálogo no reenvía el correo y enviar sigue enviando; mensajes por `429`, `400` y `500`; `maxLength`; campos localizables por su etiqueta, botón localizable por rol dentro del `<form>`, envío con Enter y con clic sin doble envío, `preventDefault` del envío e ids únicos entre instancias |
| `services/session.test.js` | `saveTokens` en PascalCase, sin `IdToken` y conservando el refresco; `clearSession` |
| `components/ProtectedRoute.test.js` | Sin token a `/login`; con `200` el contenido y el botón de cierre; tres `503`, un fallo de red, `403` y `500` muestran `alert` con `<h1>` sin borrar el token ni redirigir; `401` sin refresco a `/login`; «Reintentar» repite `GET /auth`; el aviso también trae «Cerrar sesión»; el botón de cierre borra los tokens, revoca el refresco y va a `/`, y se deshabilita mientras dura la revocación. Usa el `api` y el `session` reales con `fetch` simulado |
| `components/CookieBanner.test.js` | Las dos cookies se escriben con `path=/`, `max-age` de un año y `SameSite=Lax`; `Secure` solo en HTTPS, tanto con «aceptar todo» como desde el modal; `cookiePreferences` sin codificar; con el consentimiento ya dado no se muestra el banner ni se escribe nada. Simula `document.cookie` y `location` |
| `components/ImageGalleryManager.test.js` | Un caso por carácter prohibido del título sin llamar a la API, y un título válido que sí sube; botón de añadir y papeleras con su nombre accesible y `focus-ring` |
| `components/ImageComponent.test.js`, `ImageCarrousel.test.js` | `imageKey` con `encodeURIComponent`; sin clave no se llama a la API |
| `components/Table.test.js` | Columnas como unión de claves, orden de primera aparición y sin mutar `data` |
| `components/DialogSpecies.test.js` | Título accesible compuesto (con `noItalicTerms`), foco inicial, Escape, trampa de Tab, devolución del foco, nombre del enlace de IPNI sin la ligadura; comparación exacta de la especie (cadena y array; una subcadena, `undefined`, `null`, `""` y diferencias de mayúsculas o espacios no cuentan), sin mutar `data` ni `species`, y enlace a IPNI con `rel="noopener noreferrer"`; con `AnimatePresence` el foco vuelve al cerrar, y al abrirlo desde una tarjeta no enfocable (origen `body`) vuelve al `main` |
| `utilities/FormatFileName.test.js` | Formato `AAAA-MM-DD_vN.xlsx` con y sin ruta, `_v10` y nombres que no coinciden |
| `languages/translations.test.js` | Paridad de claves y de marcadores de interpolación entre español e inglés, que no haya traducciones vacías, que existan `login.serviceUnavailable` y las claves de los errores `429`, `400` y `404`, el texto exacto de `gallery.noDataFoundPlaceholder` y `notFound.title` y los de `iconButton.*` en ambos idiomas |
| `utilities/faviconHtml.test.js` | `faviconTags` devuelve `<link rel="icon">` con `href` `<URL>/<clave>` y sin `type`, o nada si no hay URL o no empieza por `https://` (`http://`, `//cdn...`, sin esquema, espacios iniciales o `HTTPS://`); la barra final no se normaliza; `logoKeyFromSource` da la misma clave que `ASSETS.LOGO` real, acepta comillas dobles, no confunde `LOGOS` y lanza error sin `LOGO`; `index.html` no fija ningún favicon, bucket ni marcador `%VITE_`, no usa `onload` en línea y sus dos hojas de Google Fonts son `rel="stylesheet"` |
| `components/Header.test.js` | `Header` no reescribe el `href` de un `<link rel="icon">` existente |
| `i18n.test.js` | `lang` de `<html>` sigue al idioma (`en`, `es`, `en-US` da `en`, `es-ES` da `es`, `fr` da `es`), también el idioma inicial detectado. Usa `i18next` real (la mock global solo afecta a `react-i18next`) |
| `hooks/useDocumentTitle.test.js` | Título `<Página> · SIGMETUM-A` por ruta con el texto real de `es`, 404 con `notFound.title`, mayúsculas y barra final, cambio de idioma sin remontar, ruta protegida que redirige a `/login`, y guarda de deriva: toda ruta de `App.js` tiene título y `App.js` llama al hook. Usa i18n real (`vi.mock('react-i18next', importOriginal)`) en lugar de la mock global |
| `index.test.js` | `index.js` monta `BrowserRouter` con `v7_startTransition` y `v7_relativeSplatPath` (simula `react-dom/client`, `App` y `i18n`) |

### Pendiente

1. `Filter`: combinación Y/O de filtros y facetas dependientes.
2. `SortItemsList`.
3. E2E con Playwright: portada → explorar → filtrar → abrir especie → descargar Excel.

## Integración continua y dependencias

| Pieza | Qué hace |
|---|---|
| [.github/workflows/ci.yml](../.github/workflows/ci.yml) | Matriz de Node 22 y 24 con `fail-fast: false` (se ve el resultado de cada versión). En ambas ejecuta `npm ci`, `npm test`, `npm run build` y `npm run agentes:test` (el glob de `node --test` exige Node 21 o posterior). Solo en Node 22, la principal, ejecuta `npm run lint`, `npm run quality` (incluye `npm audit`) y `npm run docs:check`, que no dependen de la versión. Los dos checks se llaman `Tests, compilación, calidad y documentación (Node 22)` y `Tests, compilación, calidad y documentación (Node 24)` (en la PR llevan el prefijo `CI / `); el check antiguo, sin versión, ya no existe. Se lanza en cada PR, en cada push a `master` y `feature/testing`, cada lunes (porque `npm audit` puede dar un aviso nuevo sin que cambie el código) y a mano |
| [.github/pull_request_template.md](../.github/pull_request_template.md) | Plantilla de la PR con la definición de terminado, las guías que aplican y si afecta al backend o a la infraestructura |
| [.github/dependabot.yml](../.github/dependabot.yml) | Propone cada lunes las actualizaciones de `npm` y de las acciones de GitHub, agrupando las menores. Ignora las versiones mayores de `jsdom` (el pin se mantiene por cambio mínimo, no por la versión de Node; ver M19 en [09](09-estado-actual-y-deuda-tecnica.md)) y `eslint` (los plugins aún no lo admiten) |
| [.gitattributes](../.gitattributes) | Fija los finales de línea en LF en todos los sistemas |

**Ajustes de GitHub que no están en el código** (los hace quien administre el repositorio):

1. Proteger `master` y `feature/testing`: exigir los **dos** checks (`Tests, compilación, calidad y documentación (Node 22)` y `Tests, compilación, calidad y documentación (Node 24)`) en verde y una revisión antes de fusionar. Sin esto, la CI avisa pero no bloquea. Si ya existe una regla que exige el nombre antiguo (sin versión), hay que cambiarla a los dos nombres nuevos: mientras tanto bloquearía todas las PR. Con la matriz ambos checks corren siempre, así que no se quedan en espera. Que exista esa regla es **(por confirmar)** en los ajustes de GitHub.
2. Activar *Dependabot security updates* en Settings > Code security.

**Amplify no ejecuta lint, calidad ni `docs:check`:** su `build_spec` hace `npm ci`, `npm test` (ya está en `preBuild`, en `modules/amplify/main.tf` de `sigmetum-infra`, autorizado por el usuario) y `npm run build`, para no desplegar una versión rota (ver [para-infra.md](integracion/para-infra.md)).

## Herramientas de Claude Code del proyecto

El repositorio incluye `.claude/settings.json` con plugins compartidos, que se activan al confiar en la carpeta:

| Plugin / skill | Para qué |
|---|---|
| `superpowers` (de `superpowers-marketplace`) | Flujo de trabajo: planificación, TDD, depuración sistemática y verificación |
| `i-have-adhd` | Estilo de salida del ciclo agéntico (`estilo` de `.claude/flujo.json`) |
| `frontend-design`, `ui-ux-pro-max` | Diseño de interfaz, accesibilidad y paletas |
| `playwright` | Probar la app en un navegador real |
| `understand-anything` | Mapa del código y guía de incorporación al proyecto |
| `humanizer` | Revisar textos institucionales para que suenen naturales (no usar sobre contenido científico) |
| `design-taste-frontend` (skill del plugin local `dominio-frontend`, ver [plugins/README.md](../plugins/README.md)) | Guía de diseño para landing pages. Útil solo para la portada. Ya no hay skills sueltas en `.claude/skills/` |

### Ciclo agéntico (`/ciclo`)

Toda feature o fix puede pasar por `/ciclo <tarea>`, del plugin [ciclo-agentico](../plugins/ciclo-agentico/README.md): requisitos, arquitectura, desarrollo y verificación con documentación, con puerta humana entre fases y sin commits del agente. La configuración está en `.claude/flujo.json`; los traspasos entre roles (specs, planes y avisos para PR) se guardan en `docs/specs/`. Cómo se instala y se activa el marketplace local: [plugins/README.md](../plugins/README.md#cómo-se-activan). En un equipo nuevo: `npm install`, `npm run agentes:bootstrap`, reiniciar la sesión de Claude Code y lanzar `/ciclo-init` (puede que haga falta el prefijo `/ciclo-agentico:ciclo-init` **(por confirmar)**). Desde la versión 0.1.2 del plugin, la spec, el plan y el aviso para PR van en `docs/specs/AAAA-MM/` y el paso 0 de `/ciclo` pregunta qué specs ya fusionadas se depuran (ver «Retención de specs» en el README del plugin); los archivos anteriores siguen en `docs/specs/` sin mover **(por confirmar si se reorganizan)**.

El archivo [CLAUDE.md](../CLAUDE.md) de la raíz resume las reglas del proyecto para Claude Code y le indica qué [guía](README.md#guías-de-trabajo) leer según la tarea: buenas prácticas, seguridad, accesibilidad y [mantenimiento](guias/mantenimiento.md) tras cada feature o fix.
