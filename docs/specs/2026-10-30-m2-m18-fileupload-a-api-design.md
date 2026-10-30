# M2 y M18, FileUpload a services/api.js: spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

`FileUpload` hace hoy `fetch` directo en tres sitios (`POST /upload`, `POST /upload/confirm` con `confirmed: true` y con `confirmed: false`) y lee `localStorage['token']` en cada uno, fuera de las tres excepciones de CLAUDE.md (`services/api.js`, `LoginForm`, `ProtectedRoute`). Por eso no redirige a `/login` ante un `401` (los métodos `*Auth` de `api.js` sí). Debe usar `api.js` (`postFormAuth` para `/upload`, `postAuth` para `/upload/confirm`) y dejar de tocar el token, sin perder el flujo de campos vacíos. El `404` de `/upload/confirm` se sigue interpretando por estado (limitación aceptada, ver "Decisiones"). Zona crítica: sesión/token y contrato con el backend.

## Decisiones del usuario

1. El `404` de `/upload/confirm` se sigue interpretando por estado: cualquier `404` en esa ruta se muestra como "el borrador ya no existe" (`dialogAdvice.errorDraftNotFound`). Es una limitación aceptada y se documenta; no se lee `serverMessage`.
2. Ante un `401`, `FileUpload` reconoce `error.status === 401` solo para no abrir el diálogo de error genérico antes de la redirección. No toca el token ni hace la redirección: la hace `api.js`.
3. El campo nuevo del error de `api.js` es `error.data` (= `json.data`), presente solo si la respuesta lo trae. `type`, `status`, `serverMessage` y las firmas no cambian.

## Comportamiento actual (contrastado con el código)

- `api.js` lanza un `Error` con `type`, `status` y `serverMessage`; descarta `json.data`. El `400` de `/upload` con campos vacíos lleva `data.emptyFields[].rowIndex` y `data.draftKey`, que `FileUpload` necesita.
- `api.js` lanza también si `!json.success` aunque el estado sea 2xx, y si el cuerpo no es JSON lanza un `SyntaxError` sin `type` (salvo el `401` en `*Auth`, que se comprueba antes de leer el cuerpo).
- Hoy `FileUpload` distingue: `/upload` con `400` y `data.emptyFields` (diálogo), otro fallo de `/upload` (error de subida, detiene la cola); confirmar con `404` (`errorDraftNotFound`, detiene la cola, no vacía `files`) u otro fallo (el `throw` cae en el `catch`: error de subida y `setFiles([])`); cancelar con `404` (`errorDraftNotFound`) u otro fallo (`errorUploadMessage`), en ambos sin vaciar `files`.

## Criterios de aceptación

### De código

1. `src/components/FileUpload.js` no contiene `fetch`, `localStorage` ni `Authorization`; no importa `env`. `npm run quality` y `npm run lint` pasan.
2. `POST /upload` se envía con `api.postFormAuth` (campo `file`, nombre normalizado como hoy) y `POST /upload/confirm` con `api.postAuth` y cuerpo `{ confirmed: true|false, draftKey }`. Se observa en los tests (la llamada a `fetch` o al mock de `api` lleva la cabecera `Authorization` y el cuerpo esperados).
3. `api.js` conserva el `data` de la respuesta de error en el error lanzado como `error.data` (= `json.data`), solo cuando la respuesta lo trae, en el camino de error general (no hace falta en el `401`). No cambian: `type`, `status`, `serverMessage`, `message`, los valores de retorno, las firmas de los métodos ni el comportamiento ante `401`. Un test de `api.js` o de un consumidor existente demuestra que `status` y `serverMessage` siguen igual y que `data` está disponible.
4. `FileUpload` reconoce los campos vacíos con `error.status === 400` y `Array.isArray(error.data?.emptyFields)` (o equivalente estricto). Cualquier otro `400` (p. ej. provincia no válida) se trata como error de subida genérico (`errorUploadMessage`) y detiene la cola, como hoy.
5. El `draftKey` se toma de `error.data.draftKey` y se reenvía tal cual, sin interpretarlo, a `/upload/confirm` (confirmar y cancelar) (backend F11). Test existente adaptado.
6. Un `401` en `/upload` o en `/upload/confirm` (confirmar o cancelar) borra `localStorage['token']` y llama a `window.location.assign('/login')`, ambos hechos por `api.js`. `FileUpload` solo reconoce `error.status === 401` para no abrir el diálogo de error genérico: no toca el token, no hace la redirección, no muestra diálogo de error ni de éxito por ese `401`, no vacía `files` por sí mismo y deja `onLoad(false)`. Un test por cada una de las tres rutas lo comprueba.
7. Se mantienen los comportamientos cubiertos hoy por `FileUpload.test.js`: diálogo de campos vacíos con `dialogAdvice.rowEmpty`/`emptyFieldsSummary`; confirmar activa el borrador y muestra éxito; cancelar envía `confirmed: false`, no muestra éxito y `onLoad(false)`; `404` al confirmar y al cancelar muestran `dialogAdvice.errorDraftNotFound` (decidido solo por el estado, al cancelar se conservan los archivos); cancelar con `500` muestra `errorUploadMessage` y conserva los archivos; `accept` solo `.xlsx`. El texto `error` del servidor nunca se muestra al usuario ni se usa para decidir; los mensajes salen de `t('dialogAdvice.*')`.
8. Los fallos que antes caían en el `catch` (error de red, confirmar con error distinto de `404`, cuerpo no JSON) siguen mostrando `errorUploadMessage`, deteniendo la cola y vaciando `files` como hoy; los de cancelar siguen conservando `files`.
9. Los tests de `FileUpload` se adaptan sin perder cobertura (siguen simulando la red con `fetch`, o `api` si se justifica) y se añaden los de `401` (criterio 6) y el de `400` sin `emptyFields` (criterio 4). Los demás tests del repositorio no cambian y pasan: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run agentes:test` si se toca `plugins/` (no se prevé).

### De documentación

1. `docs/09-estado-actual-y-deuda-tecnica.md`: M2 y M18 pasan a "Resueltos" (con su corrección y hash **(por confirmar)** hasta el commit); se quitan de "Prioridad media/pendiente" y del punto 7 de la hoja de ruta; se retiran solo la limitación de `FileUpload` ante `401` y la de `fetch` propio; **se mantiene** la limitación del `404` de `/upload/confirm` interpretado por estado (cualquier `404` en esa ruta se muestra como "el borrador ya no existe"); las referencias a M2 (`seguridad.md`, `buenas-practicas-frontend.md`) quedan coherentes (esas guías hay que avisarlas, no se editan en este rol); historial con la fecha de hoy; "Última actualización" y cifras recalculadas con `npm run docs:check -- --metrics` y `npm test`. En M12 (línea de "Resueltos") se sustituye el "(por confirmar)" del hash por `76d90f1`.
2. `docs/03-api.md`: sección "Ante un 401" sin la excepción de `FileUpload`; el error de `api.js` documenta `data` (= `json.data`, solo si la respuesta lo trae); las filas de `/upload` y `/upload/confirm` y la nota de `/upload` dejan de decir "con `fetch` directo".
3. `docs/05-componentes.md` (FileUpload): usa `api.js`, no lee el token, `401` redirige a `/login` (lo hace `api.js`); se quita "mantiene su `fetch` propio" y la referencia a M2/M18; se anota que el `404` de confirmar se interpreta por estado.
4. `docs/08-guia-desarrollo.md`: fila de `FileUpload.test.js` con los casos nuevos de `401` y `400` sin `emptyFields`; y, si cambia cómo se simula la red, la línea de `vi.stubGlobal('fetch', ...)`.
5. `docs/integracion/para-backend.md`: filas `401` (sección 2) y nota de sesión caducada (línea ~90) sin "`FileUpload` con `fetch` propio no redirige"; filas de `/upload` y `/upload/confirm` (sección 3) sin `fetch` propio; la fila `404` **mantiene** que el frontend lo interpreta por estado (cualquier `404` en `/upload/confirm` se muestra como borrador inexistente).
6. Aviso `docs/specs/*-aviso-pr.md` nuevo (áreas de contrato: `api.js` y `FileUpload.js`): lista qué cambia en el contrato, qué debe hacer cada repositorio, y la línea `Integración:` indica que `para-backend.md` cambia (si cambia; si finalmente no cambia nada del contrato, `Integración: sin impacto — <motivo>`). Cita como resuelta la limitación de `FileUpload` ante `401` y como vigente la del `404` por estado; el aviso antiguo `2026-10-30-integracion-backend-lotes-abc-aviso-pr.md` no se edita sin pedirlo.
7. `npm run docs:gate` en verde antes del commit.

## Fuera de alcance

- M1 (JWT en `localStorage`, cerrar sesión), D1, infraestructura, B1/B3/B4.
- Cambiar el contrato del backend, el `accept` de `.xlsx`, textos o claves de i18n existentes, ni la lógica de subida uno a uno.
- Migrar otros consumidores de `fetch` (no hay otros según M2) ni cambiar el manejo de errores de `LoginForm`, `ContactForm` y demás.
- Conservar la ruta de origen tras el `401` (sigue yendo a `/login` sin diálogo, como el resto).
- Distinguir los `404` de `/upload/confirm` por `serverMessage`: se mantiene la interpretación por estado.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: lo afecta solo en lo que documenta del frontend (gestión de `401` en `FileUpload`, forma de los endpoints). No cambian rutas, cuerpos ni cabeceras enviadas al backend: `/upload` sigue con `multipart` y `Authorization`; `/upload/confirm` sigue con JSON y `Authorization`. El `404` sigue interpretándose por estado. Una diferencia observable: `api.js` exige `success` verdadero en la respuesta, y un `2xx` sin `success: true` ahora sería un fallo de subida **(por confirmar con el backend que `/upload` y `/upload/confirm` devuelven siempre `success: true` en el éxito)**.
- `docs/integracion/para-infra.md`: no lo afecta.

## Preguntas abiertas

Ninguna. Las tres anteriores quedaron resueltas por el usuario (ver "Decisiones del usuario"). Queda solo una verificación de integración marcada **(por confirmar)** en "Impacto en contratos externos" (`success: true` en el éxito de `/upload` y `/upload/confirm`), que no bloquea la spec.
