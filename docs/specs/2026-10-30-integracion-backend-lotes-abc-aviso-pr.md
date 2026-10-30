# Aviso para PR: integración con el backend, lotes A, B y C

Fecha: 30/10/2026 · Spec: `docs/specs/2026-10-30-integracion-backend-lotes-abc-design.md`

Integración: `docs/integracion/para-backend.md` cambia (secciones 1, 2, 3, 4, 6, 7 y 8: gestión de `401`, `429`, `400` y `404`; D2 a D8 retiradas; fecha y commit de la verificación). `para-infra.md` no cambia.

## Qué cambia en el contrato (áreas tocadas: `services/api.js`, `FileUpload.js`, `LoginForm.js`)

- `api.js`: un `401` en una llamada que envía token (`getAuth`, `postAuth`, `postFormAuth`, `deleteAuth`) borra `localStorage['token']` y redirige a `/login`. `POST /log` y las rutas sin token no.
- `LoginForm` y `ContactForm` distinguen `429`; `ContactForm` también `400`. `ContactForm` limita la longitud (nombre 100, correo 254, asunto 150, mensaje 2000).
- `FileUpload`: solo `.xlsx`; un `404` de `/upload/confirm` (confirmar o cancelar) muestra "el borrador ya no existe"; se comprueba el resultado de cancelar.
- `ImageGalleryManager` rechaza en cliente títulos con `/ \ .. , ' : & # ? % "` o caracteres de control. `imageKey` se envía con `encodeURIComponent`.
- `Table` toma las columnas de la unión de claves; `FormatFileName` entiende `AAAA-MM-DD_vN.xlsx`.

## Qué debe hacer el otro repositorio

- Backend: nada obligatorio. Puede cerrar en `para-frontend.md` las condiciones de abajo. D1 sigue abierta (endpoint que convierta una versión Excel en registros, `backend:F1`).
- Infra: nada.

## Condiciones por confirmar del backend, contrastadas con el código del frontend

| Condición | Resultado contra el código | Estado |
|---|---|---|
| F7 a: las entradas reales cumplen las reglas | `ContactForm` pone `maxLength` 100, 254, 150 y 2000 (test). No filtra caracteres de control ni el apóstrofo del correo (`o'brien@example.com` lo rechazaría el backend con `400`, que ahora se muestra como "revisa los datos"). Las claves de `list-images` no se han contrastado con una galería real | Parcial; el resto **(por confirmar)** |
| F7 b: error visible ante `429` y `400` de `/send-email` | Confirmada: `429` y `400` tienen mensaje propio, el resto el genérico (tests) | Confirmada |
| F7 c: no enviar a `DELETE /delete-image` claves que la regla rechace | Envía el `fileName` de `GET /list-images` tal cual. El título nuevo se valida antes de subir, pero imágenes ya existentes con claves que la regla rechace seguirían dando `400` (error genérico) | **(por confirmar)** con el listado real de la galería |
| F7 d: llamadas sin token a `send-email`, `list-images`, `get-image`, `list-terms` y no usar su `401` como señal | Confirmada: todas van por `api.post` o `api.get` (sin `Authorization`) y su `401` no borra el token ni redirige. `ImageGalleryManager` usa `api.get('/list-images')` aunque sea una pantalla privada | Confirmada |
| F7 e: ningún flujo consume el `404` de rutas inexistentes | `api.js` no compara estados. `FileUpload` interpreta `404` solo en `/upload/confirm` (ver F10). `FileDropdown` no distingue estados | Confirmada, salvo F10 |
| F10: nadie interpreta el `404` como "no existe" | **No se cumple del todo**: `FileUpload` trata cualquier `404` de `/upload/confirm` como "el borrador ya no existe", por estado y sin leer el texto. Con F11 es correcto para `Draft not found`; un `404` `The requested file does not exist in storage` en esa ruta (carrera, F10) se mostraría igual. `FileDropdown` no interpreta `404` | Compatible con F11; **(por confirmar)** si el backend quiere que se distinga por texto |
| F11: el `draftKey` es opaco | Confirmada: `FileUpload` lo toma de `data.draftKey` del `400` y lo reenvía sin interpretarlo en `/upload/confirm` (confirmar y cancelar) | Confirmada |
| F11: error ante el `404` | Antes: error genérico. Ahora: mensaje propio `errorDraftNotFound` (tests de confirmar y cancelar) | Confirmada |

No contrastadas en esta iteración: F8 (que `FileDropdown`/`FileUpload` envíen solo claves salidas de `list-files` o `draftKey`: así es en el código, pero un `400` de `/upload` que no sea de campos vacíos (provincia no válida, F8/F12) se muestra como error de subida genérico) y las carpetas reales del bucket **(por confirmar)**.

## Limitaciones conocidas

- `FileUpload` no redirige a `/login` ante un `401` (leería el token fuera de los archivos permitidos; se resolvería migrándolo a `api.js`, M2/M18 en `docs/09`).
- El `404` de `FileUpload` se interpreta solo por el estado.
- Los tests simulan la API: no se ha probado contra un backend real **(por confirmar)**.
