# Integración con el backend: lo que espera el frontend

Documento para quien mantiene `sigmetum-backend`. Explica **qué consume el frontend y qué da por hecho**, para poder cambiar la API sin romper la web.

- La referencia completa de la API es la del propio backend: `sigmetum-backend/docs/04-api.md`. Aquí no se repite.
- Lo verificado contra el código está marcado así: **(verificado)**. Lo deducido pero no probado contra un S3 real, como **(por confirmar)**.
- Fecha de la verificación: 30/10/2026. Frontend: rama `feature/sigmetum_front_v2`, sobre el commit `a895e41` (cambios sin confirmar de los lotes A, B y C). Backend: rama `feature/sigmetum_v2`, commit `2864327` (cambios `F2` a `F12` de su `para-frontend.md`; los tests del frontend simulan la API, no se ha probado contra un backend real **(por confirmar)**).

## 1. Cómo llama el frontend a la API

Todo pasa por [src/services/api.js](../../src/services/api.js).

| Aspecto | Comportamiento |
|---|---|
| URL | `VITE_BASE_URL` + `VITE_API_PREFIX` + ruta. El prefijo debe coincidir con `API_PREFIX` del backend (`/api/v1`) |
| Éxito | Solo se considera éxito si `response.ok` **y** `json.success === true`. Devuelve `json.data` |
| Error | Cualquier otro caso lanza un error con `status` y `type: 'http'`. El cuerpo debe ser JSON con `{ success: false, error }`. Una respuesta no JSON (un 502 de un proxy) también acaba en error genérico |
| Autenticación | `Authorization: Bearer <token>`, con el token de `localStorage['token']` |
| Mensajes de error | El frontend **no muestra** el texto de `error` del servidor: usa sus propios mensajes traducidos, elegidos por el **estado HTTP** (nunca por el texto). Distingue los de la tabla de abajo; el resto de estados cae en el mensaje genérico del componente |

Qué hace el frontend según el estado:

| Estado | Dónde | Comportamiento |
|---|---|---|
| `401` | Métodos `*Auth` de `api.js` (`getAuth`, `postAuth`, `postFormAuth`, `deleteAuth`) | Borra `localStorage['token']`, ejecuta `window.location.assign('/login')` y lanza el error igualmente (también con cuerpo no JSON). `api.get` y `api.post` (incluido `POST /log`) **no** borran ni redirigen. `FileUpload` usa `postFormAuth` y `postAuth`, así que un `401` en `/upload` o en `/upload/confirm` (confirmar o cancelar) también redirige |
| `429` | `POST /log` (`LoginForm`) y `POST /send-email` (`ContactForm`) | Mensaje propio: "demasiados intentos" (login) y "demasiados mensajes" (contacto), ambos con "inténtalo en 15 minutos" |
| `400` | `POST /send-email` (`ContactForm`) | "Revisa los datos del formulario". En `POST /upload` con `data.emptyFields` y `data.draftKey`, abre el diálogo de campos vacíos (sin cambios); el `draftKey` se reenvía sin interpretarlo |
| `404` | `POST /upload/confirm` (`FileUpload`), al confirmar o al cancelar | Se interpreta **solo por el estado** (no se lee el texto `Draft not found`): "El borrador ya no existe. Vuelve a subir el archivo." Un `404` con otro significado en esa ruta se mostraría igual **(por confirmar con el backend)** |
| Resto (`500`, red...) | Todos | Mensaje genérico del componente. Cancelar un borrador con un fallo distinto de `404` muestra el error de subida |

El frontend no necesita un código estable (`code`) en la respuesta: usa el estado HTTP.

## 2. Endpoints y campos que lee el frontend

Solo aparecen los campos que el frontend **lee**. Lo demás de la respuesta se ignora y se puede cambiar sin riesgo.

### Autenticación

| Endpoint | El frontend envía | El frontend lee | Quién lo llama |
|---|---|---|---|
| `POST /log` | `{ username, password }` | `data.token` | `LoginForm` |
| `GET /auth` | — | Solo el código de estado | `ProtectedRoute` (al entrar en cada ruta privada) |

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
| `POST /send-email` | `{ username, email, subject, message }` (límites en cliente: 100, 254, 150 y 2000 caracteres) | Solo el estado. Distingue `429` y `400` | `ContactForm` |
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

- El token se guarda en `localStorage['token']`. No hay cierre de sesión.
- El frontend **decodifica el JWT en el navegador y lee el campo `exp`** (segundos Unix). Si se cambia el formato de caducidad o se deja de incluir `exp`, el frontend tratará todos los tokens como caducados.
- `ProtectedRoute` llama a `GET /auth` al entrar en cada ruta privada. Cualquier fallo (401, red, 500) se trata como "sin sesión" y redirige a `/login`.
- Si el token caduca **durante** una sesión, la primera llamada protegida que devuelva `401` (métodos `*Auth` de `api.js`) borra el token y redirige a `/login`, sin diálogo previo ni conservar la ruta de origen. El `401` de `POST /log` y el de rutas que no envían token (`ContactForm`, `list-images`, `get-image`, `list-terms`) **no** se usan como señal de sesión caducada. `FileUpload` también redirige ante un `401` (usa `api.js`, sin diálogo de error).
- Un token de `JWT_EXPIRATION` muy largo es cómodo pero deja abierta la sesión. El frontend no impone ningún límite.

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
| Las claves del JWT o cómo caduca | `components/ProtectedRoute.js` (lee `exp`) |
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
