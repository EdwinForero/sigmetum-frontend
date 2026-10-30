# Integración con el backend, lotes A, B y C: spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

Alinear el frontend con los cambios ya desplegados en el backend (`backend:F2` a `F12`, `sigmetum-backend/docs/integracion/para-frontend.md`) y cerrar las discrepancias D2, D3, D4, D6 y D7 de `docs/integracion/para-backend.md`. Se evita que entradas del usuario que el backend ahora rechaza con `400` lleguen a la API sin aviso claro, y que `401`, `429` y `404` se traten como un error genérico. Se actualiza la documentación de integración para reflejar lo resuelto.

## Decisiones del usuario (cierran las preguntas abiertas)

- Redirección en `401`: `window.location.assign('/login')` tras borrar el token, solo en los métodos `*Auth` de `api.js`. El `401` de `POST /log` y el de rutas que no envían token **no** redirigen. Se redirige directamente (sin diálogo previo) y no se conserva la ruta de origen: `LoginForm` mantiene su destino actual.
- Mensaje de título de imagen inválido: genérico y corto, por ejemplo "El título no puede contener / \ .. , : & # ? % ni comillas", con claves i18n en `es` y `en`.
- `FileUpload`: se mantiene el `fetch` propio; se maneja `404` `Draft not found` (mensaje al usuario) y se comprueba el resultado de cancelar. No se migra a `api.js`.
- `encodeURIComponent` de `imageKey` en `ImageCarrousel` e `ImageComponent`. El título de imagen se valida solo por caracteres, sin tope de longitud, y se rechaza (no se sanea).
- Textos de i18n: los de la tabla siguiente.

| Caso | es |
|---|---|
| Login `429` | Demasiados intentos. Inténtalo de nuevo en 15 minutos. |
| Contacto `429` | Has enviado demasiados mensajes. Inténtalo de nuevo en 15 minutos. |
| Contacto `400` | Revisa los datos del formulario. |
| `Draft not found` | El borrador ya no existe. Vuelve a subir el archivo. |
| Título de imagen inválido | El título no puede contener / \ .. , : & # ? % ni comillas. |

Las versiones en `en` las redacta el desarrollo con el mismo sentido.

## Criterios de aceptación

### De código

#### Lote A: validación y formato en cliente

1. (#2, D3) El selector de `FileUpload` acepta solo `.xlsx`: el atributo `accept` no contiene `.csv`, `.xls` ni `application/vnd.ms-excel`. Se comprueba con un test del componente.
2. (#3, D2) `FormatFileName` convierte `2026-09-15_v3.xlsx` en `15/09/2026 · V3`. Un nombre que no cumple `AAAA-MM-DD_vN.xlsx` se sigue mostrando sin cambios (comportamiento actual). Se comprueba con tests de la utilidad, incluidos `_v10` y un nombre con ruta (por ejemplo `data/Malaga/2026-09-15_v3.xlsx`, según lo que reciba hoy la utilidad).
3. (#6) Los campos de `ContactForm` limitan la longitud: nombre 100, asunto 150, mensaje 2000, correo 254. Test: el atributo `maxLength` de cada campo tiene ese valor.
4. (#9) `ImageGalleryManager` rechaza en cliente, antes de llamar a `/upload-image`, un título que contenga `/`, `\`, `..`, un carácter de control o cualquiera de `, ' : & # ? %` (y comillas). Muestra el mensaje genérico y corto acordado, con clave i18n en `es` y `en`, y no hace la petición. La validación es solo por caracteres: no hay tope de longitud. Un título válido sigue subiéndose. Se comprueba con tests (un caso por carácter prohibido y uno válido).
5. (#9) `ImageCarrousel` e `ImageComponent` pasan la clave por `encodeURIComponent` al construir `/get-image?imageKey=`. Test en cada uno con una clave con espacios o caracteres reservados. Nota: hoy `ImageCarrousel` no se renderiza en ninguna pantalla (su importación está comentada en `Explore.js`); `ImageComponent` llama a `/get-image` solo si recibe `imageKey`.

#### Lote B: gestión de errores del backend

6. (#4, D6) En `services/api.js`, una respuesta `401` a una llamada que envía token (métodos `*Auth`) borra `localStorage['token']` y ejecuta `window.location.assign('/login')`. Un `401` de `POST /log` (credenciales incorrectas) y el de cualquier ruta sin token **no** borran el token ni redirigen. El resto de componentes no toca el token. Test unitario de `api.js` para los tres casos (método `*Auth` con `401`, `POST /log` con `401`, ruta sin token con `401`).
7. (#5, D7) `LoginForm` muestra un mensaje distinto ante `429` (demasiados intentos) y el actual `login.unauthorizedLabel` ante cualquier otro fallo. Claves nuevas en `es` y `en`; el test de claves de idioma sigue pasando.
8. (#5) `ContactForm` distingue `429` (demasiados mensajes, se puede reintentar en 15 minutos) y `400` (datos no válidos) del error genérico, con mensajes traducidos en `es` y `en`. Se comprueba con tests que simulan cada estado.
9. (#7) `FileUpload` mantiene su `fetch` propio para `/upload`, `/upload/confirm` con `confirmed: true` y con `confirmed: false`, y no se migra a `api.js`. Debe cumplirse:
   - ante `404` `Draft not found` al confirmar o cancelar, el usuario ve el mensaje "El borrador ya no existe. Vuelve a subir el archivo." (no un éxito ni el error genérico de subida);
   - el resultado de la llamada de cancelar (`confirmed: false`) se comprueba: un fallo se comunica al usuario;
   - el `400` de `/upload` con `data.emptyFields` y `data.draftKey` sigue abriendo el diálogo de campos vacíos, y el `draftKey` se reenvía sin interpretarlo (`backend:F11`);
   - los errores se gestionan con el mismo criterio que `api.js` (sin mostrar el texto `error` del servidor).
   Los tests existentes de `FileUpload` siguen pasando y se añaden los de `404` y de cancelar con fallo.

#### Lote C: tabla

10. (#8, D4) `Table.js` calcula las columnas como la unión de las claves de todos los registros, conservando el orden de primera aparición. Test con un primer registro sin una clave que sí aparece en otros. No muta el array de entrada.

#### Verificación global

11. `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check` pasan. Si se toca `plugins/`, `npm run agentes:test`. `npm run docs:gate` pasa antes del commit. Si el número de avisos de ESLint baja, se ajusta `--max-warnings`.

### De documentación

1. `docs/integracion/para-backend.md`:
   - sección 6: D8 y D5 resueltos en el backend (`backend:F2`, `F3`, 29/10/2026) pasan a una línea del historial de `docs/09` y se quitan de la sección 6; D2, D3, D4, D6 y D7 igual, según queden resueltos;
   - fila de `POST /upload` (sección 2): ya no se menciona `processedData`; la fila de `GET /get-image` pasa a decir que la usan `ImageCarrousel` (no montado hoy) e `ImageComponent`, y ya no dice "Hoy ninguna pantalla lo usa" si deja de ser cierto al contrastar con el código;
   - sección 1: la tabla "Mensajes de error" refleja que ahora se distinguen `401`, `429` y `404 Draft not found`;
   - sección 4: la gestión de la caducidad del token durante la sesión describe la redirección por `401` a `/login`;
   - sección 8: fecha y commits de la verificación actualizados.
2. `docs/03-api.md`: refleja el nuevo comportamiento de `services/api.js` ante `401` y el manejo de `404`/cancelar en `FileUpload` (que sigue con `fetch` propio).
3. `docs/05-componentes.md`: `FileUpload`, `ContactForm`, `LoginForm`, `ImageGalleryManager`, `ImageCarrousel`, `ImageComponent` y `Table` al día (accept, `maxLength`, validación de título, mensajes de `429`/`400`/`404`, columnas, codificación de `imageKey`).
4. `docs/06-utilidades-hooks-config.md`: `FormatFileName` con el formato real.
5. `docs/07-i18n-y-estilos.md`: las claves nuevas de i18n, si el documento lista claves o su recuento.
6. `docs/09-estado-actual-y-deuda-tecnica.md`: "Última actualización" con la fecha del día de cierre, cifras (tests, claves) recalculadas, D2, D3, D4, D6 y D7 retirados de la deuda y D1 (y M12) como pendientes; las menciones de "se corrigen en el frontend" quedan coherentes.
7. Un aviso `docs/specs/*-aviso-pr.md` con la línea `Integración:` correcta, porque se tocan áreas de contrato (`services/api.js`, `FileUpload.js`, `LoginForm.js`). Como `para-backend.md` se cambia, la línea debe indicar ese cambio (o `sin impacto — <motivo>` solo si finalmente no cambia nada del contrato).
8. Lo que no pueda comprobarse contra el código queda marcado **(por confirmar)**.

## Fuera de alcance

- #1 (D1): `FileDropdown` y `GET /get-data`. Bloqueado hasta que el backend cree el endpoint de `backend:F1`. D1 sigue como discrepancia abierta.
- M12 y la configuración de `trust proxy` (backend e infraestructura).
- D9 (caducidad de URLs prefirmadas).
- Mostrar al usuario el texto `error` del servidor: se siguen usando mensajes propios traducidos.
- Migrar `FileUpload` a `api.js`.
- Diálogo previo de "sesión caducada" (`tokenExpiration.*`) y conservar la ruta de origen tras el login.
- Tope de longitud del título de imagen y saneado automático del título.
- Cierre de sesión explícito, cambios en `ProtectedRoute` y en la comprobación de `exp` del JWT.
- Tests de contrato con fixtures de la API.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: lo afecta. Se actualizan D2 a D8 según se resuelvan, las filas de `POST /upload` y `GET /get-image`, y la gestión de errores y de la caducidad del token. El frontend pasa a depender de `401`, `429` y `404 Draft not found` como señales (hoy `para-backend.md` dice que no distingue estados).
- `docs/integracion/para-infra.md`: no lo afecta (sin cambios en variables de entorno, buckets ni dominios).
- Las condiciones **(por confirmar)** que el backend dejó abiertas en `para-frontend.md` (F7 a, b, c, d; F10; F11) se contrastan con el código al terminar y se registran en el aviso de PR para que el backend las cierre.
- Observado en el código actual: `ContactForm`, `list-images`, `get-image` y `list-terms` se llaman sin token (condición F7 d), por lo que un `401` en ellas no es señal de sesión caducada (coherente con el criterio 6); `ImageGalleryManager` envía a `DELETE /delete-image` el `fileName` de `list-images` (condición F7 c, por confirmar con el listado real de la galería).
- Sin límite de longitud en el título de imagen en cliente: el backend no documenta uno (por confirmar); si lo impone, responderá `400`.

## Preguntas abiertas

Ninguna. Las cinco preguntas iniciales quedaron cerradas con las respuestas del usuario (ver "Decisiones del usuario").
