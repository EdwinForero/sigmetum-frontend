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
| `footer` | Enlaces y copyright (`{{currentYear}}`) |
| `home` | Portada, contacto, correos (`emailsData` con formato `Nombre / email / ...`) y ubicación |
| `explore` | Explorador, `resultsInfo` (`{{currentResults}}`, `{{totalResults}}`), `dialogSpecies.attributes.*` |
| `gallery` | Título de la galería y `noDataFoundPlaceholder` (texto cuando no hay datos; la galería ya no lleva texto por defecto en el código) |
| `aboutUs` | Sobre nosotros |
| `filter` | Textos del filtro; `categoryFilter.searchLabel` («Buscar en {{category}}») es la etiqueta visible del buscador de cada categoría |
| `attributes` | **Nombres visibles de las columnas de datos.** La clave es el nombre exacto de la columna en el Excel (`"Provincia"`, `"Sector Biogeográfico"`...) |
| `login` | Acceso con Cognito: título, botones (`logInButton`, `continueButton`, `verifyButton`, `copyButton`, `retryButton`, `logOutButton`), etiquetas (`emailLabel`, `passwordLabel`, `newPasswordLabel`, `confirmPasswordLabel`, `codeLabel`, `secretLabel`, `qrLabel`, `showPassword`, `showNewPassword`, `showConfirmPassword`), títulos de los retos (`newPasswordTitle`, `mfaSetupTitle`, `totpTitle`), ayudas (`allRequired`, `passwordPolicy`, `mfaSetupHelp`, `mfaSetupAgain`, `loading`, `copied`, `copyFailed`) y errores (`requiredFields`, `credentialsError`, `sessionExpired`, `codeSessionLost`, `passwordPolicyError`, `passwordMismatch`, `passwordRejected`, `codeFormatError`, `codeError`, `startError`, `serviceUnavailable`). `qrLabel` es el nombre accesible del QR y las tres `show*` nombran los botones de mostrar contraseña (nombres distintos por campo, WCAG 2.4.6); `mfaSetupHelp` menciona el QR y termina en punto; `copyFailed` avisa de que los espacios no forman parte de la clave. Se retiró `otpUriLabel` (la dirección ya no se pinta), además de `callbackLoading` y `callbackError` (el Hosted UI ya no existe), los textos del acceso anterior, `unauthorizedLabel` y `tooManyAttemptsLabel`. `credentialsError` es el mismo texto para contraseña incorrecta, usuario inexistente y reinicio de contraseña (no revela si el usuario existe) |
| `uploadFiles` | Carga de archivos. **Primer plural del proyecto:** `fileUploadForm.uploadFilesButton_one` y `_other` («Subir {{count}} archivo» / «Subir {{count}} archivos»; i18next v23 usa los sufijos `_one` y `_other`), `progress` («Subiendo archivo {{current}} de {{total}}…»), `fileStatus.*` (pendiente, subiendo, subido, error y decisión), `filesListLabel`, `removeFile` y `noFilesSelected`. Se retiró el `uploadFilesButton` sin plural |
| `dataManagement` | Administrar datos. `fileSelectDropdwon` gana `emptyOption`, `loading`, `emptyState` y `emptyStateLink` (el nombre con la errata se conserva) y pierde `selectFileDropdownPlaceholder`, `provinceTitle`, `versionTitle`, `versionPlaceholder` y `noDataFoundPlaceholder`, que quedaron huérfanas; también `loadingVersionData`, `deleteVersionNamed` y `table.regionLabel` |
| `contentManagement` | Administrar contenido: `addTermButton`, `addImageButton`, `termsListLabel`, `imagesListLabel`, `deleteTerm` y `deleteImage` (con `{{name}}`), `loadingTerms`, `loadingImages`, `imageTitleRequired`, `imageFileRequired` y `noImageSelected`; `noTermsFoundPlaceholder` y `noImagesFoundPlaceholder` pasan a explicar qué hacer; `noLatinTermsPlaceholder` y `galleryManagementPlaceholder` son ahora las etiquetas visibles de sus campos |
| `dialogAdvice` | Mensajes de éxito, error y aviso (incluye `errorEmailRateLimit`, `errorEmailInvalid`, `errorDraftNotFound` y `adviceInvalidImageTitle`); `rowEmpty` (`{{rowIndex}}`) y `fieldsMissingMessage` (`{{filename}}`). Entran `confirmDeleteTitle`, `deleteButton` y `confirmDeleteVersion`, `confirmDeleteTerm` y `confirmDeleteImage` (con `{{name}}`); salen `successTitle`, `errorTitle` y `adviceNoImageData` |
| `cookies` | Política, banner y modal (con etiquetas `<a>` y `<strong>` para `<Trans>`) |
| `iconButton` | Nombres accesibles de los botones de solo icono: `menu`, `close`, `previousPage`, `nextPage`, `info` y `scrollDown` (un test comprueba el texto exacto en ambos idiomas). Se retiraron `add` y `delete`: los botones de añadir y de borrar llevan texto o un nombre con el elemento (`contentManagement.deleteTerm`, `deleteImage`, `removeFile`, `deleteVersionNamed`) |
| `skipLink` | «Saltar al contenido» / «Skip to content» |
| `privateNav` | `label` («Gestión» / «Management», nombre del `<nav>` de la barra privada) y las etiquetas `data`, `content`, `upload` y `filters` (Datos / Contenido / Cargar / Filtros) |
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

- **`scroll-padding` (WCAG 2.4.11, foco no tapado):** `html { scroll-padding-top: 5rem; scroll-padding-bottom: 20rem; }` en `@layer base`. 5 rem cubre la cabecera fija (4 rem) más margen; 20 rem cubre la barra inferior (72 px) más el banner de cookies compacto, **medido** con Playwright (228 px a 320x700 y 196 px a 375x667; un campo enfocado cerca del borde inferior no queda tapado). El banner usa tipografía compacta en móvil (`p-3 sm:p-4`, título `text-sm sm:text-base`, texto `text-xs sm:text-sm`). La clase `tracking-light` no existe en Tailwind y se retiró de las páginas. `main` lleva `tabIndex={-1}` sin `focus:outline-none`, así que el navegador puede pintar su contorno por defecto al llegar por el enlace de salto **(por confirmar)**.
- Acceso:

- `input::-ms-reveal { display: none; }` (en `@layer base`): Edge pinta su propio botón de revelar en `type="password"` y duplicaría el del formulario. Efecto en Edge y con gestores de contraseñas que ponen su icono a la derecha (pueden solaparse con el botón de mostrar) **(por confirmar a mano)**.
- `block` en `FIELD_CLASS` de `LoginForm`: un input en línea deja un hueco bajo la línea y el botón de mostrar (`bottom-0`) no cuadraría. Afecta igual a todos los campos del formulario.
- `w-48 max-w-full h-auto` en el QR (192 px, sin `h-48`: la altura sale del `viewBox`; a 320 px de ancho mide 192x192) y `forced-color-adjust-none` (Tailwind 3.4 lo genera; evita que los colores forzados inviertan el QR, **por confirmar a mano** con modo oscuro forzado y contraste alto).

### Tipografía (`tailwind.config.js` + `index.css`)

| Token | Fuente | Se aplica a |
|---|---|---|
| `font-primary` | Amaranth | `body`, `h1`-`h3`, `th`, `summary` |
| `font-secondary` | Sen | `p`, `button`, `a`, `label`, `span`, `input`, `td`, `li` |

Las fuentes se cargan desde Google Fonts en `index.html` (raíz del proyecto, no `public/`), junto con Material Symbols Outlined para los iconos, con dos `<link rel="stylesheet">` normales: ya no hay `preload` con `onload` en línea (M13 parcial: siguen viniendo de Google Fonts).

### Paleta

Los colores son **tokens de `theme.extend.colors`** de `tailwind.config.js` (`bg-brand`, `text-ink`, `border-brand-dark`...) y la altura de la barra inferior es `spacing.nav` (`h-nav`, `pb-nav`, `bottom-nav`, 4,5 rem). `gray-800`, `red-500`, `blue-500` y `white` de Tailwind siguen existiendo.

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

Reglas de uso y razones (A1 de [accesibilidad](guias/accesibilidad.md)): el verde de marca `#15B659` con `#F9FBFA` da 2,57:1 en los dos sentidos, así que no sirve para texto ni para texto sobre él; por eso el texto sobre `brand` es `ink` (6,82:1) y el verde para texto es `brand-deep` (5,23:1). Los ratios y los nueve valores los fija `src/theme.test.js`, que calcula el contraste con la fórmula de WCAG. El resto de contrastes está en [DESIGN.md](../DESIGN.md#contraste-wcag-21-aa-recalculado-el-11112026).

**Deuda (B13, parcial):** los colores de las clases de los componentes ya salen del tema, pero quedan hexadecimales arbitrarios en varios archivos (`CookieBanner`, `DialogSpecies`, `SpeciesCard`, `Pagination`, `ContactForm`, `LoginForm`...) y el logotipo de `Header` (la «A» en verde de marca, como la «U» en `red-500` y la «M» en `blue-500`, exento de contraste) y un bloque comentado de `Explore`. Las tarjetas de `About` (`surface` sobre `brand`) siguen con contraste insuficiente.

### Animaciones

Framer Motion, con estos patrones repetidos:

| Patrón | Dónde | Configuración |
|---|---|---|
| Aparición al hacer scroll | `Home`, `About` | `hidden {opacity 0, y 50}` → `visible`, `whileInView`, `viewport.once` |
| Modal | `DialogAdvice`, `DialogSpecies` | Fondo con fundido y caja que cae con muelle (`stiffness 300`, `damping 25`) |
| Cambio de página | `Explore` | Deslizamiento horizontal ±300 px según la dirección |
| Plegar y desplegar | `CategoryFilter` | `height` 0 → `auto` y `clipPath` |

El panel de filtros de `Sidebar` y el desplegable de `FileDropdown` ya no se animan (ahora son un diálogo sin deslizamiento y un `<select>` nativo). `ToastProvider` tampoco anima. No se respeta `prefers-reduced-motion` en el resto (B19 sigue abierto): Framer Motion lo permite con `useReducedMotion()` o `MotionConfig reducedMotion="user"`.

### Diseño adaptable

Puntos de corte de Tailwind (`sm` 640, `md` 768, `lg` 1024 y `xl` 1280). La barra de navegación principal pasa a menú hamburguesa por debajo de `md` y la barra de gestión (`Sidebar`) es inferior bajo `md` y lateral desde `md`; `Explore` ajusta los elementos por página según el ancho. Las páginas privadas usan un solo contenedor `mx-auto w-full max-w-6xl` (`max-w-3xl` la de carga) y `main` lleva `min-w-0`; ya no hay `px-40`, `w-[512px]`, `min-w-72` ni `max-w-screen` en ellas. La tabla ancha de `DataManagement` se desplaza dentro de su región. Medido con Playwright a 320, 375 y 1280 px (ver [08](08-guia-desarrollo.md#medición-con-playwright)); 768 y 1024 px no se midieron **(por confirmar)**.
