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

Si el método envía token (`getAuth`, `postAuth`, `postFormAuth`, `deleteAuth`) y la respuesta es `401`, `api.js` intenta **una** renovación: `InitiateAuth` con `AuthFlow: 'REFRESH_TOKEN_AUTH'`, `ClientId` y `AuthParameters: { REFRESH_TOKEN }` contra `cognito-idp` (ver más abajo; sin secreto). Si va bien, guarda los tokens (un `RefreshToken` nuevo sustituye al anterior; si no viene, se conserva el que había) y repite la petición una vez con el token nuevo. Si en el `401` el token guardado ya no es el que se envió (otra llamada renovó la sesión), repite la petición una vez con el token actual **sin** otra renovación. Si no queda ningún token (la sesión se borró, p. ej., en otra pestaña) no hay nada que renovar: si esta pestaña aún no ha redirigido (bandera de módulo `redirecting`), borra la sesión y ejecuta `window.location.assign('/login')`, y en todo caso lanza el `401`. Con dos llamadas simultáneas cuyo reintento vuelve a dar `401`, `assign('/login')` se llama una sola vez. Las llamadas con `401` simultáneas comparten una única renovación.

**Regla de la renovación (lista blanca de reintentables, `isRetryableAuthError`).** Son indeterminados, y no borran la sesión ni redirigen: fallo de red, configuración vacía, `5xx`, `429`, los `__type` `TooManyRequestsException`, `LimitExceededException` e `InternalErrorException`, un `4xx` sin `__type` (p. ej. el HTML de CloudFront) y un cuerpo no JSON. El fallo de red se lanza como `type: 'network'`; los demás, como un error `type: 'auth_unavailable'`, `status: 503`, `message: 'Authentication service unavailable'` (no el `type` ni el `status` reales de Cognito, para que ningún consumidor lo confunda con un `401` del backend). **Cualquier otro `__type` de un `4xx` cierra la sesión** (`NotAuthorizedException`, `InvalidParameterException`, `ResourceNotFoundException`, `UserNotFoundException`, `PasswordResetRequiredException`...), igual que la falta de `refreshToken`, un `200` sin `AccessToken` o que la repetición vuelva a dar `401`: `clearSession`, `window.location.assign('/login')` y el error `401`. Qué devuelve Cognito para un refresco inválido y si responde `5xx` o `429` **(por confirmar contra el pool real)**. Los componentes que solo miran `status === 401` tratan el error `auth_unavailable` como genérico; `ProtectedRoute` lo muestra como servicio no disponible. `get` y `post` no renuevan ni redirigen. `FileUpload` usa `postFormAuth` y `postAuth`, así que sigue el mismo camino.

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
| `api.signIn` | `(username, password)` | `application/x-amz-json-1.1` (a Cognito, no al backend) | `InitiateAuth` con `USER_SRP_AUTH` y `RespondToAuthChallenge` con `PASSWORD_VERIFIER`; devuelve `{ done: true }` o `{ challenge, session }` más `username` (el `USER_ID_FOR_SRP`) |
| `api.respondToChallenge` | `(name, session, responses)` | ídem | `RespondToAuthChallenge` (`NEW_PASSWORD_REQUIRED`, `MFA_SETUP`, `SOFTWARE_TOKEN_MFA`) |
| `api.associateSoftwareToken` | `(session)` | ídem | `AssociateSoftwareToken`; devuelve `{ secretCode, session }` |
| `api.verifySoftwareToken` | `(session, code)` | ídem | `VerifySoftwareToken`; devuelve `{ ok, session }` |
| `api.logout` | `()` | ídem | Borra la sesión, `RevokeToken` con el token de refresco (hasta 3 s) y va a `/` |

`Authorization` vale `Bearer ${getAccessToken()}` (el token de **acceso** de Cognito, de `localStorage['token']`, leído en cada intento; nunca se envía `Bearer null`). El `IdToken` no se guarda ni se envía. Los métodos de login guardan ellos mismos el `AuthenticationResult` (`saveTokens`): `LoginForm` nunca toca los tokens.

## Endpoints consumidos

La referencia completa de la API está en `sigmetum-backend/docs/04-api.md`. Qué campos lee el frontend de cada respuesta, y qué discrepancias hay hoy, está en [integracion/para-backend.md](integracion/para-backend.md).

Rutas verificadas contra `sigmetum-backend/routes/*.js`.

### Cognito (`cognito-idp`, fuera del prefijo de la API)

El login no usa `POST /log` ni el Hosted UI. Todas las peticiones van a `https://cognito-idp.<región>.amazonaws.com/` (la región es el prefijo de `VITE_COGNITO_USER_POOL_ID`), con `POST`, `Content-Type: application/x-amz-json-1.1`, `X-Amz-Target: AWSCognitoIdentityProviderService.<acción>` y un cuerpo JSON, sin el envoltorio `{ success, data }`. Cliente público: sin secreto ni `Authorization`. Sin pool, sin `_` en el id, sin cliente o con una región que no cumple `/^[a-z]{2}(-[a-z]+)+-\d$/`, lanza `{ type: 'config' }` sin llamar a `fetch`. `signIn` cede un turno real (`await sleep(0)`) antes del cálculo de `SRP_A`. Si el `getRefreshToken()` cambia durante una renovación (carrera con `logout`), `renewSession` no guarda los tokens y devuelve `false` sin redirigir **(por confirmar)**. El CORS de `cognito-idp` y los nombres reales de las acciones **(por confirmar en `dev`)**.

| Acción | Uso | Quién lo llama |
|---|---|---|
| `InitiateAuth` | `USER_SRP_AUTH` (`USERNAME`, `SRP_A`) en el acceso y `REFRESH_TOKEN_AUTH` en la renovación | `api.signIn`, `renewSession` |
| `RespondToAuthChallenge` | `PASSWORD_VERIFIER` (prueba SRP) y los retos `NEW_PASSWORD_REQUIRED`, `MFA_SETUP` y `SOFTWARE_TOKEN_MFA` | `api.signIn`, `api.respondToChallenge` |
| `AssociateSoftwareToken`, `VerifySoftwareToken` | Registro de la aplicación de autenticación (TOTP) | `api.associateSoftwareToken`, `api.verifySoftwareToken` |
| `RevokeToken` | `{ Token: <refresco>, ClientId }` al cerrar sesión | `api.logout` |

`ClientId` solo va en `InitiateAuth`, `RespondToAuthChallenge` y `RevokeToken`. Los errores se leen del `__type` normalizado (`split('#').pop().split(':')[0]`): se guardan el status y ese nombre, nunca el `message` de Cognito (`{ type: 'cognito', status, code }`). El SRP lo calcula `services/srp.js` (ver [06](06-utilidades-hooks-config.md#cálculo-srp-srcservicessrpjs)); el nombre del pool que entra en el cálculo y en la firma es la parte del id posterior al guion bajo. `username_attributes = ["email"]` en el pool: la prueba usa el `USER_ID_FOR_SRP` que devuelve Cognito, no el correo escrito. Con `UserNotFoundException` o `PasswordResetRequiredException` el usuario ve el aviso de acceso incorrecto (con `prevent_user_existence_errors` llegan como `NotAuthorizedException`).

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
| `GET /list-recipients` | Sí | — | `[{ email }]` (`[]` si no hay ninguno guardado; `500` si falta el fichero) | `ContactRecipientsManager.fetchRecipients` |
| `POST /add-recipient` | Sí | `{ email }` | Mensaje | `ContactRecipientsManager.handleAdd` |
| `DELETE /delete-recipient` | Sí | `{ email }` | Mensaje | `ContactRecipientsManager.handleRemove` |

### Fuera del prefijo

`GET /healthcheck` existe en el backend para el balanceador; el frontend no lo usa.
