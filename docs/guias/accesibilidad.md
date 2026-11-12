# Accesibilidad del frontend

Normas para que la web sea utilizable por todas las personas, con el estado real de cada una. SIGMETUM-A es un sitio público de una universidad: el objetivo es **WCAG 2.1 nivel AA**.

- Complementa a [buenas-practicas-frontend.md](buenas-practicas-frontend.md) y a [seguridad.md](seguridad.md).
- Los hallazgos con id (B) están en [09](../09-estado-actual-y-deuda-tecnica.md). La paleta está en [07](../07-i18n-y-estilos.md#paleta).
- Si un cambio contradice una regla de esta guía, **avisa y pregunta** antes de hacerlo.

## 1. Marco

| Elemento | Detalle |
|---|---|
| Norma técnica | WCAG 2.1 AA (equivale a la UNE-EN 301 549 v2.1.2) |
| Obligación legal | El Real Decreto 1112/2018 (accesibilidad de sitios web y aplicaciones móviles del sector público) exige cumplir ese nivel, publicar una **declaración de accesibilidad** y ofrecer un mecanismo de contacto para quejas. Que aplique a este sitio es **por confirmar con el servicio jurídico de la universidad** |
| Declaración de accesibilidad | **No existe hoy** |
| Principios | Perceptible, operable, comprensible y robusto |

## 2. Reglas

### A1. Contraste de color

- **Regla:** texto normal, al menos **4,5:1**; texto grande (18 px en negrita o 24 px) y componentes de interfaz (bordes de campos, iconos), al menos **3:1**.
- **Cómo se comprueba:** cálculo de la relación de luminancia (por ejemplo con la fórmula WCAG o una herramienta de contraste) antes de elegir un color. No hay comprobación automática.
- **Estado: decidido y cumple en el código (11/11/2026); por confirmar lo que queda fuera de las páginas privadas.** La spec de la auditoría (C1) decidió oscurecer el verde para texto y usar texto oscuro sobre el verde de marca; se añadieron los tokens `brand-deep` (`#0B7A3B`) y `danger` (`#B42318`) a `tailwind.config.js` (ver [07](../07-i18n-y-estilos.md#paleta)). Los valores los fija y los calcula `src/theme.test.js` con la fórmula de WCAG:

| Combinación | Relación | Resultado |
|---|---|---|
| `brand-deep` sobre `surface` (títulos, texto verde, botón alternativo) | 5,23:1 | Cumple |
| `brand-deep` sobre blanco | 5,44:1 | Cumple |
| `ink` sobre `brand` (botón principal, ítem activo) | 6,82:1 | Cumple |
| `ink` sobre `brand-dark` (hover) | 4,63:1 | Cumple |
| `moss` sobre `surface` (placeholders, ayuda, icono de información) | 6,27:1 | Cumple |
| `danger` sobre `surface` / sobre blanco (errores) | 6,33:1 / 6,57:1 | Cumple |
| `brand-dark` sobre `surface` (iconos y bordes de campos; componentes, 3:1) | 3,78:1 | Cumple |
| `ink` sobre `surface` | 17,50:1 | Cumple |
| `brand` sobre `surface` (control) | 2,57:1 | No cumple: no se usa para texto ni sobre él |
| `sage` sobre `surface` | 2,02:1 | No cumple: ya no se usa para placeholders ni texto |

- **Revisión de las privadas (11/11/2026):** el `<select>` de versiones deshabilitado usa `disabled:border-moss disabled:text-moss disabled:opacity-100` (`moss` sobre `surface`, 6,27:1) en lugar de `opacity-50`, en vez de acogerse a la exención de WCAG 1.4.3; la medición en local con API simulada (11/11/2026) dio `opacity` 1 y color `rgb(75, 100, 74)`, con `aria-describedby` al mensaje de vacío; contraste ≥ 4,5:1 según el cálculo de `theme.test.js`. Si la fuente de iconos no carga (`html.icons-failed`), cada icono pinta una caja de `1em` con borde `currentColor` (3:1 para componentes) en lugar del texto de la ligadura; medido en local con API simulada (11/11/2026) con Google cortado: `icons-failed`, texto de la ligadura invisible y caja de 16×16 px con borde de 2 px (más pequeña que el icono de 24 px; detalle cosmético anotado). La clase `icons-failed` también se pone si la fuente tarda más de 4 s y se retira si llega después. Con red lenta, lector de pantalla y barras clásicas **(por confirmar)**.
- **Reglas de uso:** títulos y texto verde sobre fondo claro `brand-deep`; relleno de botón `brand` con texto `ink`; el ítem de navegación activo o con ratón `bg-brand text-ink` (nunca `surface` sobre `brand`); iconos y bordes de campos `brand-dark`; placeholders y ayuda `moss`; errores `danger` siempre con icono y texto.
- **Medición del DOM (Playwright, 320, 375 y 1280 px, páginas privadas y `/explorar`):** los únicos textos por debajo del umbral son las letras U, M y A del logotipo de la cabecera (rojo 3,62:1, azul 3,54:1 y verde de marca 2,57:1), exentas por ser un logotipo (WCAG 1.4.3). Antes de la iteración se había medido 2,57:1 en títulos y botones. **Deuda:** las tarjetas de `About` (`surface` sobre `brand`) y otros textos de páginas públicas fuera de alcance; los estados hover y desactivado no se midieron todos **(por confirmar)**.

### A2. Todo se puede usar con el teclado

- **Regla:** cualquier cosa que se pueda pulsar es un `<button>` o un `<a>` (no un `<div onClick>`); se alcanza con Tab, se activa con Enter o espacio y el orden de foco es lógico.
- **Cómo:** ESLint avisa con `jsx-a11y/click-events-have-key-events` y `jsx-a11y/no-static-element-interactions`; prueba manual recorriendo la página solo con teclado.
- **Zona de arrastre de `/cargar-archivos` (11/11/2026):** el arrastre es un atajo; la vía por teclado es el botón «Seleccionar archivos», que no cambia ni de sitio ni de orden de Tab, y los dos caminos (botón y `drop`) filtran a `.xlsx` y anuncian lo añadido en una región `status` (`filesAdded_*`) y lo descartado en `InlineError` (`dropRejected`). Durante el arrastre el cambio no es solo de color: borde de discontinuo a continuo y texto `dropZoneActive`. Soltar texto o un enlace (sin archivos) no borra el error ni el anuncio vigentes, y el `font-bold` del arrastre va solo en el texto de la pista. Medido en local con API simulada (11/11/2026, eventos simulados): borde de `dashed` a `solid`, texto «Drop the files to add them.», «1 file added to the list.» (`role="status"`) y la alerta de descartados. Soltar un archivo fuera de la zona hace que el navegador lo abra (B49). Lector de pantalla y arrastre real, **(por confirmar)**.
- **Estado:** mejora. `FileDropdown` ahora es un `<select>` nativo (B22 resuelto: se alcanza con Tab y se maneja con teclas, sin `div onClick`); el panel de filtros atrapa el foco; los ítems de la barra de gestión son enlaces y botones reales (B27 resuelto: ya no hay un `<button>` dentro de un enlace) y hay un enlace «Saltar al contenido». Siguen abiertos avisos de elementos no interactivos con `onClick` (las tarjetas de especie). El orden real de Tab se probó solo en jsdom (`App.test.js`) **(por confirmar en un navegador)**.

### A3. El foco siempre es visible

- **Regla:** nunca quites el contorno de foco sin poner uno alternativo visible (`focus-visible:ring-2`, por ejemplo).
- **Cómo:** la clase `.focus-ring` (contorno `ink` más halo `surface`) o `.focus-ring-inset` (para campos recortados por un `overflow-hidden`); para encabezados no interactivos que reciben foco programático (`tabIndex={-1}`, p. ej. el `<h2>` de cada paso de `LoginForm`) `.focus-heading` (subrayado de 2 px del color del texto, sin contorno). Las tres en `src/index.css`; ver `DESIGN.md` («Foco»). El foco no queda tapado por la cabecera ni por la barra inferior: `html` lleva `scroll-padding-top` y `scroll-padding-bottom` (WCAG 2.4.11; el de abajo, 14 rem, es una estimación de barra más banner y **no se midió con el banner visible**, por confirmar).
- **Estado: cumple en el código, por confirmar a mano.** B17 está resuelto: ya no quedan `outline-none`, `outline-0` ni `ring-0` en `src/` (el recuento de sitios que había está en `docs/09`). Los campos de `ContactForm`, `FilterSearchBar` y `TextInput`, `ButtonPrincipal`, `ButtonAlternative`, las papeleras, `InfoButton` y `ScrollIndicator` llevan el anillo. **(Por confirmar)** en un navegador: pintado y contraste del anillo (sobre todo en `CookieBanner` y en el inicio) y el recorte del anillo interior en `FilterSearchBar` y `TextInput`. Quedan sin anillo los `label` y `FileDropdown`, que no reciben foco (ver A2).

### A4. Nombre accesible en controles sin texto

- **Regla:** un botón con solo icono lleva `aria-label` traducido, y el icono, `aria-hidden="true"`.
- **Por qué:** los iconos son **texto** (Material Symbols por ligadura): un lector de pantalla leería "delete", "keyboard_arrow_down" o "arrow_circle_down". Es el aviso más repetido de ESLint (`jsx-a11y/control-has-associated-label`).
- **Estado: cumple en los botones de solo icono (B1 resuelto).** Las claves son `iconButton.*` (`menu`, `close`, `previousPage`, `nextPage`, `info`, `infoAbout`, `scrollDown`; `delete` y `add` se retiraron: las papeleras tienen nombre con el elemento, p. ej. `contentManagement.deleteTerm`, y los botones de añadir llevan texto); `ButtonPrincipal` recibe `ariaLabel` en su rama de icono, y las ligaduras decorativas (chevrons de `ButtonAlternative` y `CategoryFilter`, `open_in_new`) llevan `aria-hidden="true"` sin añadir `aria-label` a botones que ya tienen texto. Los ítems de la barra de gestión tienen etiqueta visible (`privateNav.*`). `LoginForm` añade tres botones de mostrar contraseña con nombre fijo y distinto por campo (`login.showPassword`, `login.showNewPassword`, `login.showConfirmPassword`; no cambia al alternar, el estado va en `aria-pressed` y el icono en `aria-hidden`). El spinner se anuncia (`role="status"`) y los tooltips se asocian con `aria-describedby` (B16 resuelto en parte); falta probarlo con un lector de pantalla **(por confirmar)**.

### A5. Formularios

- **Regla:** cada campo tiene su `<label>` asociado (`htmlFor` + `id`, o anidado); el `placeholder` no sustituye a la etiqueta; los errores se anuncian (`role="alert"` o `aria-live`) y se asocian al campo (`aria-describedby`); los campos obligatorios se indican.
- **Estado: parcial, mejor.** `TextInput`, `FilterSearchBar` y el buscador de cada categoría llevan **etiqueta visible** asociada con `htmlFor` y `id` único (`useId`), placeholder `moss` y soporte de `aria-invalid` y `aria-describedby` (B3 resuelto en ellos). Los gestores de contenido y `ContactForm` muestran los errores de campo **en línea** con `InlineError` (`role="alert"`), con `aria-invalid` y `aria-describedby` y foco al campo solo cuando falla la validación; el selector de versión es un `<select>` con `<label>` visible. `LoginForm` (formulario propio de acceso con SRP) cumple: cada campo con `<label htmlFor>` y un `span` con `id` referenciado por `aria-labelledby`, obligatorios indicados (`required` y el texto `login.allRequired`), sin `placeholder`, `autoComplete` correcto (`username`, `current-password`, `new-password`, `one-time-code`), el error en `<p role="alert">` con `key` (se anuncia otra vez aunque sea el mismo) referenciado por `aria-describedby` de los campos del paso, y la política de contraseña en `aria-describedby` de los campos de contraseña nueva. `aria-invalid` solo en errores de validación (con «campos obligatorios», solo en los campos vacíos), y en `mfaSetup` la clave y el botón de copiar van antes del `<form>`, de modo que el aviso de error queda debajo de la clave. Los avisos de ESLint nuevos: ninguno (el tope de avisos no cambia). `ContactForm` asocia cada `<label>` a su campo (`htmlFor` + `id` con `useId`, B3). Sigue pendiente `aria-describedby` en los campos de `ContactForm` (cuyos placeholders `sage` y borde `brand` son deuda). Los botones de mostrar contraseña (48 por 48 px, fuera de la `<label>` porque un `<button>` no puede ir dentro) mantienen el foco tras pulsarlos (`focus()` imperativo por Safari y Firefox en macOS) y los campos de contraseña llevan `spellCheck={false}`, `autoCapitalize="none"` y `autoCorrect="off"`. Los botones de icono (B1) ya están resueltos (ver A4). Los avisos de ESLint `jsx-a11y/label-has-for` y `control-has-associated-label` en `ContactForm` siguen abiertos: no se anidó el `input` en la `<label>` (cambiaría el marcado).

### A6. Diálogos

- **Regla:** `role="dialog"` (o `alertdialog`), `aria-modal="true"`, `aria-labelledby` con el título, foco que entra al abrir y vuelve al elemento de origen al cerrar, foco atrapado dentro y cierre con **Escape**.
- **Cómo:** el hook `useDialogFocus` (`src/hooks/useDialogFocus.js`, ver `docs/06`); la caja del diálogo lleva `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y `tabIndex={-1}`, y el foco inicial va a esa caja (no al primer botón, para que Enter no confirme sin querer).
- **Panel de filtros (11/11/2026):** se nombra con `aria-labelledby` hacia el `<h2>` de `Filter` (`titleId`; `aria-label` solo de respaldo), bloquea el scroll del `body` mientras está abierto (se restaura al cerrar o desmontar), sin scroll propio con el contenido vacío (por confirmar con Playwright a 900 y 844 px de alto) y `scrollbar-gutter: stable` evita que el bloqueo mueva la página.
- **Estado: parcial.** `DialogAdvice` y `DialogSpecies` cumplen (B2 resuelto), igual que el panel de filtros de `Sidebar` (diálogo modal siempre montado, `hidden` cerrado, B21 resuelto en esa parte). **Sigue sin cumplir:** `CookieBanner`. Los diálogos de confirmación de borrado muestran el nombre del elemento y su botón dice «Eliminar». **(Por confirmar)** a mano: el orden real de Tab en el navegador, el efecto de `aria-modal` con NVDA o VoiceOver, que el foco vuelva tras la animación de salida, el contorno por defecto del navegador en la caja del diálogo y que `<summary>` entre en la trampa. Si el elemento que abrió el diálogo ya no existe al cerrar, el foco va al `main` (el hook le pone `tabindex="-1"`); la ficha de `SpeciesCard` no se puede enfocar, así que ahí el foco acaba en `main` o en `body`.

### A7. Estructura y navegación

- **Regla:** una sola `<h1>` por página, y los niveles de encabezado no se saltan; existen `<header>`, `<nav>`, `<main>` y `<footer>`; hay un enlace "Saltar al contenido".
- **Estado:** cumple en las páginas privadas. Hay un enlace «Saltar al contenido» (visible con foco, hacia `main#contenido`), un `<header>`, dos `<nav>` con nombre («Principal» y «Gestión»), un `<main>` y un único `<footer>`; `DataManagement`, `ContentManagement` y `FilesUpload` tienen un `<h1>` y `<h2>` por sección (B18 resuelto en ellas), además de `Home`, `Cookies`, `NotFound` y `Login`. **Deuda:** `/explorar` abre con `<h2>`, no `<h1>`. «V 1.0.0» del pie es un `<details>`.

### A8. Idioma

- **Regla:** el atributo `lang` del documento coincide con el idioma mostrado.
- **Estado: cumple** (WCAG 3.1.1). `src/i18n.js` actualiza `document.documentElement.lang` al arrancar y en cada cambio de idioma (`es` o `en`, el del texto realmente mostrado: un idioma no soportado como `fr` da `es`). `index.html` conserva `lang="es-ES"` solo hasta que arranca React. Lo cubre `src/i18n.test.js`; no se ha probado con un lector de pantalla **(por confirmar)**.

### A8b. Título de página

- **Regla:** cada página tiene un `<title>` descriptivo y distinto (WCAG 2.4.2), que sigue al idioma.
- **Estado: cumple.** `useDocumentTitle` (llamado en `App`) pone `<Página> · SIGMETUM-A` por ruta, también para el 404 (`notFound.title`) y para las rutas protegidas que redirigen a `/login`, y lo recalcula al cambiar de idioma. Al añadir una ruta hay que darle título: un test lo exige. Lo cubre `src/hooks/useDocumentTitle.test.js`.

### A9. Imágenes

- **Regla:** las imágenes informativas llevan un `alt` que describe su contenido; las decorativas, `alt=""`.
- **Miniaturas de la galería (11/11/2026):** `ImageGalleryManager` pinta una miniatura de 48×48 por fila con `alt=""` (el nombre ya está como texto al lado), `width` y `height` y, si la URL prefirmada (1 h) falla o `isSafeImageUrl` no la acepta (solo `https:`, o `http:` en `localhost`/`127.0.0.1`), una caja con borde `sage` sin pedir la imagen.
- **Estado: incumple en `ImageComponent`; el QR del MFA cumple.** El QR de `LoginForm` (`QrCode`) es un SVG con `role="img"` y `aria-label` `login.qrLabel`, que no contiene la URI ni el secreto (la clave en texto, en grupos de 4, es la alternativa para quien no puede escanear). Contraste y lector de pantalla **(por confirmar)**. `ImageComponent` pone `alt="Imagen"` en todas, incluidos los logos institucionales, que deberían llevar el nombre de la entidad. El logo de la cabecera tiene `alt="Logo"` (B5). En la galería el `alt` es el nombre de archivo.

### A10. Enlaces

- **Regla:** el texto del enlace dice a dónde lleva; los que abren pestaña nueva lo indican; los enlaces que solo contienen una imagen llevan el `alt` de esa imagen.
- **Estado:** nueve avisos de `jsx-a11y/anchor-has-content` (logos dentro de enlaces, sin `alt` útil).

### A11. Movimiento

- **Regla:** se respeta `prefers-reduced-motion`; nada parpadea ni se mueve sin control del usuario más de 5 segundos.
- **Cómo:** `useReducedMotion` o `<MotionConfig reducedMotion="user">` de Motion, y `@media (prefers-reduced-motion: reduce)` para CSS.
- **Estado: incumple** (B19): fondo con parallax (`background-attachment: fixed`), flecha con rebote infinito y transiciones de página.

### A12. Contenido dinámico

- **Regla:** los estados de carga y los mensajes que aparecen sin acción del usuario se anuncian (`role="status"` o `aria-live="polite"`; los errores, `role="alert"`).
- **`ProtectedRoute` (11/11/2026):** mientras valida no pinta nada; tras «Reintentar» hay una región `<p role="status" className="sr-only">` con `login.loading` que es el mismo nodo (vacío) que había en `unavailable`, para que el cambio de texto se anuncie, y el foco pasa antes a `main#contenido` para que no caiga en `body` al desmontarse el botón. Probado en jsdom; anuncio real con lector **(por confirmar)**. Si la revalidación entre páginas privadas acaba en `unavailable`, la barra con el enlace enfocado desaparece y el foco cae en `body` (el `role="alert"` lo anuncia, por confirmar en un navegador; B47).
- **Estado: parcial, mejor.** Patrón de avisos: `ToastProvider` monta siempre una región `role="status"` (éxitos, se cierran solos a los 8 s con pausa con ratón o foco, WCAG 2.2.1) y otra `role="alert"` (errores, persistentes hasta cerrarlos); nunca mueven el foco y los errores de campo van en línea (`InlineError`). `LoadSpinner` anuncia con `role="status"` (texto `sr-only` en superposición; en línea queda siempre montado). Tras borrar una versión, un término o una imagen el foco va a un encabezado (`.focus-heading`, `tabIndex={-1}`) y no a `body`. El selector de versiones descarta respuestas tardías (las flechas sobre un `<select>` cerrado disparan `change` por opción en Windows). `LoginForm` cumple: un `<p role="status">` siempre presente anuncia `login.loading` («Comprobando…») mientras dura la petición y el resultado de copiar la clave (`copied` o `copyFailed`); el foco va al `<h2>` al entrar en cada reto, al correo al volver al primer paso y, tras un error, al primer campo vacío (en credenciales) o al campo del paso; tras un reintento repetido en `mfaSetup` el foco no va a ningún campo (B30). En `mfaSetup` la clave va en un `<code>` en grupos de 4 con espacios reales (el lector lee los grupos; no se le pone `aria-label`, ARIA no permite nombrar `code`). No se ha probado con un lector de pantalla **(por confirmar)**; tampoco si «Comprobando…» llega a pintarse antes del cálculo SRP (`signIn` cede un turno real con `await sleep(0)`; **por confirmar en un navegador**).

### A13. Tooltips

- **Regla:** se muestran también con el foco del teclado, se ocultan con Escape, y el botón se asocia a su texto con `aria-describedby`.
- **Estado: cumple en el código (B16 en parte).** `InfoButton` se muestra con ratón, foco y clic, `aria-describedby` apunta al tooltip (`role="tooltip"`), Escape lo oculta (WCAG 1.4.13), pasar el ratón al tooltip no lo cierra y el botón mide 44×44. Desde el 11/11/2026 el hueco entre el botón y la caja forma parte del tooltip (envoltura transparente con `pt-2`, sin `mt-2`), de modo que ir del botón al texto no dispara `onMouseLeave`; el tooltip se desplaza para quedar entre 16 px y `innerWidth − 16` y pasa encima si no cabe debajo; y cada «i» de las páginas privadas lleva `topic` (nombre `Información: <título>`), con lo que no hay dos `aria-label` iguales en una página (en `/explorar` quedan dos «i» con el mismo nombre, B48). Probado en jsdom; la posición real dentro del viewport a 390, 768 y 1440 px **(por confirmar)** con Playwright; lector de pantalla **(por confirmar)**.

### A14. Tablas

- **Regla:** cabeceras `<th scope="col">` y un título o descripción que explique qué muestra la tabla.
- **Estado: cumple en el código.** `Table` lleva `<th scope="col">`, un `<caption className="sr-only">` y va en una región `role="region"` con nombre y `tabIndex={0}`, de modo que la tabla ancha se desplaza dentro de ella con teclado. Un `role="region" tabIndex={0}` añade un aviso de ESLint (`no-noninteractive-tabindex`) que se compensa con los `div onClick` retirados.

### A15. Adaptación y zoom

- **Regla:** la página se usa a 320 px de ancho y con zoom del 200 % sin scroll horizontal ni pérdida de contenido; los elementos que se pulsan son lo bastante grandes (WCAG 2.2 pide 24 por 24 píxeles como mínimo; conviene cumplirlo aunque el objetivo sea la 2.1).
- **Estado: cumple en las páginas privadas y `/explorar` (medido).** Con Playwright (ver §3), a 320, 375, 768, 1024 y 1280 px (es) no hay desbordamiento horizontal (`scrollWidth <= innerWidth`); la tabla ancha de `/administrar-datos` se desplaza dentro de su región; la barra inferior muestra 4 o 5 ítems sin etiquetas recortadas a 320 px y la cabecera aguanta hasta 305 px; todos los objetivos táctiles de las privadas miden ≥ 44 px (los «44x44» que listó el script son redondeo de fracciones). Antes: desbordamiento a 375 px con papeleras fuera de pantalla. En `LoginForm` el QR mide 192 por 192 px y los botones de mostrar 48 por 48 px. `/explorar`, `/galeria` y `/sobre-nosotros` tampoco desbordan en esos anchos (en inglés a 320 px, tampoco las privadas); «Descargar glosario» mide 48 px de alto y cabe entero. El banner de cookies compacto (228 px a 320x700, 43 % con la barra) no tapa el campo enfocado gracias a `scroll-padding-bottom: 20rem`. **Deuda:** `Home` tiene objetivos táctiles menores de 44 px a 320 px (páginas públicas fuera de alcance). **No medido (por confirmar):** orden de Tab real, lector de pantalla, zoom al 200 %, alto contraste de Windows y táctil real.

## 3. Cómo se comprueba

| Capa | Qué cubre | Cuándo |
|---|---|---|
| **ESLint `jsx-a11y`** (`npm run lint`) | Etiquetas, `alt`, eventos sin teclado, roles. Los avisos tienen un tope que no puede crecer | En cada cambio |
| **Teclado** | Recorrer la página solo con Tab, Enter, espacio y Escape | Cada pantalla nueva o modificada |
| **Lector de pantalla** | NVDA con Firefox o Chrome en Windows; VoiceOver en Safari | Antes de fusionar cambios de interfaz importantes |
| **Axe DevTools o Lighthouse** | Contraste, nombres, estructura | Cada pantalla nueva |
| **Zoom y móvil** | 200 % de zoom y 320 px de ancho | Cada pantalla nueva |
| **Playwright (medición manual con el plugin MCP)** | Desbordamiento a 320 px y otras anchuras, objetivos táctiles ≥ 44 px, contraste del DOM, capas (`elementFromPoint`) y estructura (un `<h1>`, un `<main>`, un `<footer>`, `<nav>` con nombre). Procedimiento en [08](../08-guia-desarrollo.md#medición-con-playwright) | Cuando una iteración toca el marcado o los estilos de varias pantallas |
| **Playwright + axe** (pendiente) | Automatizar axe en las rutas públicas y la medición anterior como suite | Siguiente paso recomendado |

ESLint solo detecta una parte de los problemas: no puede juzgar el contraste, el orden de foco ni si un texto alternativo tiene sentido. Las pruebas manuales no se pueden omitir.

## 4. Lista de comprobación para una PR con interfaz

- [ ] Se puede hacer todo solo con el teclado y el foco es visible.
- [ ] Los botones de solo icono tienen `aria-label` y el icono `aria-hidden`.
- [ ] Los campos tienen etiqueta asociada y los errores se anuncian.
- [ ] Los colores nuevos cumplen el contraste (4,5:1 texto, 3:1 componentes).
- [ ] Las imágenes tienen `alt` útil (o vacío si son decorativas).
- [ ] Los diálogos nuevos cumplen A6.
- [ ] La animación nueva respeta `prefers-reduced-motion`.
- [ ] Se ha revisado a 320 px y con zoom al 200 %.
- [ ] `npm run lint` no supera el tope de avisos; si se corrigieron avisos, se bajó el tope.

## 5. Declaración de accesibilidad

Por el Real Decreto 1112/2018 hay que publicar una declaración de accesibilidad (estado de conformidad, contenidos no accesibles y su motivo, fecha, y un canal de contacto). **Falta.** Hasta que los hallazgos B5, B16, B19 y los contrastes de las páginas públicas se resuelvan, su estado sería de conformidad parcial. Decidir con la universidad quién la redacta y dónde se publica (por ejemplo en el pie, junto a "Cookies").

## 6. Mantener esta guía

- Al resolver una regla, se actualiza su "Estado" y se mueve el hallazgo a "Resueltos" en [09](../09-estado-actual-y-deuda-tecnica.md).
- Si se automatiza una comprobación (axe en Playwright, por ejemplo), se mueve de "pendiente" a la tabla de la sección 3.
- Si cambia la paleta, se recalculan y se actualizan las relaciones de la regla A1.
