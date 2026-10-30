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

Si el servidor devuelve algo que no es JSON (por ejemplo, una página 502 de un proxy), `response.json()` lanza un `SyntaxError` sin `type`. Los componentes lo tratan como un error genérico. La excepción es un `401` en un método `*Auth` (ver más abajo): se comprueba el estado antes de leer el cuerpo, así que incluso con cuerpo no JSON se lanza un error con `status: 401`.

### Ante un 401

Si el método envía token (`getAuth`, `postAuth`, `postFormAuth`, `deleteAuth`) y la respuesta es `401`, `api.js` borra `localStorage['token']`, ejecuta `window.location.assign('/login')` y lanza el error igualmente. `get` y `post` (incluido `POST /log`, cuyo `401` es "credenciales incorrectas") no borran ni redirigen. `FileUpload` usa `fetch` propio y **no** redirige ante `401`.

## Métodos del cliente

| Método | Firma | Cabeceras | Cuerpo |
|---|---|---|---|
| `api.get` | `(path)` | — | — |
| `api.getAuth` | `(path)` | `Authorization` | — |
| `api.post` | `(path, body)` | `Content-Type: application/json` | `JSON.stringify(body)` |
| `api.postAuth` | `(path, body)` | JSON + `Authorization` | JSON |
| `api.postFormAuth` | `(path, formData)` | `Authorization` (el navegador pone el `boundary`) | `FormData` |
| `api.deleteAuth` | `(path, body)` | JSON + `Authorization` | JSON |

`Authorization` vale `Bearer ${localStorage.getItem('token')}`.

## Endpoints consumidos

La referencia completa de la API está en `sigmetum-backend/docs/04-api.md`. Qué campos lee el frontend de cada respuesta, y qué discrepancias hay hoy, está en [integracion/para-backend.md](integracion/para-backend.md).

Rutas verificadas contra `sigmetum-backend/routes/*.js`.

### Autenticación (`routes/auth.js`)

| Método y ruta | Auth | Petición | `data` de respuesta | Quién lo llama |
|---|---|---|---|---|
| `POST /log` | No (con límite de intentos) | `{ username, password }` | `{ token }` | `LoginForm.handleLogin` |
| `GET /auth` | Sí | — | Confirmación | `ProtectedRoute.checkAuth` |

### Datos (`routes/data.js`)

| Método y ruta | Auth | Petición | `data` de respuesta | Quién lo llama |
|---|---|---|---|---|
| `GET /list-files` | No | — | `{ [provincia]: [{ key, name }] }`: versiones de Excel por provincia | `FileDropdown.fetchFiles` |
| `GET /get-data/:path` | No | `path` = `key` de la versión | `Array<Registro>` | `FileDropdown.handleVersionSelect`. **Con el backend actual no funciona para versiones**: ver [integración con el backend](integracion/para-backend.md#6-discrepancias-verificadas-hoy) (D1) |
| `GET /get-merged-data` | No | — | `Array<Registro>` de todas las provincias activas | `App.fetchData` |
| `POST /upload` | Sí | `multipart`, campo `file` | Éxito: `{ message, key }` (el frontend solo lee el estado). Con campos vacíos: **400** con `data: { emptyFields: [{ rowIndex, ... }], draftKey }` (el frontend no lee `processedData`) | `FileUpload.handleSubmit` (con `fetch` directo) |
| `POST /upload/confirm` | Sí | `{ confirmed: boolean, draftKey }` | Mensaje | `FileUpload.handleSubmit` (con `fetch` directo) |
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
