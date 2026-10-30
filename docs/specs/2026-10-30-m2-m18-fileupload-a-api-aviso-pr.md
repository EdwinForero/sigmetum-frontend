# Aviso para PR: M2 y M18, FileUpload a services/api.js

Fecha: 30/10/2026 · Spec: `docs/specs/2026-10-30-m2-m18-fileupload-a-api-design.md`

Integración: `docs/integracion/para-backend.md` cambia (sección 2: fila `401` y fila `404`; sección 3: filas de `/upload` y `/upload/confirm`; nota de sesión caducada). `para-infra.md` no cambia.

## Qué cambia en el contrato (áreas tocadas: `services/api.js`, `FileUpload.js`)

- `api.js`: el error de una respuesta fallida conserva `json.data` como `error.data`, solo si la respuesta lo trae. `type`, `status`, `serverMessage`, los valores de retorno y el comportamiento ante `401` no cambian.
- `FileUpload` envía `POST /upload` con `api.postFormAuth` y `POST /upload/confirm` con `api.postAuth`. Rutas, cuerpos (`multipart` con campo `file`; JSON `{ confirmed, draftKey }`) y cabecera `Authorization` son los mismos que antes.
- Un `401` en `/upload`, al confirmar o al cancelar ahora borra el token y redirige a `/login` (lo hace `api.js`), sin diálogo de error. Antes `FileUpload` mostraba el error de subida y no redirigía. Resuelta la limitación del aviso `2026-10-30-integracion-backend-lotes-abc-aviso-pr.md`.
- `api.js` exige `success: true` también en `/upload` y `/upload/confirm`.

## Qué debe hacer cada repositorio

- Backend: nada obligatorio. Debe mantener `success: true` en los `2xx` de `/upload` y `/upload/confirm`, y la forma `data.emptyFields[].rowIndex` y `data.draftKey` del `400` de `/upload`.
- Infra: nada.

## Diferencia residual

1. Un `2xx` sin `success: true` o con cuerpo no JSON, en `/upload`, al confirmar y al cancelar, antes pasaba en silencio (solo se miraba `response.ok`) y ahora es un error de `api.js`:
   - `/upload` sin `success: true`: `errorUploadMessage` y se detiene la cola, conservando `files`. Con cuerpo no JSON: lo recoge el `catch` externo (`errorUploadMessage` y `setFiles([])`).
   - Confirmar: `errorUploadMessage` y `setFiles([])`.
   - Cancelar: `errorUploadMessage` conservando `files`.

   Con el backend actual no ocurre: `routes/data.js` del backend devuelve `success: true` en `/upload` (línea 161) y en `/upload/confirm` (líneas 192 y 207). Verificado contra el código del backend; no se ha probado con un backend en ejecución **(por confirmar)**.

2. El diálogo de campos vacíos ahora exige `status === 400` y `Array.isArray(error.data?.emptyFields)`; antes bastaba cualquier respuesta no `ok` con `data.emptyFields` truthy. Con el backend actual es equivalente (solo el `400` envía `emptyFields`). Otro estado con `emptyFields` (p. ej. `422`) pasaría a `errorUploadMessage` y detendría la cola.

## Limitaciones conocidas

- El `404` de `/upload/confirm` (confirmar o cancelar) se interpreta solo por el estado: cualquier `404` en esa ruta se muestra como "el borrador ya no existe", sin leer `Draft not found`. Sigue vigente (decisión aceptada).
- Los tests simulan la API: no se ha probado contra un backend real **(por confirmar)**.
