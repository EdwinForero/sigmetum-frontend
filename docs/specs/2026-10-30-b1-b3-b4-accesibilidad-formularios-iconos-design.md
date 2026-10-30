# B3 y B4: etiquetas asociadas y envío con Enter en el login: spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

Hoy las `<label>` de `LoginForm` y `ContactForm` no están asociadas a su campo (B3) y, en el login, el botón de enviar está fuera del `<form>`, por lo que Enter no envía (B4). Este ciclo corrige solo esos dos hallazgos de `docs/09`, sin cambiar el aspecto visual ni la lógica de sesión, y recoge en `docs/09` el hash `ca0840d` de los commits de M15 y M9. B1 (botones de solo icono) queda para el ciclo siguiente (ver sección propia). Referencias que mandan: `docs/guias/accesibilidad.md` (reglas A4 y A5); `DESIGN.md` no se contradice con nada de lo que sigue. Criticidad: CRÍTICA (`LoginForm`, sesión y accesibilidad).

## Situación actual (observada en el código, sin diseño nuevo)

- Ningún archivo de `src` (sin tests) contiene `aria-*` ni `role`, salvo el `role="alert"` del error de `LoginForm`.
- `ButtonPrincipal` pinta un `<button>` sin `type` (el navegador lo trata como `submit` dentro de un `<form>`). Su `onClick` se invoca desde su manejador interno solo si no hay `dropdownOptions`; no acepta `type`.
- `ContactForm` depende de ese comportamiento: su botón no pasa `onClick` y envía por el `submit` nativo del `<form onSubmit>`.
- `LoginForm`: el `<form>` solo contiene los campos y el error; `ButtonPrincipal` con `onClick={handleLogin}` está fuera del `<form>`. Los tests actuales pulsan el botón con clic (`getByText('login.logInButton')`).
- `TextInput` y `FilterSearchBar` envuelven el `<input>` dentro de un `<label>` sin texto: la asociación existe (anidada, válida según A5), pero la etiqueta no tiene texto y el nombre del campo solo sale del `placeholder`. No es el fallo `htmlFor`/`id` de B3 y quedan fuera de este ciclo.

## Criterios de aceptación

### De código

Todas las pruebas se escriben primero y deben fallar por el motivo correcto (la asociación o el envío no existen), no por fallo de montaje. `t` está mockeado: se afirma la clave.

1. En `LoginForm`, `getByLabelText('login.userLable')` y `getByLabelText('login.passwordLable')` devuelven el `<input>` correspondiente (también cuando la contraseña se muestra como texto). Antes del cambio fallan porque no hay asociación.
2. En `ContactForm`, `getByLabelText` con las claves de sus cuatro etiquetas (`home.contactForm.nameLabel`, `emailPlaceholder`, `subjectPlaceholder`, `messagePlaceholder`) devuelve el campo correcto, incluido el `<textarea>`. Los `id` son únicos: dos instancias del mismo formulario en la misma pantalla no comparten `id` (lo mismo para `LoginForm`).
3. Los `placeholder`, las clases y los textos no cambian; los tests existentes de `ContactForm` siguen en verde (siguen buscando por `getByPlaceholderText`).
4. Pulsar Enter dentro de un campo del login envía el formulario: `api.post` se llama **una sola vez** con `'/log'` y `{ username, password }`. Antes del cambio no se llama.
5. Un clic en el botón de enviar también hace **una sola** llamada a `api.post` (no se duplica por el clic más el `submit`). `getByRole('button', { name: 'login.logInButton' })` existe, su `type` efectivo es `submit` y el botón está dentro del `<form>` (`closest('form')`).
6. El envío del login evita la recarga de la página (el evento `submit` queda con `defaultPrevented`).
7. Sin cambios en `handleLogin`, el token (`localStorage['token']`, `navigate('/cargar-archivos')`), las claves `login.tooManyAttemptsLabel` (429) y `login.unauthorizedLabel` (cualquier otro error) ni el `role="alert"` ya existente del error: los tests actuales de `LoginForm` pasan sin modificarlos, salvo que se cambie la consulta por una equivalente por rol.
8. El botón del formulario de contacto sigue enviando (los tests existentes con 429, 400 y 500 pasan) y sigue deshabilitado mientras falte algún campo. No se añade `type="button"` a `ButtonPrincipal` (rompería `ContactForm`).
9. Diseño visual idéntico: las clases de Tailwind y el marcado visible no cambian. La comprobación visual con la web en ejecución queda como **(por confirmar)**.
10. `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate` pasan. Si el lint pasa a tener menos avisos, `--max-warnings` baja al número real; si sube, la tarea no se da por buena.
11. No se toca `services/api.js` ni el flujo del token fuera de `LoginForm` (CLAUDE.md); no se añaden dependencias; no se añaden claves de traducción (no deberían hacer falta).

### De documentación

1. `docs/09`: B3 y B4 pasan a "Resueltos" con el commit como **(por confirmar)**; B1 sigue pendiente; nota de que `TextInput` y `FilterSearchBar` (campo sin etiqueta con texto, nombre solo por `placeholder`) quedan como pendiente de B3 (el `tester-documentador` la anota como observación); fila de historial del 30/10/2026; "Última actualización: 30/10/2026"; cifras actualizadas con `npm run docs:check -- --metrics`; el "(por confirmar)" del commit de M15 y de M9 se sustituye por `ca0840d`. B16 y la hoja de ruta (accesibilidad básica) reflejan lo que queda abierto.
2. Los recuentos ("N tests", "N claves") viven solo en `docs/09`; el resto de documentos no los repite.
3. `docs/05-componentes.md`: describe `LoginForm` (envío por `submit` con el botón dentro del `<form>`, etiquetas asociadas) y `ContactForm` (etiquetas asociadas), contrastado con el código.
4. `docs/08-guia-desarrollo.md`: refleja la cobertura de los tests nuevos (consultas por etiqueta y por rol, envío con Enter y sin doble envío).
5. `docs/guias/accesibilidad.md`: actualiza el "Estado" de `LoginForm` y `ContactForm` en A4/A5 solo en lo que se cumple (etiqueta asociada y Enter); sigue pendiente `aria-describedby`, los campos de `TextInput` y `FilterSearchBar` y los botones de icono (B1).
6. `docs/07-i18n-y-estilos.md`: solo si hubiera claves nuevas; no se prevén en este ciclo.
7. Aviso de PR `docs/specs/*-aviso-pr.md` (obligatorio por tocar `src/components/LoginForm.js`, área de contrato) con la línea `Integración: sin impacto — <motivo>`. Motivo comprobable: la petición a `/log` (método, ruta y cuerpo) y el tratamiento de 429 y 401 no cambian; solo cambia cómo se dispara el envío en el navegador.
8. Lo no comprobado se marca **(por confirmar)**: lectura con un lector de pantalla real (NVDA) y comprobación visual en el navegador.

## Fuera de alcance

- **B1 completo** (botones de solo icono, nombre accesible, `aria-hidden` de los iconos): ver "Siguiente ciclo".
- `TextInput` y `FilterSearchBar` (campo sin etiqueta con texto): se anota como pendiente de B3 en `docs/09`.
- B2 (diálogos), B5 (`alt` de imágenes), B6 a B19 (salvo lo anotado de B16), M1, M11, M13, M17.
- `aria-describedby` del error del login, `aria-expanded` en desplegables y chevrones, `aria-describedby` de los tooltips (A13), indicar que un enlace abre pestaña nueva (A10).
- Traducir los textos visibles fijos (`ErrorBoundary`, `'Filtro'` y demás nombres del menú lateral, `Home`): B7.
- Cambiar el aspecto, los `placeholder`, `handleLogin`, el token o los mensajes (429 y 401).
- `<div onClick>` y `<span onClick>` sin rol (A2).

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta. `LoginForm.js` está en `areasContrato` de `.claude/flujo.json`, pero la petición `POST /log` y la gestión de 429 y 401 no cambian. Hace falta el aviso de PR con `Integración: sin impacto — <motivo>` (criterio de documentación 7).
- `docs/integracion/para-infra.md`: no lo afecta (sin variables de entorno, recursos de S3 ni configuración de despliegue).

## Siguiente ciclo: B1 (fuera de alcance de este ciclo)

Sin criterios de aceptación activos. Se conservan inventario, clasificación y decisiones del usuario como referencia; los criterios se redactarán al abrir ese ciclo.

### Decisiones ya tomadas para B1

- **Papeleras** (`FileUpload`, `ImageGalleryManager`, `TermsManager`): nombre accesible con el elemento, "Eliminar {{nombre}}" (interpolación; con `t` mockeado el test comprueba la clave y, si se quiere, el valor pasando opción al mock).
- **Sidebar**: claves nuevas de nombre accesible por `id` de opción, solo para el nombre accesible; B7 sigue abierto para los textos visibles (`name` en español fijo).

### Situación observada

- No hay iconos que lleguen desde i18n: el nombre del icono viaja como literal (`icon="Menu"`, `icon={option.icon}` de `App.js`) o escrito en el JSX.
- `ButtonPrincipal` con `icon` pinta un `<button>` cuyo único contenido es `<span class="material-symbols-outlined">{icon}</span>`; sin `icon`, un `<button>` con texto.

### Clasificación de cada sitio

Criterio: (a) control de solo icono, necesita `aria-label` traducido con `t()` y `aria-hidden="true"` en el span del icono; (b) icono decorativo junto a texto visible, solo `aria-hidden="true"`; (c) el nombre ya lo da otro texto, no se toca.

| # | Sitio | Clase | Justificación |
|---|---|---|---|
| 1 | `ButtonPrincipal` con `icon`: menú móvil (`Navbar`, `icon="Menu"`) | (a) | Único contenido: la ligadura "Menu" |
| 2 | `ButtonPrincipal` con `icon`: página anterior y siguiente (`Pagination`) | (a) | Ligaduras `arrow_back_ios_new` y `arrow_forward_ios`; el texto "Página X de Y" no está dentro del botón |
| 3 | `ButtonPrincipal` con `icon`: cinco opciones de `Sidebar` (`filter_alt` x2 ids, `database`, `settings`, `upload`) y su botón de cerrar (`icon="Close"`) | (a) | Solo icono. Los `name` de `App.js` están en español fijo (B7) y no se muestran; hace falta un nombre traducido por opción |
| 4 | `ButtonPrincipal icon="add"` en `ImageGalleryManager` y `TermsManager` | (a) | Solo icono; la acción es añadir imagen o término |
| 5 | Papelera de la lista de archivos (`FileUpload`), de la galería (`ImageGalleryManager`) y de los términos (`TermsManager`) | (a) | `<button>` con solo la ligadura "delete"; el nombre del elemento está en un `<p>` hermano, no dentro del botón |
| 6 | `InfoButton` | (a) | La clase `material-symbols-outlined` está en el propio `<button>` y su texto es "info": no se puede poner `aria-hidden` al icono sin cambiar el marcado; `aria-label` sustituye el nombre. Se usa en varias pantallas (`FileUpload`, galería, términos, `DataManagement`, otras por confirmar) |
| 7 | `ScrollIndicator` (`arrow_circle_down`) | (a) | Solo icono |
| 8 | Chevrones de `ButtonAlternative` | (b) | El nombre lo da `displayText`; el icono solo indica el estado |
| 9 | Chevrones de `CategoryFilter` | (b) | Van junto al nombre de la categoría. El contenedor es un `<div onClick>` (A2) y el estado expandido no se anuncia: son otros hallazgos |
| 10 | `open_in_new` de `DialogSpecies` (enlace a IPNI) | (b) | El enlace tiene texto visible (`readMoreLabel`); el icono es decorativo. Que el enlace abre pestaña nueva (A10) no entra |
| 11 | Botón mostrar y ocultar contraseña (`LoginForm`), botones con `text` de `ButtonPrincipal` y `ButtonAlternative`, botón de `ErrorBoundary`, `CookieBanner`, `FileDropdown` | (c) | Tienen texto visible. `ErrorBoundary` tiene texto fijo sin traducir (B7), fuera de alcance |

Por confirmar al diseñar ese ciclo: `FilterSearchBar` (`data-icon="MagnifyingGlass"`, no es un span de Material Symbols), `SpeciesCard`, `FileDropdown`, `Header`/`Footer` (enlaces con imagen: B5/A10) y `UploadButton` (código muerto, M8; si no se monta, no se toca).

### Notas para redactar sus criterios

- Cada sitio (a) debería localizarse por `getByRole('button', { name: <clave> })`, con la clave en `es` y `en`; ningún control (a) conserva como nombre el texto de la ligadura; los controles de `Pagination` deshabilitados conservan `disabled` y su nombre; los (c) no cambian; sin cambio visual.
- Al tocar `ButtonPrincipal`, no añadir `type="button"` sin resolver antes `ContactForm` (depende del `submit` nativo).

## Preguntas abiertas

Ninguna. Las cuatro preguntas anteriores están resueltas (alcance en dos ciclos; papeleras con el elemento; `TextInput` y `FilterSearchBar` fuera; Sidebar con claves por `id`).
