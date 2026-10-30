# M2 y M18, FileUpload a services/api.js: plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-m2-m18-fileupload-a-api-design.md`

## Notas de la segunda opinión y decisiones del usuario (obligatorias)

1. Entran el paso 4 (`scripts/quality-check.mjs`) y la edición de las guías (decidido por el usuario).
2. Control de flujo en `FileUpload`: con un `catch` interno por llamada, `draft` se declara fuera del `try` interno. Si el upload es 2xx, `draft` queda `undefined` y se salta al siguiente archivo sin abrir el diálogo (conserva el `continue` implícito actual).
3. Cierre del "(por confirmar)" de `success: true`: el backend devuelve siempre `success: true` en 2xx en `/upload` (`routes/data.js` línea 161) y en `/upload/confirm` (líneas 192 y 207), según el revisor. Consta en el aviso de PR; el tester lo contrasta si puede.
4. La diferencia residual del aviso de PR se generaliza: un 2xx sin `success: true` o con cuerpo no JSON, en confirmar y cancelar, pasa de silencioso a `errorUploadMessage` (más `setFiles([])` al confirmar).
5. En `scripts/quality-check.mjs` la clave `debt` queda como `{}` y no se borra (la línea que la indexa la necesita).
6. Vigilar `npm run lint`: los `try/catch` anidados podrían subir avisos; el tope es 63.

Crítico: sí (sesión y token en `services/api.js`; contrato con el backend; `api.js` y `FileUpload.js` están en `areasContrato`).

## Advertencias para el developer

- Los archivos están en LF. No escribir recuentos tipo "N tests" o "N claves" en documentos fuera de `docs/09` (`docs:check` los rechaza).
- No editar documentos, no hacer commit ni `git add`.

## Decisiones de diseño

1. **`api.js`, cambio mínimo.** Solo `if (json.data !== undefined) error.data = json.data;` en el bloque de error general, tras `error.serverMessage = json.error;`. No se toca el bloque del 401, que se comprueba antes de `response.json()`. `const json = await response.json()` queda igual, así que un cuerpo no JSON sigue lanzando `SyntaxError` sin `type`; esa falta de `type` es la que usa `FileUpload` para distinguir.

2. **Estructura de `FileUpload`.** Un único `try { ... } catch { ... } finally { onLoad(false) }` por archivo, con las mismas ramas, y un `try/catch` interno por cada llamada a la API. Un único try/catch no distingue qué ramas conservan `files` y cuáles lo vacían; un helper nuevo añadiría abstracción innecesaria. Un `break` dentro de un `catch` interno que está dentro del `try` externo sigue ejecutando el `finally`, así el 401 deja `onLoad(false)`.
   - **Upload.** `try { await api.postFormAuth('/upload', formData) }`. En el `catch (error)`:
     - `status === 401`: `allFilesUploadedSuccessfully = false; break;` (sin diálogo ni `setFiles`).
     - `status === 400 && Array.isArray(error.data?.emptyFields)`: guardar `error.data` como `draft` y seguir al flujo de diálogo.
     - `error.type === 'http'`: error de subida, `showDialog(errorUploadMessage)`, `break`, sin vaciar `files` (como hoy). Incluye un `2xx` sin `success`.
     - Cualquier otro (red, `SyntaxError`): `throw error`; cae en el `catch` externo (`errorUploadMessage` y `setFiles([])`), como hoy.
   - **Diálogo.** Igual que hoy (`onLoad(false)`, `rowEmpty`, `emptyFieldsSummary`), con `draft.draftKey` y `draft.emptyFields`.
   - **Confirmar** (`onLoad(true)`). `try { await api.postAuth('/upload/confirm', { confirmed: true, draftKey }) }`. En el `catch (error)`: `401` -> `allFilesUploadedSuccessfully = false; break;`; `404` -> `allFilesUploadedSuccessfully = false; showDialog(errorDraftNotFound); break;`; cualquier otro -> `throw error` (error de subida y `setFiles([])`, como hoy).
   - **Cancelar.** `try { await api.postAuth('/upload/confirm', { confirmed: false, draftKey }) }`. En el `catch (error)`: `401` -> `allFilesUploadedSuccessfully = false; break;` (sin diálogo); `error.type === 'network'` -> `throw error` (hoy un fallo de `fetch` al cancelar cae en el `catch` externo y vacía `files`); otro error -> `showDialog(status === 404 ? 'dialogAdvice.errorDraftNotFound' : 'dialogAdvice.errorUploadMessage')` y conservar `files`. Tras el `try/catch`: `allFilesUploadedSuccessfully = false; break;` (como hoy).
   - Quitar `import env`; añadir `import api from '../services/api'`. Sin `fetch`, `localStorage` ni `Authorization`.
   - **Diferencia residual (a documentar en el aviso de PR):** hoy confirmar y cancelar no leen el cuerpo; con `api.js`, un `2xx` con cuerpo no JSON al confirmar o cancelar pasa a ser un `SyntaxError`. El backend siempre responde JSON, así que no es realista **(por confirmar)**.

3. **Tests de `FileUpload`.** Siguen simulando `fetch` global con `jsonResponse` y `draftResponse` (`api.js` llama a `fetch` con `${env.BASE_URL}${env.API_PREFIX}${path}`): cubren `api.js` y el componente a la vez, y `confirmCalls` ya filtra por `url.endsWith('/upload/confirm')`. En `beforeEach`: `vi.stubGlobal('location', { assign })` y `localStorage.setItem('token', 'abc')`; en `afterEach`: `vi.unstubAllGlobals(); localStorage.clear();`. `window.location.assign` no es espiable en jsdom, por eso el stub de `location` como en `api.test.js`. La cabecera se comprueba con `fetchMock.mock.calls[i][1].headers.Authorization === 'Bearer abc'`; el 401, con `localStorage.getItem('token')` a `null` y `assign` llamado con `'/login'`.

4. **Test de `api.js` para `error.data`.** `describe` nuevo en `api.test.js`, con `fetch` stubbeado como el existente: `400` con `data` por `postFormAuth` (`rejects.toMatchObject({ type: 'http', status: 400, serverMessage, data: { emptyFields: [{ rowIndex: 3 }], draftKey: 'k' } })`); `400` sin `data` (el error no tiene la propiedad `data`); `200` con cuerpo no JSON en `getAuth` lanza `SyntaxError` (guard del comportamiento actual).

5. **Riesgo `success: true`.** Un `2xx` sin `success: true` lanza en `api.js` y se vería como fallo de subida. `para-frontend.md` del backend (línea 34) dice que `response.ok` y `success: true` van siempre juntos. No se ha verificado el controlador de `/upload` ni `/upload/confirm`: **(por confirmar)**, no bloquea.

## Fase 1

1. **`api.js`: conservar `data` del error (TDD)**
   - Archivos: `src/services/api.test.js` (primero), `src/services/api.js`.
   - Añadir los tests del apartado 4 y ejecutar `npx vitest run src/services/api.test.js`: el de `data` debe fallar porque `data` es `undefined`; los otros dos ya pasan. Después el cambio de una línea y todo en verde, con el `describe` del 401 existente sin cambios.
   - Norma: `docs/guias/seguridad.md` (token solo en `api.js`); `docs/integracion/para-backend.md` sección 3.

2. **`FileUpload.test.js`: adaptar y añadir tests (rojos antes de migrar)**
   - Archivo: `src/components/FileUpload.test.js`. Los tests existentes se mantienen sin cambios de aserción. Añadir los stubs de `location` y del token y extraer del helper `uploadOneFile` un `selectAndSubmit(user)` (selecciona y pulsa subir), dejando `uploadOneFile` como `selectAndSubmit` más `findByText('dialogAdvice.fieldsMissingMessage')`.
   - Tests nuevos: cabecera `Authorization: Bearer abc` en `/upload` (cuerpo `FormData` con un único `file` llamado `Malagadatos.xlsx`) y en `/upload/confirm` con `confirmed: true` y con `confirmed: false` (`Authorization` y `Content-Type: application/json`; ya en verde); `401` en `/upload`, al confirmar y al cancelar (esperar `assign` con `'/login'`, `onLoad` con última llamada `false`, token `null`, ausentes `errorUploadMessage`, `successUploadMessage` y `errorDraftNotFound`, nombre del archivo aún en pantalla); `400` sin `emptyFields` (`errorUploadMessage`, no `fieldsMissingMessage`, una sola llamada a `fetch`, archivo conservado; ya en verde); confirmar con `500` (`errorUploadMessage` y `files` vaciado; ya en verde).
   - Comprobación: `npx vitest run src/components/FileUpload.test.js`. Con el componente actual fallan los tres de `401` (el token no se borra y no hay redirección; además en `/upload` aparece `errorUploadMessage`); el resto pasa.
   - Norma: `docs/guias/buenas-practicas-frontend.md`; `docs/guias/seguridad.md`.

3. **`FileUpload.js`: migrar a `api.js`**
   - Archivo: `src/components/FileUpload.js`. `handleSubmit` conserva firma y orden; estructura según el apartado 2. Sin cambios en `normalizeFileName`, el JSX, `accept` ni las claves i18n.
   - Comprobación: el archivo de test en verde (incluidos los tres `401`), luego `npm test`. Grep de `fetch`, `localStorage`, `Authorization` y `env` en `FileUpload.js` sin coincidencias. `npm run lint` y `npm run quality` en verde.
   - Norma: `docs/guias/buenas-practicas-frontend.md`; `docs/guias/seguridad.md`; `docs/integracion/para-backend.md` (`draftKey` opaco y reenviado tal cual, F11).

4. **`scripts/quality-check.mjs`: retirar la deuda registrada de `FileUpload`**
   - Archivo: `scripts/quality-check.mjs`: borrar `debt: { 'src/components/FileUpload.js': 'M2 (usa fetch directo y lee el token)' }` de `KNOWN_DEBT.localStorage` (línea ~34), dejando `debt: {}`.
   - No está en la spec, pero es una referencia a M2 que este cambio deja obsoleta. Incluido si se aprueba; si se considera fuera de alcance, omitir el paso y anotar la deuda residual en `docs/09`.
   - Comprobación: `npm run quality` pasa sin la nota de `FileUpload.js`; un uso futuro de `localStorage` en `FileUpload.js` volvería a fallar.
   - Norma: `docs/guias/seguridad.md`.

## A cargo del tester-documentador

- `docs/09-estado-actual-y-deuda-tecnica.md`: M2 y M18 a "Resueltos" (hash **(por confirmar)** hasta el commit); quitarlos de "Prioridad media" y el punto 7 de la hoja de ruta; retirar las limitaciones de `FileUpload` ante `401` y de `fetch` propio (línea ~47 y fila de M2), manteniendo la del `404` por estado; en M12 (Resueltos) sustituir el "(por confirmar)" del hash por `6d089a6`; historial con la fecha de hoy, "Última actualización" y cifras recalculadas con `npm run docs:check -- --metrics` y `npm test`; mencionar la retirada de la deuda en `scripts/quality-check.mjs` si se hace el paso 4.
- `docs/03-api.md`: quitar que `FileUpload` usa `fetch` propio y no redirige ante `401`; documentar `error.data` (= `json.data`, solo si la respuesta lo trae); filas de `/upload` y `/upload/confirm` sin "con `fetch` directo".
- `docs/05-componentes.md` (`FileUpload`): usa `api.js`, no lee el token, el `401` redirige a `/login` (lo hace `api.js`); quitar "mantiene su `fetch` propio" y la referencia a M2/M18; anotar que el `404` de confirmar se interpreta por estado.
- `docs/08-guia-desarrollo.md`: fila de `FileUpload.test.js` con `401` en las tres rutas, `400` sin `emptyFields`, cabecera `Authorization` y confirmar con `500`; mencionar que los tests ahora también stubbean `location` y el token; la retirada de la deuda de `quality-check.mjs` si se hace el paso 4.
- `docs/integracion/para-backend.md`: fila `401`, nota de sesión caducada y filas de `/upload` y `/upload/confirm` sin "`FileUpload` con `fetch` propio no redirige"; la fila `404` mantiene la interpretación por estado.
- `docs/01-arquitectura.md` (diagrama de subida): revisar que no diga que `FileUpload` usa `fetch` directo; si no lo dice, no tocarlo.
- Aviso de PR nuevo `docs/specs/2026-10-30-m2-m18-fileupload-a-api-aviso-pr.md`: qué cambia (`error.data` en `api.js`, el `401` de `FileUpload` ahora redirige, `success: true` exigido en `/upload` y `/upload/confirm`), qué debe hacer cada repositorio, la diferencia residual de cuerpo no JSON en confirmar y cancelar, la limitación del `404` por estado, y la línea `Integración:` indicando que `para-backend.md` cambia. El aviso antiguo `2026-10-30-integracion-backend-lotes-abc-aviso-pr.md` no se edita.
- Guías: editar las cuatro líneas que citan M2 como deuda (corrección factual): `docs/guias/seguridad.md` (línea ~39 y ~129) y `docs/guias/buenas-practicas-frontend.md` (línea ~50 y la fila de `fetch` directo de ~156).
- Verificación final: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate`. `agentes:test` no aplica. Proponer el mensaje de commit.

## Pruebas

- Nuevas en `src/services/api.test.js`: `error.data` presente con `status`, `type` y `serverMessage` intactos; ausente si no hay `data`; no JSON con 200 lanza `SyntaxError`.
- Nuevas y modificadas en `src/components/FileUpload.test.js`: stubs de `location` y token; cabecera `Authorization` y cuerpo en las tres llamadas; `401` en `/upload`, al confirmar y al cancelar; `400` sin `emptyFields`; confirmar con `500` vacía `files`.
- Comandos: `npx vitest run src/services/api.test.js src/components/FileUpload.test.js`, luego `npm test`, `npm run lint` y `npm run quality`.
