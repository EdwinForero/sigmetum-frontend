# 03. Contrato con la API

## Configuración

La URL base se forma con dos variables de entorno ([src/config/env.js](../src/config/env.js)):

```
${VITE_BASE_URL}${VITE_API_PREFIX}${ruta}
p. ej. http://localhost:8000/api/v1/list-files
```

## Envoltorio de respuesta

El backend responde siempre con este formato:

```json
{ "success": true,  "data": <cuerpo> }
{ "success": false, "error": "<mensaje>", "data": <opcional> }
```

`services/api.js` desenvuelve la respuesta: devuelve `json.data` si `response.ok && json.success`. En caso contrario lanza un `Error` con estas propiedades:

| Propiedad | Valor |
|---|---|
| `message` | `json.error` o `http_<status>`; `network_error` si falla la red |
| `type` | `'network'` o `'http'` |
| `status` | Código HTTP (solo en errores `http`) |
| `serverMessage` | `json.error` |
| `data` | `json.data`, solo si la respuesta de error lo trae (en el `400` de `/upload` con campos vacíos lleva `emptyFields` y `draftKey`). No se conserva en el `401` |

Si el servidor devuelve algo que no es JSON (por ejemplo, una página 502 de un proxy), `response.json()` lanza un `SyntaxError` sin `type`. Los componentes lo tratan como un error genérico. La excepción son el `401` y el `503` en un método `*Auth` (ver más abajo): el cuerpo se lee con tolerancia, así que incluso con cuerpo no JSON (el HTML de un ALB) se lanza un error con `status: 401` o `503`.

### Ante un 401

Si el método envía token (`getAuth`, `postAuth`, `postFormAuth`, `deleteAuth`) y la respuesta es `401`, `api.js` intenta **una** renovación (`POST <VITE_COGNITO_DOMAIN>/oauth2/token`, `grant_type=refresh_token`, `client_id`, sin secreto). Si va bien, guarda los tokens y repite la petición una vez con el token nuevo. Si no hay `refreshToken`, si la renovación falla (incluido un 5xx de Cognito) o si la repetición vuelve a dar `401`, borra la sesión (`clearSession`), ejecuta `window.location.assign('/login')` y lanza el error 401. Las llamadas con `401` simultáneas comparten una única renovación. Un fallo de red durante la renovación no borra la sesión (es indeterminado) y se lanza como error de red. `get` y `post` no renuevan ni redirigen. `FileUpload` usa `postFormAuth` y `postAuth`, así que sigue el mismo camino.

### Ante un 503

En un método con token, si la respuesta es `503` **con `error: 'Authentication service unavailable'`**, `api.js` espera 1 s y reintenta, y otra vez tras 3 s (`RETRY_DELAYS_MS`). Agotados los reintentos lanza el error con `status: 503`, sin borrar la sesión ni redirigir. Un `503` con otro cuerpo no se reintenta. Solo `ProtectedRoute` muestra un mensaje propio (`login.serviceUnavailable`); el resto de pantallas, su error genérico. Que los reintentos cubran el tiempo real de recuperación del backend tras un `kid` nuevo (hasta 10 s) es **(por confirmar)**.

## Métodos del cliente

| Método | Firma | Cabeceras | Cuerpo |
|---|---|---|---|
| `api.get` | `(path)` | — | — |
| `api.getAuth` | `(path)` | `Authorization` | — |
| `api.post` | `(path, body)` | `Content-Type: application/json` | `JSON.stringify(body)` |
| `api.postAuth` | `(path, body)` | JSON + `Authorization` | JSON |
| `api.postFormAuth` | `(path, formData)` | `Authorization` (el navegador pone el `boundary`) | `FormData` |
| `api.deleteAuth` | `(path, body)` | JSON + `Authorization` | JSON |
| `api.exchangeCode` | `(code, verifier)` | `application/x-www-form-urlencoded` (a Cognito, no al backend) | `grant_type=authorization_code`, `code`, `code_verifier`, `redirect_uri`, `client_id` |

`Authorization` vale `Bearer ${getAccessToken()}` (el token de **acceso** de Cognito, de `localStorage['token']`, leído en cada intento; nunca se envía `Bearer null`). El `id_token` no se guarda ni se envía.

## Endpoints consumidos

La referencia completa de la API está en `sigmetum-backend/docs/04-api.md`. Qué campos lee el frontend de cada respuesta, y qué discrepancias hay hoy, está en [integracion/para-backend.md](integracion/para-backend.md).

Rutas verificadas contra `sigmetum-backend/routes/*.js`.

### Cognito (Hosted UI, fuera del prefijo de la API)

El login ya no usa `POST /log`. Estas URLs son del dominio `VITE_COGNITO_DOMAIN` (no del backend), cliente público con PKCE S256. Los endpoints son los estándar de Cognito **(por confirmar contra el pool real)**.

| Endpoint | Cómo | Quién lo llama |
|---|---|---|
| `GET /oauth2/authorize` | Navegación (`window.location.assign`) con `response_type=code`, `client_id`, `redirect_uri`, `scope=openid email`, `state`, `code_challenge` y `code_challenge_method=S256` | `session.startLogin` (`LoginForm`, botón de reintento de `AuthCallback`) |
| `POST /oauth2/token` | `fetch` de formulario: canje del código (`api.exchangeCode`, desde `AuthCallback`) y renovación (`grant_type=refresh_token`, desde `api.js`). CORS del endpoint **(por confirmar en `dev`)** | `api.js` |
| `GET /logout` | Navegación con `client_id` y `logout_uri=<origen>/` | `session.logout` (botón de `ProtectedRoute`) |

### Autenticación (`routes/auth.js`)

| Método y ruta | Auth | Petición | `data` de respuesta | Quién lo llama |
|---|---|---|---|---|
| `GET /auth` | Sí (token de acceso) | — | Confirmación | `ProtectedRoute.checkAuth` (con los reintentos del `503`) |

### Datos (`routes/data.js`)

| Método y ruta | Auth | Petición | `data` de respuesta | Quién lo llama |
|---|---|---|---|---|
| `GET /list-files` | No | — | `{ [provincia]: [{ key, name }] }`: versiones de Excel por provincia | `FileDropdown.fetchFiles` |
| `GET /get-data/:path` | No | `path` = `key` de la versión | `Array<Registro>` | `FileDropdown.handleVersionSelect`. **Con el backend actual no funciona para versiones**: ver [integración con el backend](integracion/para-backend.md#6-discrepancias-verificadas-hoy) (D1) |
| `GET /get-merged-data` | No | — | `Array<Registro>` de todas las provincias activas | `App.fetchData` |
| `POST /upload` | Sí | `multipart`, campo `file` | Éxito: `{ message, key }` (el frontend solo lee el estado). Con campos vacíos: **400** con `data: { emptyFields: [{ rowIndex, ... }], draftKey }` (el frontend no lee `processedData`) | `FileUpload.handleSubmit` (`postFormAuth`) |
| `POST /upload/confirm` | Sí | `{ confirmed: boolean, draftKey }` | Mensaje | `FileUpload.handleSubmit` (`postAuth`) |
| `POST /update-file` | Sí | `{ fileName }` (la `key` de la versión) | Mensaje. Activa esa versión como vigente | `DataManagement.handleFileUpdate` |
| `POST /delete-file` | Sí | `{ fileName }` | Mensaje | `DataManagement.handleFileDelete` |

**Nota sobre `/upload`:** si hay campos vacíos, el Excel queda como borrador hasta que llega `/upload/confirm`. El frontend envía `confirmed: false` al cancelar para que el borrador no quede huérfano en el bucket (corregido en A1) y comprueba la respuesta: un `404` (al confirmar o cancelar) muestra "el borrador ya no existe", interpretado **solo por el estado**; cualquier otro fallo al cancelar muestra el error de subida y no vacía la cola, para poder reintentar. `FileUpload` solo acepta `.xlsx`.

### Contenido (`routes/content.js`)

| Método y ruta | Auth | Petición | `data` de respuesta | Quién lo llama |
|---|---|---|---|---|
| `POST /send-email` | No | `{ username, email, subject, message }` | Mensaje | `ContactForm.handleSubmit` |
| `GET /list-images` | No | — | `[{ fileName, url }]`, con URLs prefirmadas | `VegetationGallery`, `ImageGalleryManager.fetchImageUrls` |
| `GET /get-image?imageKey=` | No | Clave de la imagen | `{ imageUrl }` | `ImageComponent` (solo si recibe `imageKey`), `ImageCarrousel` (sin uso) |
| `GET /list-terms` | No | — | `[{ term }]` | `App.fetchTerms`, `TermsManager.fetchTerms` |
| `POST /upload-image` | Sí | `multipart`: `file` y `title` | Mensaje | `ImageGalleryManager.handleImageUpload` |
| `DELETE /delete-image` | Sí | `{ imageKey }` (se envía `fileName`) | Mensaje | `ImageGalleryManager.deleteImage` |
| `POST /upload-term` | Sí | `{ term }` | Mensaje | `TermsManager.handleAddTerm` |
| `DELETE /delete-term` | Sí | `{ term }` | Mensaje | `TermsManager.handleDeleteTerm` |

### Fuera del prefijo

`GET /healthcheck` existe en el backend para el balanceador; el frontend no lo usa.
