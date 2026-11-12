# 05. Componentes

Todos están en `src/components/`. Son componentes funcionales (salvo `ErrorBoundary`) con estilos Tailwind en línea.

Índice por grupo:

- **Estructura:** [Header](#header) · [Navbar](#navbar) · [LanguageSwitcher](#languageswitcher) · [Footer](#footer) · [Sidebar](#sidebar) · [ErrorBoundary](#errorboundary) · [ProtectedRoute](#protectedroute) · [CookieBanner](#cookiebanner)
- **Explorador y datos:** [Filter](#filter) · [CategoryFilter](#categoryfilter) · [FilterSearchBar](#filtersearchbar) · [SpeciesCard](#speciescard) · [DialogSpecies](#dialogspecies) · [SpeciesAttribute](#speciesattribute) · [Table](#table) · [Pagination](#pagination) · [FileDropdown](#filedropdown)
- **Administración:** [FileUpload](#fileupload) · [TermsManager](#termsmanager) · [ImageGalleryManager](#imagegallerymanager) · [LoginForm](#loginform) · [QrCode](#qrcode)
- **Formularios y contacto:** [ContactForm](#contactform) · [EmailContactGrid](#emailcontactgrid) · [TextInput](#textinput)
- **Elementos básicos:** [ButtonPrincipal](#buttonprincipal) · [ButtonAlternative](#buttonalternative) · [DialogAdvice](#dialogadvice) · [ToastProvider](#toastprovider) · [InlineError](#inlineerror) · [InfoButton](#infobutton) · [LoadSpinner](#loadspinner) · [Switch](#switch) · [ScrollIndicator](#scrollindicator) · [ImageComponent](#imagecomponent)
- **Sin uso:** [ImageCarrousel](#imagecarrousel) · [UploadButton](#uploadbutton)

---

## Estructura

### Header
Barra superior fija (`h-16`, `z-50`, borde inferior `brand`). Contiene el logo de S3 con enlace a `/` (el enlace se llama «SIGMETUM-A» y la imagen lleva `alt=""`; `focus-ring`, objetivo `min-h-11`), el texto "SIGMETUM-A" con letras de colores (el logotipo está exento de contraste), `LanguageSwitcher` y `Navbar`. El logo es `h-8` bajo `sm` y `h-12` desde `sm`; la cabecera no desborda hasta unos 305 px de ancho.
Sin efectos: no toca el favicon. Este sale ya correcto del HTML compilado (plugin de `vite.config.js`, ver [06](06-utilidades-hooks-config.md#favicon-viteconfigjs-y-faviconhtml)); `ASSETS.LOGO` y `assetUrl` solo se usan aquí para el `<img>` del logo.

### Navbar
Menú principal, un `<nav aria-label>` (`navbar.label`). `menuItems`: Inicio (`/`), Explorar (`/explorar`), Galería (`/galeria`) y Sobre nosotros (`/sobre-nosotros`), como `NavLink end` (ponen `aria-current="page"`).
- Escritorio (`md+`): lista horizontal; la ruta activa aparece con `bg-brand text-ink`. Los enlaces llevan `whitespace-nowrap` y `px-2` (`lg:px-6`) para que «About us» no se parta en dos líneas a 768 px; medido en local con API simulada (11/11/2026, en inglés): «About us» mide 62 px de alto igual que «Home» (una línea) y `header.scrollWidth <= clientWidth` a 1440 y 768 px. En español **no se midió (por confirmar)**: si la cabecera desbordara a 768 px haría falta `md:text-sm lg:text-base`.
- Móvil: botón con icono `Menu` (`ButtonPrincipal` con `ariaLabel` `iconButton.menu`, `aria-expanded` y `aria-controls`) que abre un panel (`max-w-[calc(100vw-1rem)]`, enlaces de `min-h-11`). Escape lo cierra y devuelve el foco al botón.

| Estado / función | Descripción |
|---|---|
| `showDropdown` | Desplegable móvil abierto |
| `toggleDropdown()`, `closeDropdown()` | Abrir o cerrar |
| Efecto | Cierra al hacer clic fuera (`mousedown` en `document`) y con Escape, solo mientras está abierto |

### LanguageSwitcher
Selector de idioma: un `<select>` nativo (`focus-ring`, `h-11`) con una `<label className="sr-only">` (`language.label`) y dos `<option>` («Español» con `lang="es"` y «English» con `lang="en"`). Ya no usa `ButtonAlternative` ni el modo desplegable.

| Estado / función | Descripción |
|---|---|
| Valor | `i18n.resolvedLanguage` (no `i18n.language`, que puede valer `es-ES`, `en-US` o `fr`) |
| Cambio | Llama a `i18n.changeLanguage('es' \| 'en')`. El detector lo guarda en `localStorage` |

### Footer
El único `<footer>` de la aplicación (`App` ya no pinta otro): enlaces a Inicio, Explorar, Sobre nosotros y Cookies (`focus-ring`, `min-h-11`), el copyright con el año actual (`footer.copyright` con `{currentYear}`) y, en la misma fila (columna bajo `sm`), «V 1.0.0» como `<summary>` de un `<details>` que despliega el mensaje `ee` (corrige el solapamiento a 375 px, B32).

### Sidebar
Barra de gestión (normaliza la ruta quitando la barra final; desde `md` ocupa toda la altura con `bg-surface`): un `<nav aria-label>` (`privateNav.label`, «Gestión»). Bajo `md` es una barra inferior fija (`h-nav`, `z-40`) y desde `md` una columna fija a la izquierda (`top-16 w-28`). Cada ítem muestra icono (`aria-hidden`) y etiqueta visible; el ítem activo lleva `bg-brand font-bold` y un borde `ink` (color, peso y forma), nunca `surface` sobre `brand`.

| Prop | Tipo | Descripción |
|---|---|---|
| `menuOptions` | `Array<{ id, name, icon, link?, component? }>` | Opciones definidas en `App` (`name` ya traducido con `privateNav.*`) |
| `exploreData` | `Array \| null` | Si es `null` en `/explorar`, se oculta el filtro |
| `showLogout` | `boolean` | `true` en las rutas protegidas: añade el ítem «Cerrar sesión» (`login.logOutButton`) |

| Estado / función | Descripción |
|---|---|
| `exclusions` | Mapa ruta → ids ocultos. Por ejemplo, en `/explorar` solo se ve `filter` |
| `filteredMenuOptions` | Opciones visibles en la ruta actual |
| `activeComponent`, `isOpen` | Qué `component` se muestra en el panel y si está abierto |
| `loggingOut` | Desactiva «Cerrar sesión» mientras dura `api.logout()` |
| `NavItem` | Componente local del contenido de un ítem (icono y etiqueta) |

- Los destinos (`Datos`, `Contenido`, `Cargar`) son `NavLink end` con `aria-current="page"`; ya no hay un `<button>` dentro de un enlace (B27 resuelto). «Filtros» es un `<button aria-expanded aria-controls>` y «Cerrar sesión» un `<button>` que llama a `api.logout()` una vez.
- **Panel de filtros** (B21 resuelto en `Sidebar`): siempre montado (cerrado, con el atributo `hidden`; así el `Filter` no pierde su selección); abierto es `role="dialog" aria-modal="true"` con `aria-labelledby` hacia el `<h2>` de `Filter` (`titleId` de la opción activa; `aria-label` `privateNav.filters` solo de respaldo si la opción no trae `titleId`) con `useDialogFocus` (foco al abrir, trampa de Tab, Escape y devolución del foco a «Filtros»). Es `fixed inset-y-0 left-0 z-[60] w-full max-w-sm`, hermano de la barra (no hijo), igual que su fondo oscuro `z-[60]`: cubre cabecera y barra. Sin animación de deslizamiento. Mientras está abierto, un efecto pone `document.body.style.overflow = 'hidden'` y restaura el valor anterior al cerrar o desmontar; el contenedor interior ya no lleva `min-h-full` y sí `overscroll-contain`, de modo que el panel vacío no debería tener scroll propio (medido en local con API simulada, 11/11/2026: `scrollHeight` igual a `clientHeight`, 900/900 y 844/844 px; `aria-labelledby` apunta al `<h2>` «Filters»; `overflow: hidden` en el `body` abierto y `visible` al cerrar; el ancho del `header` no cambia al abrir, 1424,6 px antes y después, y `clientWidth` pasa de 1425 a 1440 al desaparecer la barra, compensado por `scrollbar-gutter: stable`); con barras de desplazamiento clásicas **(por confirmar)**. Su botón de cerrar es un `ButtonPrincipal icon="close"` con `iconButton.close`. Solo se muestra el componente de la opción activa.
- **Posición desde `md`:** la `nav` es `sticky md:top-16` con alto `md:h-[calc(100dvh-4rem)]`, `md:self-start` y `md:shrink-0` (antes `fixed` con `md:bottom-0 md:h-auto`), hija de la fila flex de `App`: no debería dejar franja sin barra ni pie bajo ella (medido en local con API simulada, 11/11/2026: a 1440 y 768 px `position: sticky`, `top` 64 y ancho 112 px, y el pie ocupa todo el ancho —`left` 0— sin franja blanca; a 390 px barra `fixed` inferior, `top` 772 y `bottom` 844, sin scroll horizontal; a 1024 px y con una página larga tras desplazar, **por confirmar**). Bajo `md` sigue siendo la barra inferior `fixed`. La opción `dataManagementFilter` ya no existe (`/administrar-datos` no tiene botón «Filtros»).
- Objetivos táctiles: la barra mide 72 px de alto; los ítems cumplen 44 px.

### ErrorBoundary
Componente de clase. `getDerivedStateFromError` activa `hasError`, `componentDidCatch` escribe el error en consola y el render muestra "Algo salió mal" con un botón para recargar. Envuelve toda la aplicación en `index.js`.

### ProtectedRoute
Guardia de las rutas privadas.

| Prop | Descripción |
|---|---|
| `element` | Página que se muestra si hay sesión válida |
| `onStatusChange(status)` | Opcional. Se llama en un efecto con `[status]` (también al montar, con `'checking'`); `App` la usa para saber cuándo mostrar la barra de gestión |

| Estado / función | Descripción |
|---|---|
| `status` | `'checking'` (no pinta nada en el primer intento; ya no hay `LoadSpinner`), `'ok'`, `'denied'` (redirige a `/login`) o `'unavailable'` |
| `checkAuth()` | Sin `getAccessToken()` → `denied`. Con token → `api.getAuth('/auth')` (con los reintentos del `503` de `api.js`): si responde, `ok`; solo un `401` (`error.type === 'http'`, tras la renovación de `api.js`) da `denied`; cualquier otro error (red, `403`, `5xx`, `503` agotado, `auth_unavailable` de la renovación) da `unavailable` sin borrar tokens ni redirigir. Ignora la respuesta si el componente se desmonta. Bajo `React.StrictMode` (desarrollo) el efecto corre dos veces y hace dos `GET /auth` |
| `checking` tras «Reintentar» | Devuelve un fragmento con un `<p role="status" className="sr-only">` con `login.loading` (el mismo nodo que existía, vacío, en `unavailable`, para que el cambio de texto se anuncie; A12) y sin alerta. «Reintentar» lleva antes el foco a `main#contenido` (`tabIndex={-1}` en `App`) para que no caiga en `body` al desmontarse el botón |
| `unavailable` | (conserva su botón de cierre de sesión) `<div role="alert">` con un `<h1>` (`login.title`, reutilizado **(por confirmar)** si es el título deseado), el texto `login.serviceUnavailable` un botón `login.retryButton` que repite `GET /auth`, y un botón `login.logOutButton` que cierra la sesión (`api.logout()`, deshabilitado mientras dura la revocación), para no dejar al usuario sin salida si el servicio no se recupera |
| `denied` | `<Navigate to="/login" replace />`: no deja la ruta protegida en el historial |
| `ok` | Devuelve solo el `element`: el botón de cierre de sesión ya no está aquí, sino como ítem «Cerrar sesión» de la barra de gestión (`Sidebar` con `showLogout`) |

Ya no decodifica el JWT ni comprueba `exp` (se retiraron `jwt-decode`, `isTokenExpired` y el diálogo `tokenExpiration.*`). No toca el almacenamiento directamente: usa `getAccessToken` y `api.logout` (que borra la sesión, revoca el token de refresco y va a `/`), aunque `npm run quality` sigue permitiéndole `localStorage`.

### CookieBanner
Banner de consentimiento y modal de configuración. Prop `aboveBottomBar` (por defecto `false`): el banner es una `<section aria-label>` **`sticky`** `z-40` al final de la raíz, con `bottom-0` o, con la barra de gestión, `bottom-nav md:bottom-0`; ocupa su sitio en el flujo (no tapa contenido ni pie) y libera el espacio al aceptar. Compacto en móvil (`p-3 sm:p-4`, `gap-2`, título `text-sm sm:text-base`, texto `text-xs sm:text-sm`, botones en una fila; 228 px a 320x700). El modal de configuración queda fuera de esa sección. B21 sigue abierto para el banner (sin `role="dialog"`).

| Estado / función | Descripción |
|---|---|
| `isVisible` | Se muestra si `document.cookie` no contiene `cookieConsent=accepted` |
| `isModalOpen` | Modal de configuración abierto |
| `cookiePreferences` | `{ all, advertising, advertisingTracking, functionality, personalization, security }` |
| `setCookie(name, value)` | Helper local, no exportado. Escribe la cookie con `path=/`, `max-age` de un año y `SameSite=Lax`, más `Secure` si `window.location.protocol` es `https:` (se lee en cada llamada). El valor no se codifica |
| `handleAccept()` | Guarda `cookieConsent=accepted` y `cookiePreferences=<JSON>` con `setCookie` |
| `handleAcceptAll()` | Igual, con todas las categorías a `true` |
| `handlePreferenceChange(key)` | Alterna una categoría. `all` las alterna todas y se recalcula si todas están activas |
| `handleModalToggle()` | Abre o cierra el modal |

Las preferencias se guardan, pero ningún código las consulta.

---

## Explorador y datos

### Filter
Filtro facetado: genera una categoría por cada columna de los datos.

| Prop | Tipo | Descripción |
|---|---|---|
| `data` | `Array<Registro>` | Registros sin filtrar |
| `onFilterChange(filtrados)` | función | Recibe los registros que cumplen todos los filtros |
| `onSpeciesSelect(set)` | función | Recibe el `Set` elegido en `Especies Características` |
| `titleId` | `string` | `id` de su `<h2>`: el panel de filtros de `Sidebar` lo usa en `aria-labelledby` |

| Estado | Descripción |
|---|---|
| `categories` | `{ columna: valores[] }` con todos los valores posibles |
| `filteredCategories` | Valores disponibles en cada categoría según los demás filtros (faceta dependiente) |
| `selectedFilters` | `{ columna: Set<valor> }` |
| `expandedCategory` | Categoría desplegada (solo una a la vez) |
| `blockedCategories` | `['image']`, excluida del filtro |

| Función / efecto | Descripción |
|---|---|
| Efecto sobre `data` | Recorre los registros y construye `categories`. Los valores array se añaden como un único elemento (ver nota) |
| `handleFilterChange(category, item)` | Alterna `item` en el `Set` de la categoría. `'clear'` elimina la categoría |
| Efecto sobre `selectedFilters` | 1) Filtra `data` con lógica **O dentro de una categoría** e **Y entre categorías**. Si el valor del registro es un array, basta con que coincida uno. 2) Notifica a `onSpeciesSelect` y `onFilterChange`. 3) Recalcula `filteredCategories`: para cada categoría aplica todos los filtros menos el suyo y reúne los valores que quedan, desplegando los arrays |
| `handleClearAllFilters()` | Quita todos los filtros y devuelve `data` completo |
| `handleExpand(category)` | Abre o cierra una categoría |

Nota: en `categories` los arrays se guardan tal cual y en `filteredCategories` se despliegan. Como la vista usa `filteredCategories`, el resultado visible es correcto.

### CategoryFilter
Una categoría del filtro: cabecera plegable, botón "Limpiar", buscador (con etiqueta visible `filter.categoryFilter.searchLabel`, «Buscar en {{category}}») y lista de casillas (checkbox `brand-dark`).

| Prop | Descripción |
|---|---|
| `category` | Nombre de la columna. Se traduce con `attributes.<columna>` y, si no existe, se muestra tal cual |
| `items` | Valores disponibles |
| `blocked` | Si es `true`, no se despliega |
| `onChange(category, item)` | Alterna un valor (`'clear'` para limpiar) |
| `selected` | `Set` de valores marcados |
| `isExpanded`, `onExpand` | Control del despliegue |

Las ligaduras de los chevrons llevan `aria-hidden="true"` (no entran en el nombre del botón). **Estado:** `searchText`. **Cálculo:** `filteredItems = SortItemsList(items que contienen searchText)`.

### FilterSearchBar
Campo de búsqueda con icono de lupa (`aria-hidden`, `pl-10`).
Props: `label` (obligatoria y visible, asociada con `htmlFor`), `id` (por defecto de `useId`: ya no hay `id="buscar"` repetido), `placeholderText`, `value`, `onChange`, `invalid`, `describedBy` e `inputRef`. Es un campo controlado: muestra siempre `value`. `h-12`, borde `brand-dark`, placeholder `moss` y `focus-ring-inset` (anillo hacia dentro por el `overflow-hidden` del contenedor). B3 resuelto aquí.

### SpeciesCard
Tarjeta de una especie en la cuadrícula del explorador.

| Prop | Descripción |
|---|---|
| `species` | Objeto con `Especies Características` = nombre de la especie |
| `data` | Conjunto completo (se pasa al diálogo) |
| `noItalicTerms` | Términos que no van en cursiva |

| Estado / función | Descripción |
|---|---|
| `isDialogOpen`, `openDialog()`, `closeDialog()` | Control del diálogo de detalle |
| `highlightTerms(text, terms)` | Utilidad compartida (`utilities/highlightTerms.js`): divide el nombre en fragmentos `{ text, isItalic }`. Los términos de `terms` (por ejemplo `subsp.`, `var.`) van en redonda y el resto en cursiva, como exige la nomenclatura botánica. Escapa los caracteres especiales de cada término antes de construir la expresión regular |

### DialogSpecies
Modal de detalle de una especie.

| Cálculo | Descripción |
|---|---|
| `filteredSpecies` | Registros de `data` cuyo `Especies Características` coincide exactamente con esta especie: igualdad si el valor es una cadena, pertenencia si es un array (helper local `contieneEspecie`; sin normalizar mayúsculas ni espacios) |
| `uniqueAttributes` | Por cada atributo (provincia, municipio, altitud media, sector biogeográfico, piso bioclimático, ombrotipo, naturaleza del sustrato, tipo de serie, serie de vegetación y vegetación potencial), los valores únicos ordenados con `SortItemsList` y unidos por comas |
| `formattedQuery` | Nombre codificado para el enlace `https://www.ipni.org/?q=...` |
| `highlightTerms` | La misma utilidad compartida que usa `SpeciesCard` |

Muestra el título con cursivas, un `SpeciesAttribute` por atributo, el botón "Cerrar" y el enlace "Leer más" a IPNI (con `open_in_new` en `aria-hidden`, de modo que el nombre del enlace es solo el texto). Se cierra al pulsar fuera.

**Accesibilidad (A6):** la caja interior es `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (el `div` que contiene los `h2` del título compuesto) y `tabIndex={-1}`. Llama a `useDialogFocus(isOpen && useIsPresent(), onClose)` antes del `if (!isOpen) return null`: el foco entra en la caja al abrir, Tab queda atrapado, Escape llama a `onClose` y el foco vuelve a quien abrió. Con la caja ya enfocada, el primer elemento enfocable es el primer `summary` de atributos, no «Cerrar».

### SpeciesAttribute
Bloque `<details>` abierto con título y lista. Si `description` es una cadena, la divide por comas y pinta un párrafo en cursiva por valor.

### Table
Tabla paginada genérica.
Props: `data` (`Array<Registro>`), `rowsPerPage` (5 por defecto) y `label` (nombre accesible). La tabla va dentro de `<div role="region" aria-label={label} tabIndex={0} className="focus-ring overflow-x-auto">` (la paginación queda fuera, así que la tabla ancha se desplaza dentro de su región sin ensanchar la página), con un `<caption className="sr-only">` y `th scope="col"` con `text-ink` sobre `brand`.
Las columnas son la unión de las claves de todos los registros, en orden de primera aparición (no muta `data`), y se traducen con `attributes.<col>`. Los valores array se muestran uno por línea. **Estado:** `currentPage`.

### Pagination
Botones anterior/siguiente con el texto "Página X de Y".
Props: `currentPage`, `totalPages` y `onPageChange('prev' | 'next')`. Desactiva los extremos. Los dos botones de icono llevan `ariaLabel` (`iconButton.previousPage` y `iconButton.nextPage`).

### FileDropdown
Selector de la versión de datos para "Administrar datos": un `<select>` nativo (B22 resuelto: se alcanza con Tab y se maneja con el teclado del navegador). Se crea con `forwardRef`.

| Prop | Descripción |
|---|---|
| `id` | `id` del `<select>`, para la etiqueta visible que pinta la página (`htmlFor`) |
| `disabled` | Desactiva el `<select>`; `DataManagement` lo activa con `busyAction !== null` |
| `onLoad(bool)` | Controla el estado de carga del padre |
| `onFileSelect(jsonData, key, versionLabel)` | Entrega los registros, la `key` y el nombre legible (`${provincia} ${FormatFileName(name)}`); con fallo o con la opción vacía llama a `onFileSelect([], null, null)` |
| `selectedFile` | `key` seleccionada |

| Estado / función | Descripción |
|---|---|
| `files` | `{ provincia: [{ key, name }] }` |
| `listStatus`, `pendingKey`, `failedKey` | `'loading'` / `'ready'` / `'error'`, versión que se está pidiendo y versión que falló. Valor del `<select>`: `pendingKey ?? selectedFile ?? ''` |
| `fetchFiles()` | `GET /list-files`. **Se expone al padre** con `useImperativeHandle` |
| `loadVersion(key)` | `GET /get-data/<key>`. Se descartan las respuestas cuya clave ya no es la actual (las flechas sobre un `<select>` cerrado disparan `change` por opción en Windows) |

Marcado: opción vacía (`emptyOption`), un `<optgroup label={provincia}>` por provincia y una `<option>` por versión, cuyo texto incluye la provincia («Almería 10/11/2026 · V1»; un `<select>` cerrado no muestra la etiqueta del grupo). Las versiones salen en el orden del backend. Un `LoadSpinner inline` queda siempre montado; los errores se muestran con `InlineError` y un `ButtonAlternative` «Reintentar» (repite la misma clave); la lista vacía muestra `emptyState` («Todavía no se ha subido ningún archivo de datos, así que no hay versiones para elegir.»: explica la causa, distinta del error de carga) y un `Link` estático a `/cargar-archivos`. El `<select>` lleva `aria-describedby` al texto de vacío, al error de la lista y/o al de la versión (`failedKey`); deshabilitado se pinta con `disabled:border-moss disabled:text-moss disabled:opacity-100 disabled:cursor-not-allowed` (`moss` sobre `surface`, 6,27:1 según A1) en lugar de `opacity-50`; medido en local con API simulada (11/11/2026): `opacity` 1, color `rgb(75, 100, 74)`, con `aria-describedby` al mensaje «No data files have been uploaded yet…» y sin tabla.

---

## Administración

### FileUpload
Formulario de carga múltiple de Excel (solo `.xlsx`, por el botón y por arrastre). Ya no recibe props: no hay `onLoad`; el progreso, los errores y los éxitos se ven en la propia tarjeta y en `ToastProvider`.

| Estado / función | Descripción |
|---|---|
| `entries` | `[{ id, file, status, errorKey }]`, con `status` `'pending'`, `'uploading'`, `'decision'`, `'done'` o `'error'`. Solo se suben las entradas que no están en `done` |
| `uploading`, `progress`, `cardError` | Subida en curso, `{ completed, total }` y error general de la tarjeta (`InlineError`) |
| `normalizeFileName(name)` | Quita acentos (NFD) y cualquier carácter que no sea `[a-zA-Z0-9-_]` del nombre, conservando la extensión |
| `addFiles(fileList)` | Vía común del `input` y del `drop`: descarta lo que no acabe en `.xlsx` (sin distinguir mayúsculas; si descarta alguno, `cardError = dropRejected`), evita duplicados (mismo nombre y tamaño) y anuncia lo añadido en un `<p role="status" className="sr-only">` siempre montado (`filesAdded_one`/`_other`). Un `drop` sin archivos (texto o un enlace) no llama a `addFiles`, así que no borra el error ni el anuncio vigentes. El filtro es solo de cliente y por nombre: el servidor sigue validando |
| `handleFileSelect(e)` | Llama a `addFiles(e.target.files)` y vacía el `<input>` para poder volver a elegir el mismo |
| `handleDragEnter/Over/Leave`, `handleDrop` | Zona de arrastre (`data-testid="dropZone"`): `dragDepth` (ref) cuenta `dragenter`/`dragleave` entre hijos; mientras `uploading` los `drop` se ignoran. Al arrastrar, el borde pasa de discontinuo a continuo y el texto de `dropZoneHint` a `dropZoneActive` (no solo el color); el `font-bold` de arrastre va solo en el `<p>` de la pista, no en la zona entera. Medido en local con API simulada (11/11/2026, eventos simulados): `dragenter` pasa el borde de `dashed` a `solid` y el texto a «Drop the files to add them.»; soltar `bueno.xlsx` y `malo.csv` da «1 file added to the list.» (`role="status"`) y la alerta «Only Excel files (.xlsx) are accepted. The others were discarded.»; con un arrastre real de archivos del sistema, **(por confirmar)**. Es un atajo: la vía accesible por teclado sigue siendo «Seleccionar archivos», con el mismo orden de Tab. Soltar un archivo fuera de la zona hace que el navegador lo abra (B49) |
| `handleRemoveFile(i)` | Quita un archivo de la cola |
| `handleSubmit()` | Sube los archivos **uno a uno** con `POST /upload`. Si hay campos vacíos (400 con `emptyFields`), pregunta al usuario y confirma con `POST /upload/confirm`. Un `404` al confirmar muestra `dialogAdvice.errorDraftNotFound` y detiene el bucle (se interpreta solo por el estado, sin leer el texto). Cualquier otro error detiene el bucle y lo deja en la lista como `error`. Si todos suben bien, avisa del éxito (`role="status"`) y vacía la cola |

**Interfaz:** zona de arrastre con el icono `upload_file` (`aria-hidden`) y el texto de ayuda; lista `<ul aria-label>` con el estado de cada archivo (`uploadFiles.fileStatus.*`) y una papelera por fila (nombre `removeFile`); barra `role="progressbar"` con `aria-valuemin`, `aria-valuemax`, `aria-valuenow` y `aria-valuetext` («Subiendo archivo n de N…») y un `LoadSpinner inline` siempre montado; botón «Subir N archivos» (plural de i18next, `uploadFilesButton_one`/`_other`) con `loading`; mientras se sube, quitar o elegir archivos está desactivado; los inputs de archivo ocultos llevan `aria-hidden` y `tabIndex={-1}`. Los errores de subida y de borrador no encontrado van en línea (`InlineError`); `DialogAdvice` queda solo para la decisión sobre campos vacíos. **Cambio de comportamiento deliberado:** tras un `500` al confirmar o un fallo de red, la lista **conserva** el estado de error (antes se vaciaba), de modo que al reintentar solo se suben los archivos que no están en `done`; con dos o más errores solo se muestra el primero (la cola se corta en el primero). Peticiones, cabeceras y cuerpos no cambian.

Si el usuario cancela o cierra el diálogo de confirmación, se envía `confirmed: false`, se detiene la cola y no se muestra el éxito. Se comprueba la respuesta de cancelar: `404` muestra `errorDraftNotFound` y otro fallo `errorUploadMessage`; en ambos no se vacía la lista (se puede reintentar). Usa `api.postFormAuth` y `api.postAuth`: no lee el token y un `401` (en `/upload`, al confirmar o al cancelar) redirige a `/login`, cosa que hace `api.js`; el componente solo lo reconoce para no abrir el diálogo de error ni vaciar la cola. Un fallo reintentable de Cognito al renovar (`type: 'auth_unavailable'`, `status: 503`; la sesión se conserva) no es un `401`: muestra el error en línea (`errorUploadMessage`) en lugar de cortar en silencio. El `404` de `/upload/confirm` se interpreta por estado: cualquier `404` en esa ruta se muestra como "el borrador ya no existe". Ver el diagrama en [01-arquitectura.md](01-arquitectura.md#flujo-de-subida-de-datos-api-v2).

### TermsManager
Gestión de términos que no se escriben en cursiva. `<section aria-labelledby>` con un `<h2>` (`.focus-heading`, `tabIndex={-1}`) e `InfoButton`.

| Estado / función | Descripción |
|---|---|
| `term`, `terms`, `isLoadingList`, `busy`, `isError` | Campo de texto, lista, carga de la lista, operación en curso y error de carga (con «Reintentar») |
| `fieldError` | `'empty'` o `'duplicate'`: se muestra con `InlineError`, `aria-invalid` y `aria-describedby`; el foco va al campo solo cuando falla la validación; se limpia al escribir |
| `fetchTerms()` | `GET /list-terms` |
| `handleAddTerm()` | Comprueba que no esté vacío ni repetido (sin distinguir mayúsculas), hace `POST /upload-term`, avisa con `useToast` y recarga. Botón «Añadir término» (con `loading`) |
| `handleDeleteTerm(term)` | Pide confirmación (`DialogAdvice` con el nombre y «Eliminar»), después `DELETE /delete-term` y recarga |
| Lista | `<ul aria-label>` (`termsListLabel`) ordenada sobre una copia (`[...terms].sort(...)`, B24 resuelto), `key={item.term}`, filas `min-h-12` con papelera de 48×48 y nombre `deleteTerm`; texto de vacío que explica qué hacer; `LoadSpinner inline` siempre montado |

El campo lleva etiqueta visible (`noLatinTermsPlaceholder`, sin placeholder). El nombre de cada fila lleva las mismas clases que en `ImageGalleryManager` (`min-w-0 break-words text-base font-normal`), y su `InfoButton` lleva `topic`.

### ImageGalleryManager
Gestión de las imágenes de la galería. Cada fila lleva una miniatura (`Thumbnail` local: `img` de 48×48 con `src` la URL prefirmada de `GET /list-images`, `alt=""`, `loading="lazy"`, `object-cover`; con `onError` —la URL caduca a la hora— se oculta el `img` y queda una caja de 48 px con borde `sage`. Antes de pedir la imagen, `isSafeImageUrl` (local) analiza la URL con `new URL` dentro de un `try/catch` y solo acepta `https:` (y `http:` únicamente para `localhost` y `127.0.0.1`); si no es válida muestra la misma caja vacía **sin pedir la imagen** (seguridad.md S7); `key={image.url}` reinicia el fallo con una URL nueva). Mismo patrón que `TermsManager` (`<h2>`, `InfoButton`, avisos con `useToast`, lista `<ul aria-label>` con `imagesListLabel`, borrar con confirmación, papelera con nombre `deleteImage`).

| Estado / función | Descripción |
|---|---|
| `imageTitle`, `imageFile`, `images` | Título, archivo elegido y lista actual |
| `fieldError` | `{ field: 'title' \| 'file', key }`, comprobado en este orden: falta el título (`imageTitleRequired`, tras `trim()`: un título de solo espacios ya no pasa), título no válido (`adviceInvalidImageTitle`) y falta la imagen (`imageFileRequired`, con foco y `aria-describedby` en «Seleccionar imagen»). Error en línea con `InlineError`; sin petición |
| `fetchImageUrls()` | `GET /list-images` |
| `handleFileChange(e)` | Guarda el archivo elegido (JPEG, PNG, GIF o WebP); se muestra su nombre o `noImageSelected` |
| `handleImageUpload()` | Rechaza un título con `/`, `\`, `..`, caracteres de control o `, ' : & # ? % "` (sin tope de longitud), envía `POST /upload-image` (multipart `file` + `title`) y recarga. Botón «Añadir imagen» |
| `deleteImage(fileName)` | Tras confirmar, `DELETE /delete-image { imageKey: fileName }` y recarga |

### LoginForm
Formulario propio de acceso con SRP contra Cognito. Solo pinta: la lógica es de [`useCognitoLogin`](06-utilidades-hooks-config.md#acceso-con-cognito-srchooksusecognitologinjs) y nunca toca tokens (los guarda `api`). Si el componente se desmonta durante `signIn`, `api` guarda igualmente los tokens y la persona queda con sesión abierta sin navegar (B28 en [09](09-estado-actual-y-deuda-tecnica.md)). Al autenticarse navega a `/cargar-archivos` con `replace`.

| Estado / función | Descripción |
|---|---|
| `email`, `password`, `newPassword`, `confirmation`, `code` | Campos controlados. La contraseña, la nueva, la confirmación y el código se vacían al terminar cada petición (en un `finally`) |
| `handleSubmit(event)` | `event.preventDefault()` en la primera línea y, según el paso, `signIn`, `submitNewPassword`, `confirmMfaSetup` o `submitTotp` del hook |
| `shown` / `PasswordField` | `shown` es un objeto por id de campo. Los tres campos de contraseña (`password`, `newPassword`, `confirmation`) usan el componente local `PasswordField`: la misma `<label>` anidada que `Field`, con un botón de mostrar u ocultar **fuera de la `<label>`**, `type="button"`, `aria-pressed`, `aria-label` fijo y distinto por campo (`login.showPassword`, `login.showNewPassword`, `login.showConfirmPassword`; el nombre no cambia al alternar y no contiene la contraseña), icono `visibility` o `visibility_off` en `aria-hidden`, de 48x48 px, `focus-ring`, `overflow-hidden` y color `moss`. El `input` es el mismo elemento (solo cambia `type`), así que conserva valor, selección y `id`; lleva `pr-12`, `spellCheck={false}`, `autoCapitalize="none"` y `autoCorrect="off"` siempre (con el campo en texto el corrector del navegador podría enviar la contraseña a sus servidores). Tras el clic, el foco **queda en el botón** (`event.currentTarget.focus()`, por Safari y Firefox en macOS). Se oculta todo (`setShown({})`) al enviar y en los `finally`, de modo que al cambiar de paso o volver a credenciales los campos nacen ocultos. No hay temporizador ni `onBlur`. El código TOTP no tiene botón |
| `copySecret()` | Copia el secreto con `navigator.clipboard.writeText`; el resultado se anuncia en el `role="status"` (`login.copied` o `login.copyFailed`) |
| Foco | Al entrar en un reto, al `<h2>` del paso (`tabIndex={-1}` y `focus-heading`: subrayado en lugar de contorno); al volver a credenciales, al correo; tras un error, a un campo: en credenciales, el primer campo vacío (el valor se lee del DOM porque el estado de la contraseña ya se vació), en los demás pasos el primero. En `mfaSetup` con reintento no hay campo ni `ref` (`ButtonPrincipal` no expone `ref`): el foco no va a ningún sitio (B30 en [09](09-estado-actual-y-deuda-tecnica.md)) |
| `aria-invalid` | Solo con errores de validación (`requiredFields`, `passwordPolicyError`, `passwordMismatch`, `codeFormatError`); con «campos obligatorios», solo en los campos vacíos. Un error de red o de credenciales no marca ningún campo |
| Estructura | Tarjeta con `<h1>` (`login.title`) y un `<h2>` por reto; `<form noValidate method="post">`; cada campo con `<label htmlFor>` y un `<span id>` referenciado por `aria-labelledby`; **ningún campo lleva `name`** (el autocompletado va por `autoComplete`: `username`, `current-password`, `new-password`, `one-time-code`) y la contraseña nunca puede viajar en una URL. El error es un `<p role="alert">` con `key` (se vuelve a anunciar) referenciado por `aria-describedby`; `<p role="status">` siempre presente (`login.loading` mientras `busy`); botón `type="submit"` deshabilitado mientras `busy` |
| Paso `newPassword` | Política (`login.passwordPolicy`) en `aria-describedby`, campo `username` de solo lectura con el correo (para los gestores de contraseñas), contraseña nueva y confirmación |
| Paso `mfaSetup` | **Antes del `<form>`**: ayuda, aviso `login.mfaSetupAgain` si el secreto se generó otra vez, etiqueta de la clave, clave en un `<code>` en grupos de 4 con espacios (`formatSecret`; sin `break-all`: el navegador solo parte la línea entre grupos), botón de copiar (fuera del `form`, solo si existe `navigator.clipboard?.writeText` y no hay reintento; copia la clave **sin espacios**) y el [`QrCode`](#qrcode) en un `<div className="flex justify-center px-4 mb-4">`, solo si el hook da `otpUri`. La dirección `otpauth://` **ya no se pinta como texto**: solo genera el QR. Dentro del `form`: el aviso de error (queda debajo del QR) y el campo del código. No hay enlaces. `FIELD_CLASS` lleva `block` (un input en línea deja un hueco bajo la línea) |
| Reintento en `mfaSetup` | Si el hook expone `retry` (`'associate'` o `'respond'`), no se pinta secreto, ayuda, copia ni campo de código: solo el aviso `login.serviceUnavailable` y el botón `login.retryButton` en lugar de `login.verifyButton`. Si el reintento ya no es necesario (`CodeMismatch` en `respond`), vuelven la clave y el campo del código |
| Armonía visual | Todos los pasos usan `px-4 mb-4`, etiquetas en negrita y ayudas en texto normal |
| Código | Antes de validar se limpia de espacios (`123 456` vale); el campo admite `maxLength={7}` por ese motivo |

---|---|
| `hasError` | `true` si `startLogin()` rechaza (falta `VITE_COGNITO_*`, no hay `crypto.subtle`...) |
| `handleLogin()` | Llama a `startLogin()` de `session.js`; un rechazo acaba en un `<span role="alert">` con `login.startError` (no hay promesa sin capturar) |
| Estructura | Sin campos, sin `api`, sin `useNavigate` y sin almacenamiento: `<h2>` con `login.title` y un `ButtonPrincipal` (botón nativo) con `login.logInButton`. Se mantiene el nombre `LoginForm` aunque ya no es un formulario |

---

### QrCode
QR del MFA dibujado en el navegador con `qrcode-generator`, como SVG en línea. Lo usa `LoginForm` en el paso `mfaSetup`. **Props:** `value` (la dirección `otpauth://`, ASCII porque el hook aplica `encodeURIComponent`) y `label` (el nombre accesible, `login.qrLabel`). Exportación por defecto.

| Aspecto | Descripción |
|---|---|
| Generación | `qrcode(0, 'M')` (versión automática, corrección M), `addData`, `make()` dentro de `useMemo([value])` y `try/catch`: si el contenido no cabe (`make()` lanza una cadena) devuelve `null` y queda la clave en texto. El `useMemo` guarda solo `{ n, d }`, no el objeto del generador (que conserva la URI) |
| SVG | `viewBox="0 0 n n"` con `n` = módulos + 8 (quiet zone de 4 módulos por lado dentro del SVG), `<rect fill="white">` de fondo y un solo `<path fill="#0C1811">` con un `M{c+4} {r+4}h1v1h-1z` por módulo oscuro; `shapeRendering="crispEdges"`, `role="img"` y `aria-label`. Los colores van como atributos, no como clases. Clases: `w-48 max-w-full h-auto forced-color-adjust-none` (192 px; la altura sale del `viewBox`; el modo de colores forzados no lo invierte) |
| Seguridad | Sin `innerHTML`, `createSvgTag`, `createDataURL`, `data:` ni `<img>`; el nombre accesible no lleva la URI. El `d` del path **equivale al secreto** (ver S3 en [seguridad](guias/seguridad.md)). Entra en `NO_CONSOLE_FILES` |
| Límite | Con correos muy largos el QR sale más denso a 192 px fijos (peor caso medido: 340 bytes, 73 módulos); la clave en texto es la alternativa. Escaneo real con una app TOTP **(por confirmar)** |

## Formularios y contacto

### ContactForm
Formulario de contacto (nombre, email, asunto y mensaje).
**Prop:** `onLoad(bool)`. **Función:** `handleSubmit(e)` hace `POST /send-email`; el éxito se avisa con `notifySuccess` (`role="status"`) y el error se muestra en `InlineError` (`formError`) encima de «Enviar», que se limpia al enviar: `429` usa `dialogAdvice.errorEmailRateLimit`, `400` `errorEmailInvalid` y el resto `errorEmailMessage`. Ya no usa `DialogAdvice` ni `useDialog`. Deuda: placeholders `sage` y borde `brand` en sus campos. Los campos limitan la longitud con `maxLength` (nombre 100, correo 254, asunto 150, mensaje 2000). El botón se desactiva si falta algún campo. No valida el formato del email más allá de `type="email"`. Las cuatro etiquetas se asocian a sus campos con `htmlFor` e `id` derivados de `useId` (únicos entre instancias). Los cuatro campos llevan `focus-ring`. El botón de enviar es `type="submit"`; un `type="submit"` con `loading` ignora el envío mientras dura (el `onSubmit` no actúa).

### EmailContactGrid
Lee `home.emailsData`, una cadena con el formato `Nombre / email / Nombre / email ...`, la divide por `/` en pares `{ name, email }` y los muestra en dos columnas con enlaces `mailto:`.

### TextInput
Campo de texto con etiqueta visible. Props: `label` (obligatoria, con `htmlFor`), `id` (por defecto de `useId`), `placeholderText`, `value`, `onChange`, `invalid`, `describedBy` e `inputRef`. Es un campo controlado: muestra siempre `value`. `h-12 rounded-xl border-brand-dark`, placeholder `moss` y `focus-ring-inset`. `aria-invalid` y `aria-describedby` solo se ponen cuando se pasan.

---

## Elementos básicos

### ButtonPrincipal
Botón primario (relleno `brand`, texto `ink`, hover `brand-dark`).

| Prop | Descripción |
|---|---|
| `text` | Texto |
| `onClick` | Acción |
| `icon` | Si está presente, pinta un botón cuadrado de 48×48 (`text-brand-dark`, hover `bg-brand text-ink`) con el icono de Material Symbols y sin texto |
| `className`, `disabled` | Estilo extra y estado desactivado (`opacity-50 cursor-not-allowed`, exento de contraste) |
| `ariaLabel` | Nombre accesible; solo se aplica en la rama `icon`. La ligadura lleva `aria-hidden="true"` |
| `type` | `"button"` por defecto; quien envíe un formulario pasa `type="submit"` |
| `loading` | `aria-busy` y `aria-disabled` (no `disabled`, para no perder el foco), el clic se ignora y se muestra el icono `progress_activity` |
| `...rest` | Llega al `<button>` (`id`, `aria-expanded`, `aria-controls`...) |

Con texto: `min-h-12 min-w-[84px] max-w-full`, sin `truncate`. Desaparecen `dropdownOptions`, `onOptionSelect` y el modo desplegable. Las dos ramas llevan `focus-ring`.

### ButtonAlternative
Botón secundario: `border-2 border-brand-dark bg-surface text-brand-deep`, hover `bg-brand text-ink`, mismo tamaño y tipografía que `ButtonPrincipal`. Props: `text`, `onClick`, `className`, `type` (`"button"` por defecto), `disabled`, `loading` y `...rest`. Ya no tiene modo desplegable ni chevrons.

### DialogAdvice
Modal de aviso o confirmación, animado.

| Prop | Descripción |
|---|---|
| `dialogTitle`, `dialogMessage` | Contenido |
| `dialogDetails` | `{ title, content }` opcional, en un `<details>` plegable |
| `showActions` | `true` → botones Confirmar y Cancelar; `false` → solo Cerrar |
| `confirmText` | Texto del botón de confirmar (por defecto `dialogAdvice.confirmButton`; el borrado usa `dialogAdvice.deleteButton`, «Eliminar») |
| `onConfirm`, `onClose` | Acciones. Clic en el fondo = `onClose` |

Se usa junto con el hook `useDialog` dentro de `<AnimatePresence>`. Desde esta iteración solo sirve para confirmar el borrado de una versión, un término o una imagen (con el nombre en el mensaje) y la decisión sobre campos vacíos de `FileUpload`; el resto de avisos van por `ToastProvider` o `InlineError`. El título es `text-brand-deep`.

**Accesibilidad (A6):** la caja interior es `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (el `h3` del título, con `useId`) y `tabIndex={-1}`. Llama a `useDialogFocus(useIsPresent(), onClose)`: mientras el diálogo sale de pantalla se desactivan el listener y la trampa y el foco vuelve a quien abrió. Escape equivale a cancelar: llama a `onClose`, nunca a `onConfirm`.

### ToastProvider
Proveedor de avisos (`src/components/ToastProvider.js`; el contexto y el hook están en [`useToast`](06-utilidades-hooks-config.md#usetoast-srchooksusetoastjs)). Envuelve `App` y monta **siempre** dos regiones dentro de un contenedor `fixed top-20 z-[55]`: `role="status"` (éxitos) y `role="alert"` (errores). Cada aviso lleva icono `aria-hidden`, texto y un botón de cerrar de 44×44 (`feedback.close`). El éxito se cierra solo a los 8 s y el contador se para con el ratón encima o el foco dentro y reinicia al salir (WCAG 2.2.1); los errores no tienen temporizador y se quedan hasta cerrarlos. Sin animación y nunca mueve el foco. Al estar las regiones siempre montadas, los tests no deben usar `getByRole('alert' \| 'status')` sin filtro: comprueban el texto y su región con `closest` o `within`.

### InlineError
`InlineError({ id, children })`: un `<p role="alert">` con borde y texto `danger` y el icono `error` en `aria-hidden`. El campo se asocia con `aria-invalid` y `aria-describedby={id}` y el foco va al campo solo cuando la validación falla.

### InfoButton
Icono `info` (`text-moss`) que muestra un tooltip al pasar el ratón, al enfocar o al pulsar (el clic lo muestra; no alterna). Props: `tooltipText` y `topic` (opcional). Con `topic` el `aria-label` es `iconButton.infoAbout` («Información: {{topic}}»), con el título o la etiqueta visible de al lado (así una página con varios «i» no repite el nombre); sin `topic` se queda en `iconButton.info` (`Explore`). `adjustTooltipPosition()` (en `useLayoutEffect` y en `resize` mientras se ve) mide el tooltip y lo desplaza en horizontal para que quede entre 16 px y `innerWidth − 16`; si su borde inferior pasa de `innerHeight` (menos 72 px bajo 768 px, por la barra inferior) y cabe encima, lo coloca encima. El botón es `type="button"`, de 44×44 (`h-11 w-11 shrink-0`), con `aria-describedby` hacia el tooltip y `focus-ring`; el icono `info` va en un `<span aria-hidden="true">`. El `id`, el `role="tooltip"` y `hidden` están en una envoltura transparente (`top-full pt-2`, o `bottom-full pb-2` encima; sin `mt-2`; `w-max max-w-[min(28rem,calc(100vw-2rem))]`, sin `min-w-*`) y la caja visible (borde `sage`, `bg-surface`, sombra) es un `<span>` interior: el hueco con el botón forma parte del tooltip y no dispara `onMouseLeave`. Escape lo oculta mientras se ve (WCAG 1.4.13). Medido en local con API simulada (11/11/2026): 7 usos con `aria-label` distinto («Information: Choose the dataset», «…Non-Latinisms Exception», «…Gallery management», «…Select files»), de 44×44 px, y el tooltip dentro del viewport a 1440, 768 y 390 px (a 390 px: `left` 31 y `right` 374 con `clientWidth` 375).

### LoadSpinner
Props `label` e `inline` (falso por defecto). Por defecto, capa a pantalla completa semitransparente con un círculo girando (`animate-spin`) en `role="status"` y un texto `sr-only` (`label` o `feedback.loading`). Con `inline` es un `div role="status"` de línea que quien lo usa deja **siempre montado** con `label` vacío en reposo (sin spinner); con texto, muestra el círculo y el texto. No es un skeleton.

### Switch
Interruptor sobre un checkbox con estilos de `styled-components`. Props: `checked` y `onChange`.

### ScrollIndicator
Flecha fija que rebota en la parte inferior. Al pulsarla baja una pantalla (`scrollBy`) y se oculta al llegar al final (hook `UseAtBottom`). Lleva `aria-label` `iconButton.scrollDown`, la ligadura en `aria-hidden` y `focus-ring`.

### ImageComponent
Imagen o fondo a partir de una URL directa o de una clave de S3.

| Prop | Descripción |
|---|---|
| `directUrl` | URL que se usa tal cual (lo habitual, con `assetUrl`) |
| `imageKey` | Si no hay `directUrl`, pide `GET /get-image?imageKey=` (con `encodeURIComponent`) y usa `imageUrl`. Sin `imageKey` no llama a la API |
| `isBackground` | Pinta un `div` con fondo, capa oscura al 70 %, `background-attachment: fixed` y `min-height: 95vh` |
| `className`, `children` | Estilo y contenido (solo en modo fondo) |

---

## Sin uso

### ImageCarrousel
Carrusel infinito con imágenes de `VITE_CAROUSEL_IMAGE_KEYS` (vía `GET /get-image`, con la clave codificada con `encodeURIComponent`) o, si no hay, de `via.placeholder.com`. Solo aparece comentado en `Explore`.

### UploadButton
Prototipo antiguo de subida con `alert()` que no envía nada. Se puede borrar.
