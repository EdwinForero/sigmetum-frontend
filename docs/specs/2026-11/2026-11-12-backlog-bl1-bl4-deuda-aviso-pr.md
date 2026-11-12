# Aviso para PR: backlog BL1 a BL4 y deuda B60 y B59 (12/11/2026)

Iteración «backlog-bl1-bl4-deuda» (spec y plan en esta misma carpeta mientras no se fusionen; los documentos vivos la citan por nombre y commit, nunca por ruta). **El backend va en otra PR y se despliega primero.**

Integración: el contrato cambia — el frontend usa tres rutas protegidas nuevas (`GET /list-recipients`, `POST /add-recipient` y `DELETE /delete-recipient`) y el backend pasa a entregar `POST /send-email` a esa lista, con `EMAIL` como respaldo. Detalle en `docs/integracion/para-backend.md` (secciones 1, 2, 7 y 7b) y `docs/integracion/para-infra.md` (fila de `data/contact/recipients.json` y de IPNI).

## Qué cambia

- **BL1 (contrato):** `ContactRecipientsManager` en `/administrar-contenido` (lista, alta con validación en el cliente, baja con confirmación, mínimo 1 y máximo 5). Todo va por `services/api.js` (`getAuth`, `postAuth`, `deleteAuth`); `git diff --stat src/services/api.js` está vacío. Cuerpo `{ email }` en las dos escrituras.
- **BL2:** `ContactForm` vacía los cuatro campos y el estado de errores tras un envío correcto, mantiene el aviso de éxito y lleva el foco al `<h2>` de `#contacto` (`onSent`); los campos son de solo lectura durante el envío y tras un fallo se conserva lo escrito. Sin cambio de petición.
- **BL3:** galería a todo el ancho (rejilla fuera de `.page-container`, columnas `ceil((W + 12) / 212)`, celdas de 200 px como máximo, bloques contiguos equilibrados) y velo `ink` al 70 % con el nombre al pasar el ratón o con el foco (decorativo, `aria-hidden`; el pie visible sigue siendo la vía accesible).
- **BL4:** `ipniUrl` (`https://www.ipni.org/search?q=` con la variante `noAuthor`) sustituye al enlace roto `/?q=` de `DialogSpecies`; script manual `scripts/ipni-check.mjs` (fuera de la CI y de `package.json`).
- **B60:** estados inactivos sin `opacity-50` (borde discontinuo `moss`) en botones de icono, `ButtonAlternative` y `Sidebar`; nueva prop `inactive` (`aria-disabled`, enfocable) en `ButtonPrincipal`. `DialogAdvice` con `[overflow-wrap:anywhere]` en el mensaje. **B59** parcial (ver `docs/09`).
- Sin cambios en `package.json`, `.env.example`, `.github/`, `vite.config.js`, `assets.js`, `env.js` ni en los componentes de sesión: **ningún archivo de `areasContrato` cambia**; el contrato lo cambia el backend.

## Qué debe hacer el otro repositorio

- **`sigmetum-backend` (otra PR, primero):** implementar las tres rutas con `tokenAuth`, los límites (1 a 5, duplicados, formato) y el limitador (10 cambios por 15 minutos por IP en alta y baja); `POST /send-email` a la lista con `EMAIL` de respaldo; el aviso por correo con la dirección enmascarada. **Orden de despliegue: backend primero**, después el frontend. Con un backend viejo el panel da `404` en la carga y muestra el error con «Reintentar» (el resto de la página funciona).
- **Requisito de despliegue (decisión del usuario):** crear a mano `data/contact/recipients.json` con `[]` en **cada entorno antes de desplegar el backend**. Si falta, por S15 el `GET` y el alta dan `500` y `/send-email` cae a `EMAIL` con el asunto marcado (hay que vigilar ese buzón).
- **`sigmetum-infra`:** nada. El rol ya tiene `GetObject`, `PutObject` y `DeleteObject` sobre `data/*`; `ipni.org` es solo un enlace externo (el script usa su API desde Node, no desde el navegador). Dejar constancia del fichero inicial en su guía.
- **Riesgo C16 (backend):** cualquier usuario del pool puede cambiar la lista y redirigir los mensajes de contacto; el aviso por correo lo detecta, no lo impide. Documentado en `docs/guias/seguridad.md` (S11). El modelo de autorización del frontend no cambia.
- **Vuelta atrás:** revertir el commit del frontend; no hay migraciones. El fichero `recipients.json` puede quedarse.

## Cambios visibles previstos (no son regresiones)

- Botones deshabilitados con borde discontinuo `moss` en lugar de `opacity-50` (icono, `ButtonAlternative` y «Cerrar sesión» de `Sidebar`).
- La galería llena el ancho (de 4 columnas fijas pasa a 9 a 1920 px) y mantiene la posición del `<h1>`.
- Tercera sección en `/administrar-contenido`, a todo el ancho desde `lg`.

## Pendiente

- **Integración real contra el backend de `dev`** (la hace el usuario tras desplegar el backend; aquí solo hay tests con la API simulada) **(por confirmar)**, incluido que el limitador vea la IP correcta tras `trust proxy`.
- **Medición de IPNI con datos reales:** falta la URL del backend de `dev` para `node scripts/ipni-check.mjs --api <base>/api/v1 --sample 20`; la variante `noAuthor` se eligió con 20 nombres de ejemplo.
- **Por confirmar:** el hover pegajoso en iOS, Safari y Firefox, lector de pantalla y la API de IPNI (sin contrato documentado).
- **`/security-review`** por el contrato nuevo y la accesibilidad (lo ejecuta el orquestador; **no ejecutado**).
- **Diagramas a regenerar:** ninguno automático (el repositorio no genera diagramas). Describen un flujo que cambió: `docs/01-arquitectura.md` (la página `/administrar-contenido` suma el panel de destinatarios y la galería rompe el contenedor) y `docs/04-paginas.md` (`ContentManagement`, `VegetationGallery`).
