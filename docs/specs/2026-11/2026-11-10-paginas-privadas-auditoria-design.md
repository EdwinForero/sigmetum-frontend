# Páginas privadas (administrar datos, administrar contenido, cargar archivos) y cromo compartido: bugs, accesibilidad y diseño tras la auditoría del 10/11/2026

Fecha: 2026-11-10 · Estado: cerrado

## Objetivo

Una auditoría con Playwright sobre `dev` (10/11/2026) encontró en `/administrar-datos`, `/administrar-contenido` y `/cargar-archivos`, y en lo que comparten (barra lateral, cabecera, pie y `App.js`), fallos de maquetación en móvil (contenido cortado y papeleras fuera de pantalla a 375 px), de accesibilidad WCAG 2.2 AA (selector de dataset sin teclado, contraste, objetivos táctiles, landmarks, `<h1>`) y de diseño (botones, placeholders y listas). El usuario decide hacerlo **todo en un solo ciclo**, con los 14 hallazgos del informe, los extras hallados al leer el código y tres peticiones nuevas: rediseño de botones, inputs y placeholders; patrón de mensajes de error y feedback (menos diálogos modales); y estados de carga claros. Esta spec ordena el trabajo en bloques A a H para que el `architect` lo parta en fases de 5 pasos como máximo.

Capturas revisadas (`.playwright-mcp/`): `dev-datos-1280.png` y `dev-contenido-375.png`. Las otras tres y todas las medidas de píxeles son las del informe de la auditoría **(por confirmar con Playwright en este ciclo)**.

## Verificación de los hallazgos contra el código

Solo por lectura del código (esta fase no ejecuta nada).

| N.º | Hallazgo | Contraste con el código y con `docs/09` | Id |
|---|---|---|---|
| 1 | Desbordamiento a 375 px | Coherente: `Sidebar` usa `ButtonPrincipal` con `min-w-[70px]` dentro de `aside` con `p-5` (70 + 40 = 110 px) y los gestores y las cabeceras usan `min-w-72` (288 px) | nuevo |
| 2 | «SIGMET / A» partido a 375 px | Coherente: `Header` es una fila `flex` sin `whitespace-nowrap` ni reparto móvil | nuevo |
| 3 | «V 1.0.0» solapa el copyright | Coherente: `App.js:146-151`, `absolute bottom-2 right-2` | **B32** |
| 4 | Filas inconsistentes en contenido | Coherente: `<p>` sin clase de tamaño y botón de papelera sin tamaño; columnas con estructuras distintas | nuevo |
| 5 | Selector de dataset | Confirmado: `FileDropdown.js:83-88` es `<div onClick>`; las filas son `<li onClick>` | **B22** |
| 6 | «Close» fuera de pantalla, tabulable | Confirmado y **más amplio**: el panel de `Sidebar` solo se desplaza (`x: -100%`); todo su contenido sigue siendo tabulable cerrado | **B21** parcial |
| 7 | `<a>` con `<button>` dentro | Confirmado (`Sidebar.js:58-64`) | **B27** |
| 8 | Sin `<h1>` | Confirmado | **B18** |
| 9 | `contentinfo` anidado y dos `navigation` sin nombre | Confirmado (`App.js` y `Footer.js` anidan `<footer>`; `Navbar` y `Sidebar` sin `aria-label`) | nuevo |
| 10 | Contraste | Confirmado con `DESIGN.md` y la guía de accesibilidad (A1 de **esa guía**; el «A1» de `docs/09` es un bug de subida ya resuelto). Alcanza también al estado activo (`surface` sobre `brand`), al hover del botón de icono, a los bordes `brand` de los campos (3:1) y a ~40 usos de `text-[#15B659]` en 20 ficheros (lista en el bloque C) | guía A1 |
| 11 | Objetivos táctiles | Coherente: papelera sin mínimo, `InfoButton` `px-3 py-1`, enlaces del pie de alto de línea, `h-10` en móvil. WCAG 2.2 AA (2.5.8) pide 24×24; el proyecto exige 44×44 (`DESIGN.md`) y se mantiene | nuevo |
| 12 | Botón de idioma solo «EN» | Confirmado; sus opciones son `<div onClick>` (inoperable con teclado) | nuevo |
| 13 | Estados vacíos y de error sin `role` | Parcial: listas con `<p>` sin rol, `LoadSpinner` sin anuncio (B16). Las acciones hoy se anuncian solo porque abren un `DialogAdvice` modal | B16 parcial |
| 14 | Diseño | Evidente en las capturas | B13 relacionado |

Hallazgos adicionales (todos entran en este ciclo salvo lo señalado en «Fuera de alcance»):

- «Log out» no flota: `ProtectedRoute` lo pinta en una fila en el flujo (`flex justify-end p-4`), ~80 px de espacio muerto.
- Menú hamburguesa de `Navbar`: sin `aria-expanded`, panel con `mt-20`, no cierra con Escape.
- Opciones de `ButtonAlternative` y `ButtonPrincipal` con `dropdownOptions` y de `LanguageSwitcher`: `<div onClick>` (guía A2).
- «V 1.0.0» es un `<span onClick>` (alterna el mensaje `ee`): no se usa con teclado.
- B9 (`DataManagement.js:98`, «Actualizar datos» con el tooltip de «Descargar Excel») y B24 (`TermsManager.js:86`, `sort()` sin copiar).
- `max-w-screen` y `min-w-screen` no existen en Tailwind 3.4 (`package.json`: `^3.4.14`): inertes en `DataManagement`, `ContentManagement`, `Footer` y `Cookies`.
- `/cargar-archivos`: `px-40` y `w-[512px]` (`FilesUpload.js`) hacen probable el desbordamiento en móvil **(por confirmar)**.
- «Eliminar versión» borra sin confirmación; borrar un término o una imagen tampoco.
- `DataManagement` envuelve la tabla en `overflow-hidden`: una tabla ancha se recorta en lugar de desplazarse en horizontal (`DESIGN.md` lo prohíbe). El interior de `Table` no se leyó **(por confirmar)**.
- Placeholders: `TextInput` pone `placeholder:text-[#99BBA8]` (2,02:1) y es el único nombre del campo (B3); `FilterSearchBar` igual.
- Párrafos con `text-justify text-center` a la vez (clases en conflicto; el justificado dificulta la lectura).
- `InfoButton`: tooltip solo con ratón y clic, sin `aria-describedby` ni Escape (guía A13); icono `#99BBA8`.
- Logo de la cabecera con `alt="Logo"` junto al texto del enlace (B5); no hay enlace «Saltar al contenido» (guía A7); el banner de cookies (`CookieBanner`, `fixed bottom-0 z-50`) usa `bg-gray-800` y los botones de siempre.
- «Subiendo…»: `FileUpload` sube los archivos de uno en uno con `onLoad(true/false)` y un `LoadSpinner` sin texto; ningún mensaje dice cuál ni cuántos.

## Inventario de mensajes (bloque E)

Hoy **todos** salen en un `DialogAdvice` modal (`useDialog`). Reparto propuesto (decide el `architect` el cómo; aquí el qué):

| Origen | Mensaje | Patrón propuesto |
|---|---|---|
| `TermsManager` | `adviceEmptyValues`, `adviceDuplicatedTerm` | Error de campo en línea junto al input |
| `ImageGalleryManager` | `adviceNoImageData`, `adviceInvalidImageTitle` | Error de campo en línea (título o archivo según el caso) |
| `TermsManager`, `ImageGalleryManager`, `DataManagement` | `successUploadTerm`, `successDeleteTerm`, `successUploadImage`, `successDeleteImage`, `successDeleteMessage`, `successUpdateMessage` | Aviso no bloqueante (`role="status"`) |
| `TermsManager`, `ImageGalleryManager`, `DataManagement` | `errorUploadTerm`, `errorDeleteTerm`, `errorUploadImage`, `errorDeleteImage`, `errorDeleteMessage`, `errorUpdateMessage` | Aviso de error persistente (`role="alert"`), sin temporizador |
| `FileDropdown` | `errorLoadFile` (al elegir versión); `errorLoadData` y `noDataFoundPlaceholder` dentro del menú | Error en línea junto al selector con «Reintentar»; vacío explicativo con enlace a `/cargar-archivos` |
| `FileUpload` | `successUploadMessage` | Aviso no bloqueante |
| `FileUpload` | `errorUploadMessage`, `errorDraftNotFound` | Error persistente en la tarjeta de subida (`role="alert"`) |
| `FileUpload` | `fieldsMissingMessage` con detalles (`onConfirm`/`onCancel`) | **Modal** (decisión: seguir o cancelar) |
| `DataManagement`, `TermsManager`, `ImageGalleryManager` | borrar versión, término o imagen (hoy sin confirmación) | **Modal** de confirmación destructiva, con nombre del elemento |
| `ContactForm` | `successEmailMessage`; `errorEmailRateLimit`, `errorEmailInvalid`, `errorEmailMessage` | Éxito: aviso no bloqueante. Errores: en línea junto al formulario (`role="alert"`). La validación por campo se completa al leer `ContactForm` **(por confirmar)** |
| `Explore` | `errorDownloadFile` | Aviso de error persistente |
| `LoginForm` / `useCognitoLogin` | errores y «Comprobando…» | Ya son `role="alert"` y `role="status"` en línea (sin `DialogAdvice`): solo se restilan (rojo, icono) |
| `DialogSpecies`, `CookieBanner` | diálogos informativos propios | Sin cambio de patrón |

## Criterios de aceptación

Todo se verifica con tests unitarios (TDD: cada comportamiento nuevo con un test que falla antes por el motivo correcto) y con Playwright contra `npm run dev`, con el token inyectado en `localStorage` (clave `token`) y `fetch` interceptado para `/auth` y las llamadas de cada página (`/list-files`, `/get-data/*`, `/list-terms`, `/list-images`, `/upload*`, `/delete-*`, `/update-file`). Anchuras: **320, 375, 768, 1024 y 1280 px**, en español e inglés. Capturas en `.playwright-mcp/`.

### De código

**Bloque A. Estructura y responsive**

- A1. En 320, 375, 768, 1024 y 1280 px, `document.documentElement.scrollWidth <= window.innerWidth` en `/administrar-datos`, `/administrar-contenido`, `/cargar-archivos`, la cabecera, el pie y `/login` (en todos sus pasos), con el panel de filtros abierto y cerrado, y con el banner de cookies visible y oculto. Se mide por script en Playwright; falla antes del cambio.
- A2. Ningún texto queda recortado, ningún control queda fuera de la ventana (papeleras, «+», botones de acción) y no hay solapes entre elementos (cabecera, pie, barra). Comprobado con `getBoundingClientRect` de cada control interactivo en las cinco anchuras.
- A3. Una tabla ancha de `/administrar-datos` se desplaza en horizontal dentro de su contenedor, que es alcanzable con teclado y tiene nombre; el resto de la página no se desplaza.
- A4. `/cargar-archivos` usa el ancho disponible sin `px-40` ni anchos fijos en píxeles; la tarjeta de subida y la lista de archivos caben a 320 px.
- A5. Los tres gestores y las cabeceras de página no tienen anchos mínimos que fuercen el desbordamiento; las dos columnas de `/administrar-contenido` tienen la misma estructura (título + información, campo con etiqueta visible, botón de acción con texto, lista) y se apilan por debajo de `lg`.
- A6. Se retiran `max-w-screen` y `min-w-screen` solo de los archivos tocados; `text-justify` junto a `text-center` desaparece de los párrafos de las tres páginas.
- A7. Banner de cookies y barra inferior (B1): con el banner visible a 320 y 375 px, la barra de navegación inferior sigue visible y utilizable y el contenido llega a verse entero al desplazarse (el banner se coloca por encima de la barra, y el espacio inferior de la página reserva barra y banner mientras haya banner; al aceptarlo, el espacio se libera). Test de la clase o del margen y captura Playwright en las cinco anchuras.

**Bloque B. Navegación y teclado**

- B1. Por debajo de `md`, la navegación de las páginas privadas es una **barra inferior fija** con icono y **etiqueta visible** por ítem; desde `md`, **barra lateral** con icono y etiqueta visible junto a él. Etiquetas cortas traducidas con `t()` (claves nuevas en `es` y `en`) que no se truncan: pueden ocupar dos líneas pero siempre se leen enteras a 320 px, con 5 ítems como máximo en `/administrar-datos`.
- B2. Los ítems de navegación (`Datos`, `Contenido`, `Cargar`) son `<a>` reales sin `<button>` dentro, con una sola parada de Tab, nombre accesible igual a la etiqueta visible y `aria-current="page"` en el activo (no solo color: también forma o peso). Test por ítem.
- B3. **«Filtros»** (en `/administrar-datos` y en `/explorar`) es un ítem más de la barra: mismo tamaño, tipografía y etiqueta visible, y estado activo coherente mientras su panel está abierto, expresado con `aria-expanded` y `aria-controls`. Se interpreta así lo pedido («un ítem consistente con los demás»): sigue siendo un botón que abre el panel, no un enlace.
- B4. **«Cerrar sesión»** vive en la barra (inferior o lateral) como un ítem más, con etiqueta visible y botón (es una acción, no un enlace); deja de existir la fila suelta de `ProtectedRoute` en el estado `ok`. El botón «Cerrar sesión» del estado `unavailable` de `ProtectedRoute` se conserva. Solo aparece en las rutas privadas. Tests de `Sidebar` y `ProtectedRoute`.
- B5. Con el panel de filtros cerrado, nada de su contenido es alcanzable con Tab ni lo lee un lector de pantalla; abierto: el foco entra, Tab queda dentro, Escape lo cierra y el foco vuelve al ítem que lo abrió; el panel lleva `role="dialog"`, `aria-modal`, nombre y se abre sobre la barra inferior sin quedar tapado (cierra B21 para `Sidebar`). El botón «Close» está dentro de la pantalla y es de 44×44 como mínimo.
- B6. Menú hamburguesa de `Navbar`: `aria-expanded` y `aria-controls`, cierra con Escape y devuelve el foco al botón, se coloca bajo la cabecera sin `mt-20` y a 320 px no se sale de la ventana.
- B7. `InfoButton`: el tooltip se muestra también con el foco, se oculta con Escape, el botón lleva `aria-describedby` hacia el texto y el texto no se corta a 320 px (guía A13).
- B8. Orden de Tab lógico en las tres páginas: enlace «Saltar al contenido» (nuevo), cabecera, barra de navegación, contenido, pie. Test con `userEvent.tab()`.

**Bloque C. Contraste y paleta**

- C1. `tailwind.config.js` define los colores del tema con nombre (`brand`, `brand-dark`, `brand-deep`, `surface`, `ink`, `ink-soft`, `sage`, `moss`, `danger`) y `DESIGN.md` justifica `brand-deep` y `danger` como tokens nuevos. Los archivos tocados usan los tokens, no hexadecimales.
- C2. Valores y razones (calculados a mano con la fórmula WCAG; **el cálculo hay que comprobarlo por script**: el `developer` escribe un test que lee `tailwind.config.js` y calcula cada razón, y el test es el criterio): `brand-deep` `#0B7A3B` sobre `surface` 5,23:1 (sobre blanco 5,44:1); `ink` sobre `brand` 6,82:1; `brand-dark` `#0e9447` sobre `surface` 3,78:1; `moss` `#4B644A` sobre `surface` 6,27:1; `ink` sobre `brand-dark` (hover del botón) 4,63:1; `danger` `#B42318` sobre `surface` 6,32:1. Mínimos: texto normal 4,5:1; texto grande, iconos y bordes de controles 3:1.
- C3. Reglas de uso, comprobadas por el test de C2 y por Playwright con script de contraste sobre los colores calculados del DOM en las tres páginas, la cabecera, el pie y el login (estados normal, hover, foco, activo y desactivado): título `<h1>` y texto verde sobre fondo claro con `brand-deep`; botón principal con relleno `brand` y texto `ink` (también el botón «Cerrar sesión» y el de `CookieBanner`); botón alternativo con borde `brand-dark` y texto `brand-deep`; estado activo de los ítems de navegación con relleno `brand` y texto/icono `ink`, y hover igual (nunca `surface` sobre `brand`); iconos y borde de campos con `brand-dark`; placeholders, icono de información y texto de ayuda con `moss`; texto verde sobre fondos oscuros (pie, `CookieBanner`) se deja si cumple.
- C4. Se revisan **todos** los usos de `text-[#15B659]` fuera de tests: `Cookies` (11), `Home` (6), `CategoryFilter` (2), `ButtonAlternative` (3), `About` (2), `Explore` (2), y uno en cada uno de `ContentManagement`, `FilesUpload`, `DataManagement`, `VegetationGallery`, `NotFound`, `DialogAdvice`, `ErrorBoundary`, `FileUpload`, `Header`, `ImageGalleryManager`, `ScrollIndicator`, `TermsManager` y `ButtonPrincipal`. Cada uno se cambia al token adecuado si el fondo es claro, o se deja y anota si el fondo es oscuro y cumple. `rg "text-\[#15B659\]" src` da solo los casos justificados. El `A` del logotipo y los colores `red-500` y `blue-500` del nombre se anotan como logotipo.
- C5. El color nunca es la única señal: estado activo, error y éxito llevan además texto, icono o forma.

**Bloque D. Formularios, placeholders y botones**

- D1. Botones: todos los controles pulsables miden como mínimo 44×44 px (objetivo 48) en las cinco anchuras (medición por script); tamaño y tipografía iguales entre `ButtonPrincipal` y `ButtonAlternative` en cada breakpoint; estados hover, foco (`.focus-ring`), desactivado y **cargando** (`aria-busy` o `aria-disabled` con texto) coherentes y documentados en `DESIGN.md`.
- D2. Etiquetas descriptivas en vez de iconos o textos genéricos, con `t()` en `es` y `en`: «Añadir término», «Añadir imagen», «Seleccionar imagen», «Seleccionar archivos», «Subir archivos» (con el número, p. ej. «Subir N archivos»), «Eliminar versión» (con el nombre de la versión, p. ej. «Eliminar versión Almería 2026-11-10» **(formato por confirmar)**), «Eliminar término X», «Eliminar imagen X» y «Quitar archivo X de la lista» (las papeleras mantienen el icono y su `aria-label` incluye el nombre del elemento; los botones de acción principales con texto visible).
- D3. Inputs (`TextInput`, `FilterSearchBar` y los de los gestores): etiqueta visible asociada con `htmlFor`/`id` (cierra B3 en esos dos componentes); el placeholder deja de ser el único nombre; si se conserva como ejemplo, `moss` (6,27:1); borde `brand-dark`; foco `.focus-ring-inset`; errores en línea según el bloque E.
- D4. Listas de términos e imágenes y de archivos seleccionados: misma tipografía, tamaño y altura de fila (≥44 px), nombre largo con salto o truncado con `title`, papelera alineada a la derecha y al centro de la fila, sin altura máxima que oculte filas sin avisar; cada lista es una `<ul>` con `aria-label` y estado vacío explicativo.
- D5. Jerarquía, espaciado y alineación de las tres páginas con `DESIGN.md`: un `<h1>` por página, subtítulos `<h2>`, controles agrupados por tarjeta con borde fino, un solo contenedor con `max-w-*`, sin espacio vertical muerto.
- D6. Botón «Eliminar versión» y «Actualizar datos» (B9: el tooltip de actualizar tiene su clave propia) con tooltip descriptivo.

**Bloque E. Mensajes, error y carga**

- E1. Se aplica el reparto del inventario. `DialogAdvice` queda solo para **confirmaciones destructivas** (borrar versión, término o imagen) y **decisiones** (campos vacíos al subir); los diálogos que dejan de usarse no se tocan si otros los usan.
- E2. Errores y avisos de formulario: texto en un recuadro con borde y texto `danger`, icono (no solo color), `role="alert"` (o `aria-describedby` en el campo con `aria-invalid`), junto al campo; el foco no se roba salvo que el envío falle por validación (foco al primer campo con error, como hace `LoginForm`).
- E3. Confirmaciones y resultados no bloqueantes: aviso en una región fija anunciada (`role="status"` o `aria-live="polite"`; los de error persistentes con `role="alert"`), con botón de cerrar de 44×44, nombre accesible traducido, sin quitar el foco al usuario. Cumple WCAG 2.2.1: un aviso informativo se cierra solo tras un tiempo razonable (valor por confirmar al diseñarlo; propuesta: 8 s) **y** se pausa con el ratón encima y con el foco dentro; un aviso con acción o de error **no desaparece solo**. Respeta `prefers-reduced-motion`. La región no tapa la barra inferior ni el banner de cookies.
- E4. Carga: las listas, el selector y la subida muestran texto y estado anunciado en `role="status"` con `t()` en `es` y `en`: «Cargando versiones…», «Cargando términos…», «Cargando imágenes…», «Cargando datos de la versión…», «Subiendo archivo 2 de 5…» y, tras acabar, resultado por archivo (correcto o con error y motivo). La carga de `/administrar-datos` no sustituye la página entera por un spinner de `min-h-screen`.
- E5. Subida: lista de archivos con estado por archivo (pendiente, subiendo, subido, error, decisión pendiente) y una barra `role="progressbar"` (`aria-valuenow`, `aria-valuemax`, `aria-valuetext`) del conjunto («2 de 5»). El progreso en bytes por archivo queda fuera si exige tocar `api.js` (pregunta 3).
- E6. Estados vacíos explicativos, no solo «No data available.»: dicen qué falta y qué hacer (p. ej. «No hay versiones. Sube un archivo en Cargar archivos», con enlace). `LoadSpinner` lleva texto asociado y rol de estado.
- E7. Todos los textos nuevos con clave en `es` y `en`; `translations.test.js` pasa (paridad).

**Bloque F. Selectores de dataset y de idioma**

- F1. El selector de dataset de `/administrar-datos` es un `<select>` nativo con un `<optgroup label>` por provincia y una `<option>` por versión (`FormatFileName`), con `<label>` visible asociada, opción vacía «Elige un dataset» como valor inicial, el valor elegido anunciado, y estados de carga, vacío y error según E. Reproduce el comportamiento actual: al elegir carga los datos (`/get-data/<key>`), muestra la carga, conserva `fetchFiles` por `ref` para recargar tras borrar o actualizar, vuelve al valor vacío si la versión desaparece o si la carga falla, y no deja el `<select>` en un valor que no coincide con los datos. Tests con `userEvent.selectOptions` y por teclado.
- F2. Muchas versiones: el `<select>` nativo ya tiene desplazamiento y búsqueda por tecla; las versiones van ordenadas (más recientes primero **(orden por confirmar)**). Si con datos reales una provincia tiene más de ~50 versiones, se evalúa un segundo `<select>` encadenado (provincia, luego versión) en otro ciclo; no se construye ahora un listbox propio.
- F3. El selector de idioma deja de usar `<div onClick>`: pasa a un `<select>` nativo (o a un botón con menú operable con teclado si el `architect` argumenta que el `<select>` no cabe en la cabecera) con nombre accesible «Idioma» traducido que incluye el idioma actual, 44×44 mínimo, opciones con teclado y `lang` por opción. `ButtonAlternative` y `ButtonPrincipal` con `dropdownOptions` dejan de pintar `<div onClick>` (se retira el desplegable si nada más lo usa, o se hace accesible). Tests de teclado.

**Bloque G. Pie, cabecera, landmarks y títulos**

- G1. Un solo `contentinfo`; la `<nav>` de la cabecera y la de la barra tienen `aria-label` traducido y distinto; un único `<main>`; enlace «Saltar al contenido» como primer elemento enfocable. Test de roles y de nombres.
- G2. Cabecera: a 320 y 375 px «SIGMETUM-A» no se parte ni queda tapado; logo y nombre, selector de idioma y menú caben en una fila; el logo con `alt=""` si el texto del enlace ya lo nombra (B5 parcial).
- G3. Pie: «V 1.0.0» no solapa el copyright en 320, 375 y 1280 px y no es un `<span onClick>` (o es un botón con teclado, o deja de ser interactivo y el mensaje `ee` se retira; decide el `architect`); los enlaces del pie miden 44 px de alto como mínimo.
- G4. `<h1>` único en las tres páginas, sin saltar niveles; `useDocumentTitle` y el foco programático (si lo hay) con `.focus-heading`.

**Bloque H. Código, calidad y entorno**

- H1. `npm test -- --maxWorkers=2`, `npm run build`, `npm run lint` (el recuento de avisos no sube del tope y se baja si mejora), `npm run quality` y `npm run docs:check` pasan; `npm run docs:gate` en verde antes del commit.
- H2. Ninguna petición, cabecera, cuerpo ni ruta de la API cambia; `api.js` no se modifica (salvo decisión explícita en la pregunta 3). Si se tocan `FileUpload.js`, `LoginForm.js` o `ProtectedRoute.js` (áreas de contrato), hay `docs/specs/2026-11/*-aviso-pr.md` con `Integración: sin impacto — <motivo>`.
- H3. Sin `dangerouslySetInnerHTML`, `innerHTML`, `eval`; sin `sort()` sobre estado; sin `outline-none` sin alternativa; sin dependencias nuevas.
- H4. Un test nuevo calcula los contrastes de C2 y otro mide los objetivos táctiles del cromo (en jsdom no hay layout: el de objetivos táctiles es de Playwright, ejecutado y registrado, no de `npm test`).

### De documentación

1. `docs/09-estado-actual-y-deuda-tecnica.md`: fila nueva del historial con fecha de hoy y medidas antes/después (desbordamiento por anchura, objetivos táctiles, contrastes); cierra B9, B18, B22, B24, B27, B32, B3 (en `TextInput` y `FilterSearchBar`) y B21 (parte de `Sidebar`, `CookieBanner` sigue abierto), y B5 parcial; anota los extras que queden fuera y lo no comprobado **(por confirmar)**: lector de pantalla real (NVDA y VoiceOver), zoom 200 %, modo de alto contraste, teclados virtuales. Las cifras de tests y archivos solo aquí.
2. `docs/guias/accesibilidad.md`: A1 (decisión tomada y valores), A2, A6, A7, A12, A13 y A15 con el estado real; añade el patrón de mensajes (E) y el selector nativo.
3. `DESIGN.md`: tokens nuevos justificados, tabla de contraste actualizada, botones (tamaños, estados, etiquetas), inputs y placeholders, patrón de feedback (toast, error en línea, modal), barra inferior y lateral, selector nativo, «Diseño adaptable» con las cinco anchuras. Los «Hoy» contrastados con el código.
4. `docs/04-paginas.md`, `docs/05-componentes.md`, `docs/06-utilidades-hooks-config.md` (hooks nuevos), `docs/07-i18n-y-estilos.md` (tokens y claves) según `docsPorArea`, y `docs/08-guia-desarrollo.md` si se añade un test de Playwright o un script.
5. `docs/integracion/` no cambia.

## Estimación honesta de archivos y de riesgo

Estimación (no contada): **unos 45 a 55 ficheros de código** (~38 existentes: `Sidebar`, `App`, `Header`, `Navbar`, `LanguageSwitcher`, `ButtonPrincipal`, `ButtonAlternative`, `InfoButton`, `TextInput`, `FilterSearchBar`, `Footer`, `ProtectedRoute`, `Login`/`LoginForm`, `CookieBanner`, `DialogAdvice`, `ErrorBoundary`, `ScrollIndicator`, `CategoryFilter`, `LoadSpinner`, `FileDropdown`, `FileUpload`, `FilesUpload`, `DataManagement`, `ContentManagement`, `TermsManager`, `ImageGalleryManager`, `ContactForm`, `Explore`, `Table`, `index.css`, `tailwind.config.js`, los dos JSON de traducción, y los de solo color `Home`, `About`, `Cookies`, `NotFound`, `VegetationGallery`; y ~6 nuevos: región y proveedor de avisos, hook, mensaje de campo, campo `<select>`, enlace de salto), **25 a 30 ficheros de test** (~15 modificados y ~10 a 14 nuevos) y 8 a 10 documentos. Es del orden de 3 a 4 veces el cambio más grande hecho hasta ahora; una vuelta de `/ciclo` con `maxVueltas: 3` es ajustada.

Riesgos:

1. **Tests existentes que se romperán** (esperados, se reescriben en el mismo cambio): `Sidebar.test.js`, `Navbar.test.js`, `Header.test.js`, `ButtonPrincipal.test.js`, `ButtonAlternative.test.js`, `TextInput.test.js`, `FilterSearchBar.test.js`, `InfoButton.test.js`, `ProtectedRoute.test.js`, `CookieBanner.test.js`, `TermsManager.test.js`, `ImageGalleryManager.test.js`, `FileUpload.test.js`, `ContactForm.test.js`, `LoginForm.test.js` y `translations.test.js`. Los que comprueban un `role="dialog"` tras una acción, colores o clases concretas fallan. No hay tests de `DataManagement`, `FileDropdown`, `Explore`, `FilesUpload`, `ContentManagement` ni `Footer`: el riesgo de regresión ahí es mayor y exige tests de caracterización antes de tocarlos.
2. **Cambio de comportamiento deliberado:** borrar versión, término e imagen pasa a pedir confirmación; los resultados dejan de bloquear con un modal.
3. **Tokens de color y botones globales** afectan también a Home, Explorar, Galería, Login y Cookies: riesgo de regresión visual y de contraste en páginas fuera del alcance funcional. Exige Playwright en las públicas con el cambio de color.
4. **Areas de contrato** (`FileUpload`, `LoginForm`, `ProtectedRoute`): aviso de PR y cuidado de no tocar tokens ni peticiones.
5. **Entorno:** `npm test` solo con `--maxWorkers=2`; los tests con layout no existen en jsdom, así que A1, A2 y D1 dependen de Playwright, que no está en CI **(por decidir si se añade un script reproducible)**.
6. **Hallazgos sin medir:** `/cargar-archivos` en móvil, el interior de `Table`, `ContactForm`, lector de pantalla real.

## Fuera de alcance

El punto de partida es todo lo anterior. Si el `architect` o la vuelta 3 demuestran que no cabe, se recorta **en este orden**, con motivo:

1. Progreso por bytes de cada archivo (exige XHR en `api.js`, área de contrato): se queda el progreso «n de N». (Pregunta 3.)
2. Colores de las páginas públicas más allá del cambio de token (no se rediseñan Home, Explorar ni Galería, solo se corrigen los usos de `text-[#15B659]`).
3. Tablas: `scope="col"`, título y descripción (guía A14), salvo el desplazamiento horizontal (A3).
4. Un segundo `<select>` encadenado para provincias con muchas versiones (F2) y el orden de versiones por confirmar.
5. Cualquier ajuste del interior de `ContactForm` que no sea el patrón de mensajes.

Fuera sin condiciones: cambiar peticiones, rutas, cabeceras, cuerpos o textos de error del backend; la lógica de sesión de `api.js`, `LoginForm` y `ProtectedRoute` (solo la posición del botón y los estilos); B13 completo (migrar todos los hexadecimales de `src/`), B19 global (solo en lo que se toque), M13 (alojar las fuentes), modo oscuro y política de privacidad; probar con lector de pantalla real (se anota por confirmar).

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta (sin cambios de peticiones).
- `docs/integracion/para-infra.md`: no lo afecta (sin recursos ni variables nuevos; `assets.js` sin cambios).

## Decisiones del usuario (resueltas, 10/11/2026)

1. **Token `danger` `#B42318`** para los mensajes de error (6,32:1 sobre el fondo claro, por comprobar con el test de contraste de C2): se justifica en `DESIGN.md` y `tailwind.config.js`; los errores llevan icono y texto, no solo color.
2. **Banner de cookies con la barra inferior (móvil):** banner fijo **encima** de la barra, y la página reserva el espacio inferior mientras el banner exista; no tapa la navegación ni el contenido.
3. **Progreso de subida:** «n de N» y estado por archivo (`role="status"` / progreso), **sin tocar `api.js`**.
4. **Alcance:** un solo ciclo (bloques A a H), aprobado por el usuario con conocimiento del tamaño (45 a 55 ficheros de código, 25 a 30 de test, 8 a 10 documentos), de los tests existentes que se romperán, de las páginas sin tests de caracterización y de que `maxVueltas` es 3. El architect lo parte en fases de máximo 5 pasos y propone el orden de recorte si algo es inviable.

## Preguntas abiertas

Ninguna.

