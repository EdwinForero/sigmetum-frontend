# Integración con el backend: lo que espera el frontend

Documento para quien mantiene `sigmetum-backend`. Explica **qué consume el frontend y qué da por hecho**, para poder cambiar la API sin romper la web.

- La referencia completa de la API es la del propio backend: `sigmetum-backend/docs/04-api.md`. Aquí no se repite.
- Lo verificado contra el código está marcado así: **(verificado)**. Lo deducido pero no probado contra un S3 real, como **(por confirmar)**.
- Fecha de la verificación: 30/10/2026 (la autenticación con Cognito, secciones 1, 2 y 4, se actualizó el 10/11/2026 contra el código del frontend: login con formulario propio y SRP, sin Hosted UI; **el contrato con el backend no cambia**. El `para-frontend.md` del backend («Autenticación con Cognito», F18) describe la implementación del frontend con el Hosted UI (`/auth/callback`, PKCE, `VITE_COGNITO_DOMAIN`) y **está desactualizado en esa parte**: lo actualiza quien mantiene el backend). Frontend: rama `feature/sigmetum_front_v2`, sobre el commit `a895e41` (cambios sin confirmar de los lotes A, B y C). Backend: rama `feature/sigmetum_v2`, commit `2864327` (cambios `F2` a `F12` de su `para-frontend.md`; los tests del frontend simulan la API, no se ha probado contra un backend real **(por confirmar)**).

## 1. Cómo llama el frontend a la API

Todo pasa por [src/services/api.js](../../src/services/api.js).

| Aspecto | Comportamiento |
|---|---|
| URL | `VITE_BASE_URL` + `VITE_API_PREFIX` + ruta. El prefijo debe coincidir con `API_PREFIX` del backend (`/api/v1`) |
| Éxito | Solo se considera éxito si `response.ok` **y** `json.success === true`. Devuelve `json.data` |
| Error | Cualquier otro caso lanza un error con `status` y `type: 'http'`. El cuerpo debe ser JSON con `{ success: false, error }`. Una respuesta no JSON (un 502 de un proxy) también acaba en error genérico |
| Autenticación | `Authorization: Bearer <token de acceso de Cognito>` (nunca el de identidad), con el token de `localStorage['token']`, leído en cada intento. El login ya no pasa por el backend: es un formulario propio del frontend con SRP contra `cognito-idp` (ver sección 4) |
| Mensajes de error | El frontend **no muestra** el texto de `error` del servidor: usa sus propios mensajes traducidos, elegidos por el **estado HTTP** (nunca por el texto). Distingue los de la tabla de abajo; el resto de estados cae en el mensaje genérico del componente |

Qué hace el frontend según el estado:

| Estado | Dónde | Comportamiento |
|---|---|---|
| `401` | Métodos `*Auth` de `api.js` (`getAuth`, `postAuth`, `postFormAuth`, `deleteAuth`) | Intenta **una** renovación en silencio (`InitiateAuth` con `REFRESH_TOKEN_AUTH` contra `cognito-idp`; una sola renovación compartida por las llamadas simultáneas) y, si va bien, repite la petición una vez con el token nuevo. Si en el `401` el token guardado ya es otro (otra llamada renovó), repite con el actual sin otra renovación; si ya no hay token (sesión borrada en otra pestaña), no renueva: borra la sesión, redirige a `/login` (una sola vez por pestaña) y lanza el `401`. Si no hay `refreshToken`, si Cognito rechaza la renovación con cualquier `__type` de un `4xx` que no sea de la lista de reintentables (`NotAuthorizedException` esperado, **(por confirmar contra el pool real)**) o si la repetición vuelve a dar `401`, borra la sesión, ejecuta `window.location.assign('/login')` y lanza el error 401 (también con cuerpo no JSON). Un fallo de **red**, un `5xx`, un `429`, `TooManyRequestsException`, `LimitExceededException`, `InternalErrorException` o un `4xx` sin `__type` durante la renovación es indeterminado: no borra la sesión ni redirige y sube como error (`type: 'network'` en la red; `type: 'auth_unavailable'`, `status: 503` en los demás). El backend sigue recibiendo el mismo `Authorization: Bearer`; solo cambia cuándo se renueva el token `api.get` y `api.post` **no** renuevan ni redirigen. `FileUpload` usa `postFormAuth` y `postAuth`, así que un `401` en `/upload` o en `/upload/confirm` sigue el mismo camino |
| `503` con `error: 'Authentication service unavailable'` | Métodos `*Auth` de `api.js` | Reintenta dos veces, tras 1 s y 3 s. Agotados, lanza el error con `status: 503` **sin** borrar la sesión ni redirigir. Solo se reintenta ese cuerpo exacto (el 503 de autenticación sale antes de que la ruta haga nada, así que es seguro repetir también un `POST`); un `503` con otro cuerpo (p. ej. el HTML de un ALB) no se reintenta ni borra nada. `ProtectedRoute` muestra su propio aviso de servicio no disponible; el resto de pantallas, su error genérico. Riesgo aceptado: tras un `kid` nuevo el backend puede dar hasta 10 s de 503 y los reintentos terminan antes **(por confirmar en `dev`)** |
| `429` | `POST /send-email` (`ContactForm`) | Mensaje propio: "demasiados mensajes", con "inténtalo en 15 minutos". El login ya no usa `429` (lo gestiona Cognito) |
| `400` | `POST /send-email` (`ContactForm`) | "Revisa los datos del formulario". En `POST /upload` con `data.emptyFields` y `data.draftKey`, abre el diálogo de campos vacíos (sin cambios); el `draftKey` se reenvía sin interpretarlo |
| `404` | `POST /upload/confirm` (`FileUpload`), al confirmar o al cancelar | Se interpreta **solo por el estado** (no se lee el texto `Draft not found`): "El borrador ya no existe. Vuelve a subir el archivo." Un `404` con otro significado en esa ruta se mostraría igual **(por confirmar con el backend)** |
| Resto (`500`, red...) | Todos | Mensaje genérico del componente. Cancelar un borrador con un fallo distinto de `404` muestra el error de subida |

El frontend no necesita un código estable (`code`) en la respuesta: usa el estado HTTP.

## 2. Endpoints y campos que lee el frontend

Solo aparecen los campos que el frontend **lee**. Lo demás de la respuesta se ignora y se puede cambiar sin riesgo.

### Autenticación

`POST /log` **ya no existe en el frontend**: no hay `data.token` del backend. El login es un formulario propio de `/login` con SRP (`USER_SRP_AUTH`) contra `cognito-idp.<región>.amazonaws.com`, con los retos de Cognito (contraseña nueva, registro del TOTP y código TOTP); no hay Hosted UI ni `/auth/callback`, y nada de esto pasa por el backend. El backend solo recibe el token de acceso como `Bearer`.

| Endpoint | El frontend envía | El frontend lee | Quién lo llama |
|---|---|---|---|
| `GET /auth` | `Authorization: Bearer <token de acceso>` | Solo el código de estado (con reintentos ante el `503` de autenticación) | `ProtectedRoute` (al entrar en cada ruta privada; se repite al cambiar de ruta privada, porque cada una lleva `key` propia) |

### Datos

| Endpoint | El frontend envía | El frontend lee | Quién lo llama |
|---|---|---|---|
| `GET /get-merged-data` | — | `data`: array de registros | `App`, al entrar en `/explorar` |
| `GET /list-files` | — | `data`: `{ [provincia]: [{ key, name }] }` | `FileDropdown` |
| `GET /get-data/<key>` | — | `data`: array de registros | `FileDropdown`, al elegir una versión. **Ver discrepancia D1** |
| `POST /upload` | `multipart`, campo `file` (el selector solo acepta `.xlsx`) | Con `400`: `data.emptyFields[].rowIndex` y `data.draftKey` (opaco: solo se reenvía). Con `200`: solo el estado, pero `api.js` exige `success: true` (el backend lo devuelve en `routes/data.js`). **No lee `processedData`** | `FileUpload` (`api.postFormAuth`) |
| `POST /upload/confirm` | `{ confirmed, draftKey }` | Solo el estado (con `success: true`, como arriba). Con `404` (confirmar o cancelar): aviso "el borrador ya no existe" | `FileUpload` (`api.postAuth`) |
| `POST /update-file` | `{ fileName }` (la `key` de la versión) | Solo el estado | `DataManagement` |
| `POST /delete-file` | `{ fileName }` (la `key` de la versión) | Solo el estado | `DataManagement` |

### Contenido

| Endpoint | El frontend envía | El frontend lee | Quién lo llama |
|---|---|---|---|
| `GET /list-terms` | — | `data`: `[{ term }]` | `App`, `TermsManager` |
| `GET /list-images` | — | `data`: `[{ fileName, url }]` | `VegetationGallery`, `ImageGalleryManager` |
| `POST /upload-image` | `multipart`: `file`, `title` (el título se valida antes: sin `/ \ .. , ' : & # ? % "` ni caracteres de control) | Solo el estado | `ImageGalleryManager` |
| `DELETE /delete-image` | `{ imageKey }` (vale `fileName`) | Solo el estado | `ImageGalleryManager` |
| `POST /upload-term` | `{ term }` | Solo el estado | `TermsManager` |
| `DELETE /delete-term` | `{ term }` | Solo el estado | `TermsManager` |
| `POST /send-email` | `{ username, email, subject, message }` (límites en cliente: 100, 254, 150 y 2000 caracteres; además, el cliente comprueba antes de enviar el formato del correo y que el mensaje tenga al menos 20 caracteres, solo una ayuda: la validación del servidor sigue mandando y su límite propio es **(por confirmar)**) | Solo el estado. Distingue `429` y `400` | `ContactForm` |
| `GET /get-image?imageKey=` | — (`imageKey` con `encodeURIComponent`) | `data.imageUrl` | `ImageComponent`, solo si recibe `imageKey` (hoy ninguna pantalla se lo pasa **(por confirmar)**), e `ImageCarrousel` (no montado: import comentado en `Explore.js`) |

No usa `GET /healthcheck`.

## 3. El modelo de datos que da por hecho el frontend

Un **registro** es una fila del Excel. Lo que el frontend necesita que se cumpla:

| Regla | Quién depende de ella |
|---|---|
| Las claves son **exactamente** estas 11, con acentos y mayúsculas: `Provincia`, `Municipio`, `Altitud Media`, `Sector Biogeográfico`, `Piso Bioclimático`, `Ombrotipo`, `Naturaleza del Sustrato`, `Tipo de Serie`, `Serie de Vegetación`, `Vegetación Potencial`, `Especies Características` | Filtros, tabla, tarjetas, diálogo de detalle y traducciones (`attributes.*`) |
| `Especies Características` es la clave del explorador. Puede ser **cadena o array** (el backend la convierte en array solo si tiene comas) | `Explore`, `Filter`, `DialogSpecies` |
| Cualquier columna puede ser cadena o array | `Filter`, `Table`, `CSVfunctions` |
| Una clave `image`, si existiera, se excluye de los filtros (el backend actual no la genera) | `Filter` |
| Las celdas vacías confirmadas **omiten la clave** en ese registro | `Table` calcula las columnas como la unión de las claves de todos los registros (orden de primera aparición) |

Las columnas del Excel se leen **por posición** (`fixedColumnOrder` en `convertExcelToJson.js`), no por el nombre de la cabecera. Si se cambia el orden de las columnas en la plantilla que usan los investigadores, los datos se mezclan sin ningún aviso.

## 4. Sesión y autenticación

- Login: formulario propio en `/login` (correo y contraseña) con SRP contra `cognito-idp` (cliente público, sin secreto); la contraseña solo se usa para un cálculo local y nunca viaja. Retos que puede devolver Cognito: `NEW_PASSWORD_REQUIRED`, `MFA_SETUP` (registro de la aplicación de autenticación) y `SOFTWARE_TOKEN_MFA`. Con el resultado final guarda los tokens. Ante red, `5xx` o `429` al registrar el TOTP ofrece reintentar solo esa petición con la `Session` vigente, sin reenviar la contraseña nueva; el contrato con el backend no cambia. **(El flujo completo contra Cognito no se ha probado: por confirmar en `dev`.)**
- Los tokens van en `localStorage`: el de acceso en `token` y el de refresco en `refreshToken`. El `IdToken` nunca se guarda y ya no se usa `sessionStorage`. Solo lo tocan `services/session.js`, `services/api.js` y `ProtectedRoute` (este último hoy solo a través de `session.js`); `LoginForm` no los toca.
- El frontend **ya no decodifica el JWT ni lee `exp`**: la caducidad se detecta por el `401` del backend y se renueva con el token de refresco.
- `ProtectedRoute` llama a `GET /auth` al entrar en cada ruta privada (se repite al cambiar de ruta privada, sin cambio de contrato: es la misma petición con más frecuencia; y bajo `React.StrictMode` en desarrollo lo hace dos veces). Sin token de acceso o con `401` (tras intentar renovar) redirige a `/login`; con cualquier otro error (`503` agotado, `500`, `403`, red) muestra un aviso de servicio no disponible con botones «Reintentar» y «Cerrar sesión» y conserva la sesión.
- Cierre de sesión: botón en las rutas privadas (lo pinta `ProtectedRoute`). `api.logout` borra los dos tokens, revoca el de refresco con `RevokeToken` (`cognito-idp`, de mejor esfuerzo, hasta 3 s) y redirige a `/`. El backend no interviene.
- Un token de `JWT_EXPIRATION` muy largo ya no aplica al login: la caducidad la fija Cognito.
- **Un `401` en `GET /auth` y un `400` de `cognito-idp` en la consola de una sesión recién abierta son comportamiento esperado, sin acción para el backend (diagnóstico del 11/11/2026, leído del código; no medido en `dev`).** El `401` es el primer intento de `ProtectedRoute` con un token de acceso caducado o no válido: el cliente no lee `exp` y lo detecta por el `401` (`api.getAuth`, `api.js`). El `400` es la renovación `InitiateAuth` con `REFRESH_TOKEN_AUTH` contra `cognito-idp` rechazada (`api.js`), lo más probable por un refresco revocado o caducado; qué `__type` devuelve Cognito está **(por confirmar en `dev`)**: si resultara ser de configuración (p. ej. un cliente sin ese flujo), iría a [para-infra.md](para-infra.md). No contradice [seguridad.md S3](../guias/seguridad.md): una sola renovación por ráfaga de `401` (la promesa se comparte), `/auth` no se envía sin token, sin token de refresco no se llama a Cognito y la bandera `redirecting` evita reintentos tras redirigir.

## 5. CORS

El backend usa `cors({ origin: process.env.ALLOWED_ORIGIN })`, es decir, **un único origen** exacto por entorno. El frontend envía `Authorization` y `Content-Type: application/json`, lo que provoca petición previa (`OPTIONS`); con el paquete `cors` esto funciona sin más configuración. **(verificado)**

Orígenes que debe aceptar cada entorno:

| Entorno | Origen del frontend |
|---|---|
| Local | `http://localhost:3000` |
| Preproducción | La URL de Amplify de la rama `feature/testing` (`https://feature-testing.<app-id>.amplifyapp.com`, por confirmar) |
| Producción | El dominio final del frontend (aún sin DNS en `sigmetum-infra`) |

Si se necesita más de un origen a la vez (por ejemplo, el dominio final y la URL de Amplify), habrá que pasar a una lista o a una función en `cors`.

## 6. Discrepancias verificadas hoy

Son casos en los que lo que hace el frontend y lo que hace el backend **no encajan** en las versiones actuales. Cada una indica quién debe tocar qué. Las resueltas (D2 a D8) están en el historial de [09](../09-estado-actual-y-deuda-tecnica.md#historial-de-iteraciones).

| Id | Qué pasa | Dónde | Qué hay que hacer |
|---|---|---|---|
| **D1** | **Abrir una versión en "Administrar datos" falla (por confirmar).** `/list-files` devuelve claves de Excel (`data/Malaga/2026-01-15_v1.xlsx`), el frontend las pide a `GET /get-data/<key>` y el backend hace `JSON.parse` del fichero, que es un `.xlsx` binario. Resultado esperado: error 500 y el aviso de "no se pudo cargar el archivo" | `FileDropdown.handleVersionSelect`, `getFileFromS3` | **Backend:** un endpoint que convierta un Excel de versión en registros (con `convertExcelToJson`), limitado a claves `data/<provincia>/AAAA-MM-DD_vN.xlsx`. **Frontend:** llamar a ese endpoint. **Importante:** el backend propone cerrar `/get-data` (su doc 07, sección seguridad). No lo cierres antes de tener el endpoint nuevo |
| **D9** | Las URLs prefirmadas de la galería caducan a la hora. El frontend las pide al entrar en la página, así que una pestaña abierta más de una hora empieza a mostrar imágenes rotas | `VegetationGallery` | Informativo. Si molesta, subir `expiresIn` o refrescar desde el frontend |

**Hallazgos de la prueba en preproducción atendidos solo en el frontend (30/10/2026):** F13 (favicon), F14 (título por página, `lang` de `<html>` y clave de traducción de la galería vacía) y F15 (avisos de React Router) figuran en `sigmetum-backend/docs/integracion/para-frontend.md` y se corrigen en el frontend, **sin ningún cambio de contrato con la API**: no cambia ninguna llamada, cabecera ni respuesta. F16 es de infraestructura; ver [para-infra.md](para-infra.md#3-variables-de-entorno-del-frontend). Detalle en el historial de [09](../09-estado-actual-y-deuda-tecnica.md#historial-de-iteraciones).

## 7. Si cambias algo en el backend

| Si cambias... | Actualiza en el frontend... |
|---|---|
| El prefijo de la API | Variable `VITE_API_PREFIX` (configuración de Amplify) |
| El envoltorio `{ success, data \| error }` | `services/api.js` (un único sitio) |
| El nombre, orden o número de columnas del Excel | Traducciones (`languages/*/translation.json`, bloque `attributes`), `DialogSpecies.js` (`uniqueAttributes`) y `Filter`/`Explore` si cambia `Especies Características` |
| El formato de nombres de versión (`AAAA-MM-DD_vN.xlsx`) | `utilities/FormatFileName.js` (busca `AAAA-MM-DD_vN.xlsx` al final del nombre) y `FileDropdown` |
| La forma de `emptyFields` o `draftKey` en el `400` de `/upload` | `components/FileUpload.js` |
| Los campos de `/list-files` (`key`, `name`) | `components/FileDropdown.js` |
| Las claves o la validación del token de acceso de Cognito (`kid`, `iss`, `client_id`) | Nada en el código (no lo decodifica); un cambio de pool o de cliente es de variables `VITE_COGNITO_*` y de infra |
| El texto o el estado del `503` de autenticación (`Authentication service unavailable`) | `services/api.js` (`AUTH_UNAVAILABLE` y `RETRY_DELAYS_MS`) |
| El origen permitido por CORS | Nada en el código, pero hay que asegurar que `ALLOWED_ORIGIN` coincide con el dominio del frontend de cada entorno |
| Añades un endpoint protegido | Un método nuevo en `services/api.js` si necesita un verbo distinto |
| Cierras o restringes `/get-data` | `FileDropdown` (ver D1) |
| Límites de tamaño o tipo de fichero en `/upload` o `/upload-image` | Mensajes de error y `accept` de los formularios |

## 8. Compatibilidad de versiones

| Frontend | API | Comentario |
|---|---|---|
| `feature/sigmetum_front_v2` | `/api/v1`, backend `feature/sigmetum_v2` (`2864327`) | Tiene las discrepancias D1 y D9 de arriba (D2 a D8 resueltas el 30/10/2026) |
| Anterior a la migración a `/api/v1` | Sin prefijo, respuestas sin envoltorio | **Incompatible** con la API actual |

Cuando se introduzcan cambios incompatibles en la API, conviene subir el prefijo (`/api/v2`) y mantener el anterior hasta que el frontend se actualice, en lugar de cambiar `/api/v1` en caliente.

## 9. Cómo mantener este documento

- Se actualiza en el mismo commit que cambia cualquiera de los archivos de la sección 7.
- Las discrepancias resueltas se pasan a una línea en el historial de [09-estado-actual-y-deuda-tecnica.md](../09-estado-actual-y-deuda-tecnica.md) y se quitan de la sección 6.
- Siguiente paso recomendado: tests de contrato en el frontend, con fixtures de respuestas reales de la API, para que un cambio incompatible falle en un test y no en producción.
