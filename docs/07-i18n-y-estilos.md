# 07. Internacionalización y estilos

## Internacionalización

### Configuración (`src/i18n.js`)

- Idiomas: español (`es`, por defecto y de reserva) e inglés (`en`).
- Detección: `i18next-browser-languagedetector` (cadena de consulta, cookie, `localStorage`, navegador...). El idioma elegido queda en `localStorage['i18nextLng']`.
- **`lang` de `<html>`:** `i18n.js` registra `languageChanged` (antes de `init`) y asigna `document.documentElement.lang = i18n.resolvedLanguage`, o `es` si no hay. Siempre vale `es` o `en`, el idioma del texto realmente mostrado: `en-US` da `en`, `es-ES` da `es` y un idioma no soportado como `fr` cae al texto de reserva y da `es`. `index.html` conserva `lang="es-ES"` solo para el instante previo al arranque de React.
- **Título de la pestaña:** `useDocumentTitle` (ver [06](06-utilidades-hooks-config.md#usedocumenttitle-srchooksusedocumenttitlejs)) lo traduce con el idioma activo y lo recalcula al cambiarlo, sin recargar; "SIGMETUM-A" no se traduce.
- `escapeValue: false`: React ya escapa el contenido. Por eso **no** se debe usar `dangerouslySetInnerHTML` con traducciones.

### Archivos

`src/languages/es/translation.json` y `src/languages/en/translation.json`, con las mismas claves. La prueba `src/languages/translations.test.js` falla si una clave falta en un idioma, si difieren los marcadores de interpolación (`{{x}}`) o si una traducción está vacía. Se retiró `src/languages/es-typos.test.js`: fijaba el texto de `login.unauthorizedLabel`, que ya no existe (el login lo hace Cognito).

| Espacio | Contenido |
|---|---|
| `navbar` | Opciones del menú y `label` (nombre del `<nav>` principal, «Principal») |
| `footer` | Enlaces, copyright (`{{currentYear}}`), títulos de columna (`institutionsTitle`, `contactTitle`, `linksTitle`), `galleryOption` y `contactFormLink` |
| `home` | Portada (`exploreButton` y `galleryButton` sustituyen a `searchButton`), contacto, correos (`emailsData` con formato `Nombre / email / ...`) y ubicación. `contactForm.*` suma los avisos de ayuda de cada campo (`nameHint`, `emailHint`, `subjectHint`, `messageHint` con `{{min}}`), `allRequired`, `submitHelpTitle` y los textos de lo que falta para enviar (`missingName`, `missingEmail`, `invalidEmail`, `missingSubject`, `shortMessage`) y el resumen anunciado a lectores de pantalla tras un envío inválido (`errorSummary_one` y `errorSummary_other`, plural de i18next con `{{count}}`: «Hay {{count}} error/errores en el formulario.») |
| `form.errors` | Errores de validación en cliente de `validateContact`: `required`, `email` y `minLength` (`{{count}}`) |
| `explore` | Explorador, `resultsInfo` (`{{currentResults}}`, `{{totalResults}}`), `dialogSpecies.attributes.*` y `empty.*` (título y causa de los tres estados de `EmptyState`: error, sin datos y sin resultados, más `clearFilters`). Se retiraron `noDataFoundPlaceholder` y `errorLoadPlaceholder` |
| `gallery` | Título, `loading`, `openPhoto` (`{{name}}`, nombre accesible del botón de cada foto), `errorTitle`, `errorCause`, `emptyTitle`, `noDataFoundPlaceholder` (causa del estado vacío; la galería no lleva texto por defecto en el código) y `viewer.counter` (`{{current}}` de `{{total}}`) |
| `aboutUs` | Sobre nosotros |
| `filter` | Textos del filtro; `categoryFilter.searchLabel` («Buscar en {{category}}») es la etiqueta visible del buscador de cada categoría |
| `attributes` | **Nombres visibles de las columnas de datos.** La clave es el nombre exacto de la columna en el Excel (`"Provincia"`, `"Sector Biogeográfico"`...) |
| `login` | Acceso con Cognito: título, botones (`logInButton`, `continueButton`, `verifyButton`, `copyButton`, `retryButton`, `logOutButton`), etiquetas (`emailLabel`, `passwordLabel`, `newPasswordLabel`, `confirmPasswordLabel`, `codeLabel`, `secretLabel`, `qrLabel`, `showPassword`, `showNewPassword`, `showConfirmPassword`), títulos de los retos (`newPasswordTitle`, `mfaSetupTitle`, `totpTitle`), ayudas (`allRequired`, `passwordPolicy`, `mfaSetupHelp`, `mfaSetupAgain`, `loading`, `copied`, `copyFailed`) y errores (`requiredFields`, `credentialsError`, `sessionExpired`, `codeSessionLost`, `passwordPolicyError`, `passwordMismatch`, `passwordRejected`, `codeFormatError`, `codeError`, `startError`, `serviceUnavailable`). `qrLabel` es el nombre accesible del QR y las tres `show*` nombran los botones de mostrar contraseña (nombres distintos por campo, WCAG 2.4.6); `mfaSetupHelp` menciona el QR y termina en punto; `copyFailed` avisa de que los espacios no forman parte de la clave. Se retiró `otpUriLabel` (la dirección ya no se pinta), además de `callbackLoading` y `callbackError` (el Hosted UI ya no existe), los textos del acceso anterior, `unauthorizedLabel` y `tooManyAttemptsLabel`. `credentialsError` es el mismo texto para contraseña incorrecta, usuario inexistente y reinicio de contraseña (no revela si el usuario existe) |
| `uploadFiles` | Carga de archivos. **Primer plural del proyecto:** `fileUploadForm.uploadFilesButton_one` y `_other` («Subir {{count}} archivo» / «Subir {{count}} archivos»; i18next v23 usa los sufijos `_one` y `_other`), `progress` («Subiendo archivo {{current}} de {{total}}…»), `fileStatus.*` (pendiente, subiendo, subido, error y decisión), `filesListLabel`, `removeFile`, `noFilesSelected` y, de la zona de arrastre, `dropZoneHint`, `dropZoneActive`, `dropRejected` y `filesAdded_one`/`_other` («Se ha añadido {{count}} archivo a la lista.»). Se retiró el `uploadFilesButton` sin plural |
| `dataManagement` | Administrar datos. `fileSelectDropdwon` gana `emptyOption`, `loading`, `emptyState` (reescrito el 11/11/2026: «Todavía no se ha subido ningún archivo de datos, así que no hay versiones para elegir.») y `emptyStateLink` (el nombre con la errata se conserva); `downloadExcelButtonTooltip` ya no habla de «resultados filtrados» (descarga todos los datos de la versión elegida, porque `/manage-data` no tiene filtros) y pierde `selectFileDropdownPlaceholder`, `provinceTitle`, `versionTitle`, `versionPlaceholder` y `noDataFoundPlaceholder`, que quedaron huérfanas; también `loadingVersionData`, `deleteVersionNamed` y `table.regionLabel` |
| `contentManagement` | Administrar contenido: `addTermButton`, `addImageButton`, `termsListLabel`, `imagesListLabel`, `deleteTerm` y `deleteImage` (con `{{name}}`), `loadingTerms`, `loadingImages`, `imageTitleRequired`, `imageFileRequired` y `noImageSelected`; `noTermsFoundPlaceholder` y `noImagesFoundPlaceholder` pasan a explicar qué hacer; `noLatinTermsPlaceholder` y `galleryManagementPlaceholder` son ahora las etiquetas visibles de sus campos |
| `contactRecipients` | Panel de destinatarios de contacto (BL1): `title`, `tooltip` (`{{max}}`), `label`, `add`, `counter` (`{{count}}` y `{{max}}`), `empty` (explica que se usa la dirección por defecto), `errorLoad` (también cubre que falte el fichero en el almacenamiento), `maxReached` (`{{max}}`), `lastRecipient`, `removeRecipient` y `confirmDelete`, `successAdded` y `successRemoved`, `errorAdd` y `errorRemove`, `loading`, `loadingHint` («Cargando la lista…» / «Loading the list…», descripción accesible de «Añadir» mientras carga), `listLabel` y `errors.duplicate`. Reutiliza `form.errors.required` y `form.errors.email`, `dialogAdvice.deleteButton` y `feedback.retry` |
| `dialogAdvice` | Mensajes de éxito, error y aviso (incluye `errorEmailRateLimit`, `errorEmailInvalid`, `errorDraftNotFound` y `adviceInvalidImageTitle`); `rowEmpty` (`{{rowIndex}}`) y `fieldsMissingMessage` (`{{filename}}`). Entran `confirmDeleteTitle`, `deleteButton` y `confirmDeleteVersion`, `confirmDeleteTerm` y `confirmDeleteImage` (con `{{name}}`); salen `successTitle`, `errorTitle` y `adviceNoImageData` |
| `cookies` | Política, banner y modal, con una clave por elemento (13/11/2026): título y subtítulos de sección; un párrafo por clave (`descriptionAboutCookies`, `descriptionAboutCookiesNote`, `descriptionAboutPixel`, `descriptionAboutPixelMoreInfo`, `usesIntro`, `usesClosing`, `descriptionCookiesManagement` y `descriptionCookiesManagementBrowser`); un elemento de lista por clave (`typeFirstParty` y `typeThirdParty`, con etiquetas `<strong>` para `<Trans>`; `useNavigation`, `useSettings`, `useAnalytics`, `useTraffic` y `useAdvertising`); las cuatro categorías (`subtitle*CookiesCategory` sin numeración «1.» a «4.», y `description*CookiesCategory`); los enlaces de «Más información» van fuera de los párrafos (`moreInfoTitle`, `linkIco` y `linkAboutCookies` más los de cada navegador). Se retiraron `descriptionTypeCookies` y `descriptionCookiesUse` (un solo texto con «•» y saltos de línea). Ninguna clave `cookies.*` lleva «•», `\n`, dobles espacios ni `<a>` (salvo `banner.description`, B73) |
| `institutions` | Nombre accesible de cada logo (`uma`, `ual`, `ugr`, `uhu`, `uja`, `efyve`, `geospace`, `mafo`), que lleva `LogoLink` como `alt` |
| `a11y` | `opensInNewTab` («(se abre en una pestaña nueva)»), el texto solo para lectores de pantalla de los enlaces externos |
| `iconButton` | Nombres accesibles de los botones de solo icono: `menu`, `close`, `previousPage`, `nextPage`, `info`, `infoAbout` («Información: {{topic}}» / «Information: {{topic}}», para los `InfoButton` con `topic`) y `scrollDown`, `previousPhoto` y `nextPhoto` (visor de la galería) (un test comprueba el texto exacto en ambos idiomas). Se retiraron `add` y `delete`: los botones de añadir y de borrar llevan texto o un nombre con el elemento (`contentManagement.deleteTerm`, `deleteImage`, `removeFile`, `deleteVersionNamed`) |
| `skipLink` | «Saltar al contenido» / «Skip to content» |
| `privateNav` | `label` («Gestión» / «Management», nombre del `<nav>` de la barra privada) y las etiquetas `data`, `terms`, `gallery`, `recipients`, `upload` y `filters` (Datos / Términos / Galería / Correos / Cargar / Filtros; `recipients` es «Correos» / «Emails» desde el 12/11/2026, mientras el título y los textos de la página siguen «Destinatarios…»; `terms`, `gallery` y `recipients` son nuevas del 12/11/2026 y sustituyen a `content`; se borraron las huérfanas `privateNav.content`, `contentManagement.title` y `contentManagement.description`) |
| `feedback` | `close` («Cerrar aviso»), `loading` («Cargando…») y `retry` («Reintentar») |
| `notFound`, `pagination`, `language`, `ee` | Varios. `language.label` («Idioma») es la etiqueta del `<select>`; `language.spanish` y `language.english` («Español» y «English») son el texto de sus opciones. `notFound.title` ("Página no encontrada" / "Page not found") es el título de pestaña del 404 |

### Convenciones

- Usa siempre `t('espacio.clave')`. Para textos con enlaces o negritas, usa `<Trans i18nKey components={{ a: <a .../> }} />`.
- Añade cada clave nueva **a los dos idiomas** a la vez.
- Si se añade una columna nueva al Excel, añade su traducción en `attributes` o se mostrará el nombre en bruto (`t('attributes.X', 'X')`).
- Textos que hoy están fijos en el código y deberían pasar a traducciones: `ErrorBoundary`, colaboradores de `Home.js` y alertas de `UploadButton` (los nombres de `menuOptions` ya usan `privateNav.*`).
- Plurales: usa la clave con sufijos `_one` y `_other` y pasa `{ count }` a `t()`.
- Los `translation.json` se reindentaron a 2 espacios en esta iteración (el diff muestra ruido de formato; el contenido es el mismo).

## Estilos

El sistema de diseño para quien crea interfaz (paleta con su contraste, tipografía, formas, componentes, qué hacer y qué no) está en [DESIGN.md](../DESIGN.md), en la raíz. Este documento describe cómo está hecho hoy; si cambias la paleta o las fuentes, actualiza los dos.

### Enfoque

Tailwind CSS con clases utilitarias directamente en el JSX. No hay componentes de estilo compartidos salvo los botones. `App.css` es residual y `styled-components` solo se usa en `Switch`.

### Foco (`index.css`)

Dos clases en `@layer components` de `src/index.css`, sobre `:focus-visible` y con los colores de la paleta (`ink` `#0C1811`, `surface` `#F9FBFA`):

| Clase | Efecto | Se usa en |
|---|---|---|
| `.focus-ring` | `outline` de 2 px `ink` con `outline-offset: 2px` y `box-shadow: 0 0 0 2px` `surface` (halo interior, para que el anillo se vea sobre fondos oscuros como el `CookieBanner`) | Campos de `ContactForm`, `ButtonPrincipal`, `ButtonAlternative`, papeleras, `InfoButton`, `ScrollIndicator`, el `<select>` de idioma y el de versiones, la región con scroll de `Table` y el enlace «Saltar al contenido» |
| `.focus-heading` | Sin `outline`; `text-decoration: underline` de 2 px con `text-underline-offset: 4px` (del color del texto, sin colores nuevos). Patrón para encabezados no interactivos que reciben foco programático | `<h2>` de cada paso de `LoginForm`, `<h1>` de `DataManagement` (foco tras borrar una versión) y `<h2>` de `TermsManager` e `ImageGalleryManager` (foco tras borrar un término o una imagen), todos con `tabIndex={-1}` |
| `.focus-ring-inset` | `outline` de 2 px `ink` con `outline-offset: -2px`, sin halo | `input` de `FilterSearchBar` (con `rounded-r-xl`) y `TextInput` (con `rounded-xl`), cuyo `label` con `overflow-hidden` recortaría el anillo exterior; el radio propio del `input` hace que el anillo interior conserve las esquinas |

Se usa `outline` y no `ring` porque el contorno se mantiene en el modo de alto contraste de Windows. `.focus-ring` fija `box-shadow` con la misma especificidad que las utilidades de Tailwind y en una capa posterior: una utilidad `shadow-*` o `ring-*` futura en el mismo elemento ganaría sobre el halo. Pintado, contraste y recorte sin comprobar en un navegador **(por confirmar)**. Ver [DESIGN.md](../DESIGN.md) y A3 en [accesibilidad](guias/accesibilidad.md).

### Otros ajustes de `index.css` y de clases

- **`scrollbar-gutter: stable`** (en el mismo bloque `html`): reserva el hueco de la barra de desplazamiento para que bloquear el `body` con el panel de filtros abierto (`overflow: hidden`) no mueva la página. Con barras de desplazamiento clásicas de Windows está **(por confirmar)**.
- **`scroll-padding` (WCAG 2.4.11, foco no tapado):** `html { scroll-padding-top: 5rem; scroll-padding-bottom: 20rem; }` en `@layer base`. 5 rem cubre la cabecera fija (4 rem) más margen; 20 rem cubre la barra inferior (72 px) más el banner de cookies compacto, **medido** con Playwright (228 px a 320x700 y 196 px a 375x667; un campo enfocado cerca del borde inferior no queda tapado). El banner usa tipografía compacta en móvil (`p-3 sm:p-4`, título `text-sm sm:text-base`, texto `text-xs sm:text-sm`). La clase `tracking-light` no existe en Tailwind y se retiró de las páginas. `main` lleva `tabIndex={-1}` sin `focus:outline-none`, así que el navegador puede pintar su contorno por defecto al llegar por el enlace de salto **(por confirmar)**.
- Acceso:

- `input::-ms-reveal { display: none; }` (en `@layer base`): Edge pinta su propio botón de revelar en `type="password"` y duplicaría el del formulario. Efecto en Edge y con gestores de contraseñas que ponen su icono a la derecha (pueden solaparse con el botón de mostrar) **(por confirmar a mano)**.
- `block` en `FIELD_CLASS` de `LoginForm`: un input en línea deja un hueco bajo la línea y el botón de mostrar (`bottom-0`) no cuadraría. Afecta igual a todos los campos del formulario.
- `w-48 max-w-full h-auto` en el QR (192 px, sin `h-48`: la altura sale del `viewBox`; a 320 px de ancho mide 192x192) y `forced-color-adjust-none` (Tailwind 3.4 lo genera; evita que los colores forzados inviertan el QR, **por confirmar a mano** con modo oscuro forzado y contraste alto).

### Tipografía (`tailwind.config.js` + `index.css`)

| Token | Fuente | Se aplica a |
|---|---|---|
| `font-primary` | Amaranth | `h1`-`h3`, `th`, `summary` y la cursiva de los nombres científicos |
| `font-secondary` | Sen | `body`, `p`, `button`, `a`, `label`, `span`, `input`, `textarea`, `select`, `td`, `li` |

Las fuentes se cargan en `index.html`, solo con los pesos que usa el código: **Amaranth 700 (normal y cursiva) y Sen 400 y 700** (antes Amaranth 400/700 y Sen 400..800 como rango; `theme.test.js` fija la URL). Sen no tiene cursiva, así que los nombres científicos siguen en Amaranth cursiva (`font-primary italic`). El cuerpo (`body`) y `textarea` y `select` van en Sen (los controles antes heredaban Amaranth). Las fuentes se cargan desde Google Fonts en `index.html` (raíz del proyecto, no `public/`), junto con Material Symbols Outlined para los iconos, con dos `<link rel="stylesheet">` normales: ya no hay `preload` con `onload` en línea (M13 parcial: siguen viniendo de Google Fonts).

#### Fuentes e iconos

- Hay `<link rel="preconnect">` a `fonts.googleapis.com` y a `fonts.gstatic.com` (este con `crossorigin`). Mukta Malar se quitó de la URL: ningún código la usa (sin `font-mukta`, `fontFamily` ni CSS que la nombre).
- Material Symbols se pide como subconjunto: `&icon_names=<22 nombres ordenados alfabéticamente, sin repetir>&display=block` (los iconos que usa el código más `upload_file`; `warning` se añadió para la variante de aviso de `noticeStyles`). `src/iconNames.test.js` comprueba que la lista está ordenada y sin repetir y que incluye todos los nombres hallados en `src/**/*.js` (no tests) con `icon=`/`icon:` y dentro de `material-symbols-outlined`, más los dinámicos `check_circle`, `error`, `visibility`, `visibility_off` y `progress_activity`: **al añadir un icono nuevo hay que añadirlo a `icon_names` de `index.html`** o el test falla. Una petición real con esos `icon_names` devolvió HTTP 200 con `@font-face` woff2, `font-display: block` y sin `unicode-range` (comprobado el 11/11/2026).
- `watchIconFont` ([06](06-utilidades-hooks-config.md)) pone `icons-ready` o `icons-failed` en `<html>`. En `index.css`: `html:not(.icons-ready):not(.icons-failed) .material-symbols-outlined { visibility: hidden; … width: 1em }` (no se ve el texto de la ligadura mientras carga) y `html.icons-failed .material-symbols-outlined` pinta una caja de `1em` del color del texto (`box-shadow: inset 0 0 0 2px currentColor`, `-webkit-text-fill-color: transparent`), 3:1 para componentes según A1. Sin autoalojar ni dependencias nuevas (decisión del usuario); sigue pendiente alojarlas en el propio sitio (M13). Si la fuente tarda más de 4 s (`FONT_TIMEOUT_MS`) se pone `icons-failed`; si llega después, `icons-ready` lo retira. Medido en local con API simulada (11/11/2026) con `fonts.googleapis.com` y `fonts.gstatic.com` abortadas: `<html class="icons-failed">`, texto de la ligadura invisible (`-webkit-text-fill-color` transparente) y caja de 16×16 px con `box-shadow` inset de 2 px, más pequeña que el icono normal de 24 px (detalle cosmético anotado, no corregido). Con red lenta (throttling) **(por confirmar)**.

#### Espaciado con nombre

Escala de valores computados admitidos: {4, 8, 12, 16, 24, 32, 48, 64} px. El código nuevo de las páginas públicas usa los tokens de `theme.extend.spacing` (sirven con `p-`, `m-`, `gap-`, `space-`, `py-`...); las clases por defecto que dan el mismo valor computado se aceptan sin renombrar.

| Token | Valor | Uso |
|---|---|---|
| `gutter`, `gutter-md`, `gutter-lg` | 16, 24 y 32 px | Margen lateral de la página (`.page-container` en `index.css`: `mx-auto w-full max-w-6xl px-gutter md:px-gutter-md lg:px-gutter-lg`) |
| `stack-xs`, `stack-sm`, `stack-md`, `stack`, `stack-lg`, `stack-xl` | 4, 8, 12, 16, 24 y 32 px | Separación vertical dentro de un bloque (`stack-lg` entre título y contenido, `stack` dentro de tarjetas) |
| `section`, `section-lg` | 48 y 64 px | Ritmo entre secciones (`py-section` en móvil, `md:py-section-lg` desde `md`) |
| `nav` | 72 px (4,5 rem; sale de `NAV_HEIGHT_PX` en `src/config/layout.js`, que importa `tailwind.config.js`) | Barra inferior de gestión |

#### Tamaños y pesos de letra (páginas públicas)

Escala de Tailwind por defecto: `sm` 14, `base` 16, `lg` 18, `xl` 20, `2xl` 24, `3xl` 30, `4xl` 36 y `5xl` 48 px; `xs` (12 px) solo en la barra inferior de gestión (bajo 768 px) y en el banner de cookies (bajo 640 px). Pesos: solo 400 y 700 (se retiraron `font-medium`, `font-semibold` y `font-black` del código). Medido el 12/11/2026 en local con la API simulada: en las privadas solo aparecen Sen y Amaranth con pesos 400 y 700 y tamaños {12, 14, 16, 18, 20, 24, 32} (desde el 13/11/2026 el `h1` de las privadas mide 30 px). Escala de títulos de contenido: ver [DESIGN.md](../DESIGN.md), «Sistema de contenido».

### Paleta

Los colores son **tokens de `theme.extend.colors`** de `tailwind.config.js` (`bg-brand`, `text-ink`, `border-brand-dark`...) y la altura de la barra inferior es `spacing.nav` (`h-nav`, `pb-nav`, `bottom-nav`, 4,5 rem). El espaciado propio está en `theme.extend.spacing` (tabla de abajo); las escalas de tamaño de letra, de espaciado y de radios por defecto de Tailwind **no se redefinen** (lo comprueba `theme.test.js`). `gray-800`, `red-500`, `blue-500` y `white` de Tailwind siguen existiendo.

| Token | Valor | Uso |
|---|---|---|
| `brand` | `#15B659` | Relleno de botón principal, ítem de navegación activo o con ratón, bordes de acento. Nunca como texto sobre fondo claro |
| `brand-dark` | `#0e9447` | Hover del botón principal, borde del botón alternativo y de los campos, iconos y casilla marcada |
| `brand-deep` | `#0B7A3B` | **Nuevo.** Títulos y texto verde sobre fondo claro; texto del botón alternativo |
| `surface` | `#F9FBFA` | Fondo general |
| `ink` | `#0C1811` | Texto principal, pie y capas oscuras; texto sobre `brand` |
| `ink-soft` | `#14281D` | Párrafos largos |
| `sage` | `#99BBA8` | Bordes suaves y hover; **ya no** para placeholders ni texto |
| `moss` | `#4B644A` | Placeholders, icono de información y ayuda |
| `danger` | `#B42318` | **Nuevo.** Errores, siempre con icono y texto |
| `forest` | `#0F3D2A` | **Nuevo (páginas públicas).** Títulos de las tarjetas de Sobre nosotros, sobre `sage-soft` (10,78:1) |
| `sage-soft` | `#EAF3EE` | **Nuevo.** Fondo de las tarjetas de Sobre nosotros, esqueleto de las fotos de la galería y hover de la navbar. El velo de las fotos de la galería usa `ink` al 70 % (`bg-ink/70`) con texto `surface` |
| `warning` | `#8A5300` | **Nuevo.** Variante `warning` de los avisos, siempre con icono y texto (6,09:1 sobre `surface`) |

Reglas de uso y razones (A1 de [accesibilidad](guias/accesibilidad.md)): el verde de marca `#15B659` con `#F9FBFA` da 2,57:1 en los dos sentidos, así que no sirve para texto ni para texto sobre él; por eso el texto sobre `brand` es `ink` (6,82:1) y el verde para texto es `brand-deep` (5,23:1). Los ratios y los doce valores los fija `src/theme.test.js`, que calcula el contraste con la fórmula de WCAG. El resto de contrastes está en [DESIGN.md](../DESIGN.md#contraste-wcag-21-aa-recalculado-el-12112026).

**Deuda (B13, parcial):** las páginas públicas, los avisos y `LoginForm` ya usan solo tokens; quedan hexadecimales arbitrarios en `CategoryFilter`, `ErrorBoundary`, `Filter`, `ProtectedRoute`, `Switch`, `Table`, `Login` e `ImageCarrousel` (sin uso), `QrCode` (los colores del QR son deliberados) y el literal del velo de `ImageComponent` y el logotipo de `Header` (la «A» en verde de marca, como la «U» en `red-500` y la «M» en `blue-500`, exento de contraste). `SpeciesAttribute` y `NotFound` ya usan tokens y el bloque comentado de `Explore` se borró (13/11/2026). La clave `explore.vegetationCaroselTitle` sigue sin uso. Las tarjetas de `About` ya cumplen el contraste (`forest` sobre `sage-soft`).

### Animaciones

Framer Motion, con estos patrones repetidos:

| Patrón | Dónde | Configuración |
|---|---|---|
| Modal | `DialogAdvice`, `DialogSpecies` | Fondo con fundido y caja que cae con muelle (`stiffness 300`, `damping 25`) |
| Cambio de página | `Explore` | Deslizamiento horizontal ±300 px según la dirección |
| Plegar y desplegar | `CategoryFilter` | `height` 0 → `auto` y `clipPath` |

**Aparición por scroll y fundido de las privadas (12/11/2026):** CSS con `Reveal` ([05](05-componentes.md#reveal)), no Framer Motion. Valores únicos en `src/config/reveal.js`; `tailwind.config.js` los importa para los tokens `transitionDuration.reveal` (450 ms), `transitionTimingFunction.reveal` (`cubic-bezier(0.16, 1, 0.3, 1)`) y la animación `page-fade` (`opacity` de 0 a 1, **sin `fill-mode`**, con `motion-reduce:animate-none` en las cinco privadas). `index.css` define `.reveal-hidden` (opacidad 0 y `translateY(stack-md)`; es la única regla con `transform` y ninguna declara `will-change`), `.reveal-in` (la transición) y las reglas `@media (prefers-reduced-motion: reduce)` y `@media print` que dejan el contenido visible y sin `transform`. Un test de tema (`theme.test.js`, `reveal.test.js`) fija estos límites.

El velo de las fotos de la galería es una transición de CSS de 150 ms (`transition-opacity ease-out`) con `motion-reduce:transition-none motion-reduce:duration-0`. Los estados inactivos (B60) usan borde discontinuo `moss` y no `opacity`. El panel de filtros de `Sidebar` y el desplegable de `FileDropdown` ya no se animan (ahora son un diálogo sin deslizamiento y un `<select>` nativo). `ToastProvider` tampoco anima. `Home` y `About` ya no animan al entrar en pantalla ni usan `background-attachment: fixed` (parallax) y la flecha del hero ya no rebota. B19 está resuelto: `App` envuelve todo en `MotionConfig reducedMotion="user"`, `ScrollIndicator` usa `useReducedMotion()` y las transiciones de CSS llevan `motion-reduce:transition-none`. Medido el 12/11/2026 con la suite E2E (emulando movimiento reducido): ningún fondo fijo y la flecha del hero sin animación en las cinco rutas públicas.

### Diseño adaptable

Puntos de corte de Tailwind (`sm` 640, `md` 768, `lg` 1024 y `xl` 1280). La barra de navegación principal pasa a menú hamburguesa por debajo de `md` y la barra de gestión (`Sidebar`) es inferior bajo `md` y lateral desde `md` (bajo 360 px sus etiquetas pasan a 11 px y sin relleno horizontal mediante `min-[360px]:`; ver [05](05-componentes.md#sidebar)); `Explore` ajusta los elementos por página según el ancho. Las páginas públicas usan `.page-container` (márgenes 16, 24 y 32 px) y las privadas un solo contenedor `mx-auto w-full max-w-6xl` (`max-w-3xl` la de carga). El ancho común `max-w-6xl` de `.page-container` también lo usan la cabecera (con fondo y sombra a sangre) y el pie, y `NotFound`. `main` lleva `min-w-0`; ya no hay `px-40`, `w-[512px]`, `min-w-72` ni `max-w-screen` en ellas. La tabla ancha de `DataManagement` se desplaza dentro de su región. Medido con Playwright a 320, 375 y 1280 px (ver [08](08-guia-desarrollo.md#medición-con-playwright)); las públicas se comprueban a 390, 768, 1024 y 1440 px con la suite E2E local (ver [08](08-guia-desarrollo.md#suite-e2e-con-playwright-npm-run-e2e)); 768 y 1024 px en las privadas no se midieron **(por confirmar)**.
