# 05. Componentes

Todos están en `src/components/`. Son componentes funcionales (salvo `ErrorBoundary`) con estilos Tailwind en línea.

Índice por grupo:

- **Estructura:** [Header](#header) · [Navbar](#navbar) · [LanguageSwitcher](#languageswitcher) · [Footer](#footer) · [Sidebar](#sidebar) · [ErrorBoundary](#errorboundary) · [ProtectedRoute](#protectedroute) · [CookieBanner](#cookiebanner)
- **Explorador y datos:** [Filter](#filter) · [CategoryFilter](#categoryfilter) · [FilterSearchBar](#filtersearchbar) · [SpeciesCard](#speciescard) · [DialogSpecies](#dialogspecies) · [SpeciesAttribute](#speciesattribute) · [Table](#table) · [Pagination](#pagination) · [FileDropdown](#filedropdown) · [GalleryViewer](#galleryviewer)
- **Administración:** [FileUpload](#fileupload) · [TermsManager](#termsmanager) · [ImageGalleryManager](#imagegallerymanager) · [ContactRecipientsManager](#contactrecipientsmanager) · [LoginForm](#loginform) · [QrCode](#qrcode)
- **Formularios y contacto:** [ContactForm](#contactform) · [EmailContactGrid](#emailcontactgrid) · [TextInput](#textinput)
- **Elementos básicos:** [Reveal](#reveal) · [ButtonPrincipal](#buttonprincipal) · [ButtonAlternative](#buttonalternative) · [DialogAdvice](#dialogadvice) · [ToastProvider](#toastprovider) · [InlineError](#inlineerror) · [InfoButton](#infobutton) · [LoadSpinner](#loadspinner) · [Switch](#switch) · [ScrollIndicator](#scrollindicator) · [ImageComponent](#imagecomponent) · [EmptyState](#emptystate) · [LogoLink](#logolink)
- **Sin uso:** [ImageCarrousel](#imagecarrousel) · [UploadButton](#uploadbutton)

---

## Estructura

### Header
Barra superior fija (`h-16`, `z-50`, sin borde: `shadow-md` solo cuando la página se ha desplazado, `window.scrollY > 0`, con `transition-shadow motion-reduce:transition-none`). Contiene el logo de S3 con enlace a `/` (el enlace se llama «SIGMETUM-A» y la imagen lleva `alt=""`, `width`/`height` de 48; `focus-ring`, objetivo `min-h-11`), el texto "SIGMETUM-A" con letras de colores (la «A» en `brand`; el logotipo está exento de contraste), `LanguageSwitcher` y `Navbar`. El `<header>` sigue `fixed inset-x-0` con fondo y sombra a todo el ancho pero sin relleno lateral: su contenido va en `<div className="page-container flex h-full items-center gap-2 max-[359px]:px-stack-sm">`, así que el borde del logo coincide con el `<h1>` y con el pie y el de la navegación con el del contenido de 1024 a 3440 px (medido el 12/11/2026); bajo 360 px se conservan los 8 px de antes (excepción documentada en `DESIGN.md`). El logo es `h-8` bajo `sm` y `h-12` desde `sm`; bajo 360 px el texto del nombre pasa a `sr-only` y solo queda el logo (el nombre sigue en el `aria-label` del enlace).
Medido a 320 px el 12/11/2026 (local con API simulada, en español): `header.scrollWidth` 305 igual a `clientWidth` 305 (sin desborde), botón del menú de 48 px con su borde derecho en x=297 (antes: `scrollWidth` 343 frente a 321 y el botón en x=345, fuera de pantalla).
Sin efectos sobre el favicon. Este sale ya correcto del HTML compilado (plugin de `vite.config.js`, ver [06](06-utilidades-hooks-config.md#favicon-viteconfigjs-y-faviconhtml)); `ASSETS.LOGO` y `assetUrl` solo se usan aquí para el `<img>` del logo.

### Navbar
Menú principal, un `<nav aria-label>` (`navbar.label`). `menuItems`: Inicio (`/`), Explorar (`/explore`), Galería (`/gallery`) y Sobre nosotros (`/about-us`), como `NavLink end` (ponen `aria-current="page"`).
- Escritorio (`md+`): lista horizontal; la ruta activa lleva una barra inferior de 4 px `brand-dark` y `font-bold` (la señal no es solo el color); los demás ítems, `font-normal` y el mismo borde transparente para que el texto no salte, con hover `bg-sage-soft` y `border-b-moss` (5,76:1 sobre `sage-soft`). Los enlaces llevan `whitespace-nowrap` y `px-2` (`lg:px-6`) para que «About us» no se parta en dos líneas a 768 px; medido en local con API simulada (11/11/2026, en inglés): «About us» mide 62 px de alto igual que «Home» (una línea) y `header.scrollWidth <= clientWidth` a 1440 y 768 px. En español **no se midió (por confirmar)**: si la cabecera desbordara a 768 px haría falta `md:text-sm lg:text-base`.
- Móvil: botón con icono `Menu` (`ButtonPrincipal` con `ariaLabel` `iconButton.menu`, `aria-expanded` y `aria-controls`) que abre un panel (`max-w-[calc(100vw-1rem)]`, enlaces de `min-h-11`; el activo lleva `bg-sage-soft font-bold underline decoration-4 decoration-brand-dark underline-offset-4`: sin franja lateral, la señal es el subrayado y el peso, no solo el color; B61, decisión del usuario del 12/11/2026; medido en local con API simulada a 390 px: subrayado de 4 px, peso 700, `border-left-width` 0 y 44 px de alto). Escape lo cierra y devuelve el foco al botón.

| Estado / función | Descripción |
|---|---|
| `showDropdown` | Desplegable móvil abierto |
| `toggleDropdown()`, `closeDropdown()` | Abrir o cerrar |
| Efecto | Cierra al hacer clic fuera (`mousedown` en `document`) y con Escape, solo mientras está abierto |

### LanguageSwitcher
Selector de idioma: un `<select>` nativo (`focus-ring`, `h-11`, `rounded-xl`, `font-normal`, aligerado para caber en la cabecera a 320 px) con una `<label className="sr-only">` (`language.label`) y dos `<option>` («Español» con `lang="es"` y «English» con `lang="en"`). Ya no usa `ButtonAlternative` ni el modo desplegable.

| Estado / función | Descripción |
|---|---|
| Valor | `i18n.resolvedLanguage` (no `i18n.language`, que puede valer `es-ES`, `en-US` o `fr`) |
| Cambio | Llama a `i18n.changeLanguage('es' \| 'en')`. El detector lo guarda en `localStorage` |

### Footer
El único `<footer>` de la aplicación (`App` ya no pinta otro), con fondo `ink` y texto `surface`, dentro de `.page-container`. Tres columnas desde `md` (`2fr 1fr 1fr`): **Instituciones** (`<h2>`; los cinco logos de las universidades de `UNIVERSITIES` como `LogoLink` dentro de **una sola placa** clara `rounded-xl bg-surface`), **Contacto** (`<h2>`, la dirección `home.locationContent` y un enlace a `/#contacto`) y **Enlaces** (`<h2>`; Inicio, Explorar, Galería, Sobre nosotros y Cookies, `focus-ring`, `min-h-11`; la lista es una rejilla `grid grid-cols-2 gap-x-stack md:grid-cols-1`: dos columnas bajo `md` y una desde `md`). Debajo, con un filete `moss`, el copyright con el año actual (`footer.copyright` con `{currentYear}`) y «V 1.0.0» en negrita como `<summary>` de un `<details>` que despliega el mensaje `ee` (corrige el solapamiento a 375 px, B32).
Medido el 12/11/2026 en local con API simulada y en inglés: tres `<h2>`, cinco logos de 112×48 en una placa de 512×176 px a 1440 y de 343×256 a 390; alto del pie 450 px a 1440 y 1032 px a 390 (antes 168 y 260). **Vuelta 1 (12/11/2026, B62, decisión del usuario):** a 390 px los cinco enlaces van en dos columnas (Inicio, Galería y Cookies en x=16; Explorar y Sobre nosotros en x=195; todos de 44 px de alto; «Cookies» queda sola en su fila) y el pie mide 944 px. Sigue siendo largo por la placa de logos (343×256 px). Sin E2E de la rejilla (B59).

### Sidebar
Barra de gestión (normaliza la ruta quitando la barra final; desde `md` ocupa toda la altura con `bg-surface`): un `<nav aria-label>` (`privateNav.label`, «Gestión»). Bajo `md` es una barra inferior fija (`h-nav`, `z-40`) y desde `md` una columna fija a la izquierda (`top-16 w-28`). Cada ítem muestra icono (`aria-hidden`) y etiqueta visible; el ítem activo lleva `bg-brand font-bold` y un borde `ink` (color, peso y forma), nunca `surface` sobre `brand`. «Cerrar sesión» desactivado (`disabled`) usa el mismo estado inactivo que los botones: `disabled:border-2 disabled:border-dashed disabled:border-moss disabled:text-moss disabled:hover:bg-transparent` y `disabled:cursor-not-allowed`, sin `opacity-50` (B60).

| Prop | Tipo | Descripción |
|---|---|---|
| `menuOptions` | `Array<{ id, name, icon, link?, component? }>` | Opciones definidas en `App` (`name` ya traducido con `privateNav.*`) |
| `exploreData` | `Array \| null` | Si es `null` en `/explore`, se oculta el filtro |
| `showLogout` | `boolean` | `true` en las rutas protegidas: añade el ítem «Cerrar sesión» (`login.logOutButton`) |

| Estado / función | Descripción |
|---|---|
| `filteredMenuOptions` | Opciones visibles en la ruta actual. Una sola regla (sustituye a la tabla `exclusions`): en `/explore` solo las que no tienen `link` (y `filter` solo si `exploreData` no es `null`); en el resto, solo las que tienen `link` |
| `activeComponent`, `isOpen` | Qué `component` se muestra en el panel y si está abierto |
| `loggingOut` | Desactiva «Cerrar sesión» mientras dura `api.logout()` |
| `NavItem` | Componente local del contenido de un ítem (icono y etiqueta) |

- Seis ítems en las privadas, en este orden: Datos, Términos, Galería, Correos, Cargar y Cerrar sesión (la etiqueta `privateNav.recipients` es «Correos» / «Emails»; el título y los textos de la página siguen siendo «Destinatarios…»; iconos `database`, `text_fields`, `photo_library`, `contact_mail` y `upload`; `settings` se retiró de `icon_names`). El `<nav>` lleva `md:overflow-y-auto`: en alturas cortas (1366×768 con zoom del 150 % o 1024×600) «Cerrar sesión» se alcanza con scroll y con Tab, y el foco no queda tapado.
- **Tamaño de la etiqueta (12/11/2026):** `itemBase` lleva `px-0 text-[11px] min-[360px]:px-0.5 min-[360px]:text-xs`: bajo 360 px, 11 px y sin relleno horizontal (los seis ítems miden 51 px a 320 px); desde 360 px, igual que antes (12 px). Medido en local: ninguna palabra supera el ancho de su ítem ni se parte a 320, 340, 359, 360 y 390 px (es y en; margen más justo, «Términos» a 320 px, 48 de 51). Lo vigila `e2e/private-nav.spec.js` (solo local). El 11 px frente a los 12 px de `text-xs` queda **por confirmar** (B78).
- Los destinos (`Datos`, `Términos`, `Galería`, `Correos`, `Cargar`) son `NavLink end` con `aria-current="page"`; ya no hay un `<button>` dentro de un enlace (B27 resuelto). «Filtros» es un `<button aria-expanded aria-controls>` y «Cerrar sesión» un `<button>` que llama a `api.logout()` una vez.
- **Panel de filtros** (B21 resuelto en `Sidebar`): siempre montado (cerrado, con el atributo `hidden`; así el `Filter` no pierde su selección); abierto es `role="dialog" aria-modal="true"` con `aria-labelledby` hacia el `<h2>` de `Filter` (`titleId` de la opción activa; `aria-label` `privateNav.filters` solo de respaldo si la opción no trae `titleId`) con `useDialogFocus` (foco al abrir, trampa de Tab, Escape y devolución del foco a «Filtros»). Es `fixed inset-y-0 left-0 z-[60] w-full max-w-sm`, hermano de la barra (no hijo), igual que su fondo oscuro `z-[60]`: cubre cabecera y barra. Sin animación de deslizamiento. Mientras está abierto, un efecto pone `document.body.style.overflow = 'hidden'` y restaura el valor anterior al cerrar o desmontar; el contenedor interior ya no lleva `min-h-full` y sí `overscroll-contain`, de modo que el panel vacío no debería tener scroll propio (medido en local con API simulada, 11/11/2026: `scrollHeight` igual a `clientHeight`, 900/900 y 844/844 px; `aria-labelledby` apunta al `<h2>` «Filters»; `overflow: hidden` en el `body` abierto y `visible` al cerrar; el ancho del `header` no cambia al abrir, 1424,6 px antes y después, y `clientWidth` pasa de 1425 a 1440 al desaparecer la barra, compensado por `scrollbar-gutter: stable`); con barras de desplazamiento clásicas **(por confirmar)**. Su botón de cerrar es un `ButtonPrincipal icon="close"` con `iconButton.close`. Solo se muestra el componente de la opción activa.
- **Posición desde `md`:** la `nav` es `sticky md:top-16` con alto `md:h-[calc(100dvh-4rem)]`, `md:self-start` y `md:shrink-0` (antes `fixed` con `md:bottom-0 md:h-auto`), hija de la fila flex de `App`: no debería dejar franja sin barra ni pie bajo ella (medido en local con API simulada, 11/11/2026: a 1440 y 768 px `position: sticky`, `top` 64 y ancho 112 px, y el pie ocupa todo el ancho —`left` 0— sin franja blanca; a 390 px barra `fixed` inferior, `top` 772 y `bottom` 844, sin scroll horizontal; a 1024 px y con una página larga tras desplazar, **por confirmar**). Bajo `md` sigue siendo la barra inferior `fixed`. La opción `dataManagementFilter` ya no existe (`/manage-data` no tiene botón «Filtros»).
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
Banner de consentimiento y modal de configuración. El enlace «aquí/here» lleva `focus-ring inline-flex min-h-6 min-w-6 items-center justify-center rounded underline` (Y1: 25×24 px medido, WCAG 2.5.8; es un enlace dentro de la frase, así que se documenta la excepción a los 44 px). Sigue siendo `<a href="/cookies">` y recarga la página (B73). A 320 px el banner mide 225 px (en) y 241 px (es), 8 px más que antes. Prop `aboveBottomBar` (por defecto `false`): el banner es una `<section aria-label>` **`sticky`** `z-40` al final de la raíz, con `bottom-0` o, con la barra de gestión, `bottom-nav md:bottom-0`; ocupa su sitio en el flujo (no tapa contenido ni pie) y libera el espacio al aceptar. Compacto en móvil (`p-3 sm:p-4`, `gap-2`, título `text-sm sm:text-base`, texto `text-xs sm:text-sm`, botones en una fila; 228 px a 320x700). El modal de configuración queda fuera de esa sección. B21 sigue abierto para el banner (sin `role="dialog"`). **Variante B** (decisión del plan, con medición): ya no es oscuro; lleva `border-t border-moss bg-surface text-ink`, un icono `info` (`aria-hidden`, `text-moss`) delante del título y el título es un `<h2>` (antes `<h3>`). Los textos son `text-xs sm:text-sm`; los 12 px de `text-xs` y que no sea una tarjeta redondeada son excepciones documentadas en `DESIGN.md`. Altura medida a 320x700 el 12/11/2026 (local, API simulada): 217 px en inglés y 233 px en español; con la barra inferior de `/explore` (72 px), 289 y 305 px, dentro de los 320 px de `scroll-padding-bottom` (20 rem). El modal de configuración usa tokens (`bg-ink/70`, `bg-surface`, `border-sage`).

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
Tarjeta de una especie en la cuadrícula del explorador. Es un `div role="button"` (antes un `motion.div` sin teclado) con `aria-label` (el nombre de la especie), `tabIndex={0}` y `focus-ring`: Enter y Espacio abren el diálogo (`onKeyDown` con `preventDefault`). Esto corrige de paso la deuda A2 de la tarjeta (no se podía abrir con teclado). Estilo con tokens: `rounded-lg`, `border-sage`, `bg-surface`, `hover:bg-sage` con `transition-colors motion-reduce:transition-none` (sustituye al hover animado con `motion`), texto `ink` en peso 400 y el nombre científico en Amaranth cursiva (`font-primary italic`: Sen no tiene cursiva).

| Prop | Descripción |
|---|---|
| `species` | Objeto con `Especies Características` = nombre de la especie |
| `data` | Conjunto completo (se pasa al diálogo) |
| `noItalicTerms` | Términos que no van en cursiva |

| Estado / función | Descripción |
|---|---|
| `isDialogOpen`, `openDialog()`, `closeDialog()` | Control del diálogo de detalle |
| `handleKeyDown(event)` | Enter y Espacio abren el diálogo |
| `highlightTerms(text, terms)` | Utilidad compartida (`utilities/highlightTerms.js`): divide el nombre en fragmentos `{ text, isItalic }`. Los términos de `terms` (por ejemplo `subsp.`, `var.`) van en redonda y el resto en cursiva, como exige la nomenclatura botánica. Escapa los caracteres especiales de cada término antes de construir la expresión regular |

### DialogSpecies
Modal de detalle de una especie.

| Cálculo | Descripción |
|---|---|
| `filteredSpecies` | Registros de `data` cuyo `Especies Características` coincide exactamente con esta especie: igualdad si el valor es una cadena, pertenencia si es un array (helper local `contieneEspecie`; sin normalizar mayúsculas ni espacios) |
| `uniqueAttributes` | Por cada atributo (provincia, municipio, altitud media, sector biogeográfico, piso bioclimático, ombrotipo, naturaleza del sustrato, tipo de serie, serie de vegetación y vegetación potencial), los valores únicos ordenados con `SortItemsList` y unidos por comas |
| `ipniHref` | `ipniUrl(species["Especies Características"])` ([06](06-utilidades-hooks-config.md)): `https://www.ipni.org/search?q=<consulta codificada>`. Si es `null` (nombre no válido o vacío) no se pinta el enlace |
| `highlightTerms` | La misma utilidad compartida que usa `SpeciesCard` |

Muestra el título con cursivas, un `SpeciesAttribute` por atributo, el botón "Cerrar" y el enlace "Leer más" a IPNI (`target="_blank"`, `rel="noopener noreferrer"`, `https`, 44 px de alto mínimo; con `open_in_new` en `aria-hidden`, de modo que el nombre del enlace es solo el texto). Se cierra al pulsar fuera.

**Accesibilidad (A6):** la caja interior es `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (el `div` que contiene los `h2` del título compuesto) y `tabIndex={-1}`. Llama a `useDialogFocus(isOpen && useIsPresent(), onClose)` antes del `if (!isOpen) return null`: el foco entra en la caja al abrir, Tab queda atrapado, Escape llama a `onClose` y el foco vuelve a quien abrió. Con la caja ya enfocada, el primer elemento enfocable es el primer `summary` de atributos, no «Cerrar».

### SpeciesAttribute
Bloque `<details>` abierto con título y lista. Si `description` es una cadena, la divide por comas y pinta un párrafo en cursiva por valor; la cursiva va en Amaranth (`font-primary italic`), porque Sen solo se carga en 400 y 700 y no tiene cursiva.

### Table
Tabla paginada genérica.
Props: `data` (`Array<Registro>`), `rowsPerPage` (5 por defecto) y `label` (nombre accesible). La tabla va dentro de `<div role="region" aria-label={label} tabIndex={0} className="focus-ring overflow-x-auto">` (la paginación queda fuera, así que la tabla ancha se desplaza dentro de su región sin ensanchar la página), con un `<caption className="sr-only">` y `th scope="col"` con `text-ink` sobre `brand`.
Las columnas son la unión de las claves de todos los registros, en orden de primera aparición (no muta `data`), y se traducen con `attributes.<col>`. Los valores array se muestran uno por línea. **Estado:** `currentPage`.

### Pagination
Botones anterior/siguiente con el texto "Página X de Y".
Props: `currentPage`, `totalPages` y `onPageChange('prev' | 'next')`. Desactiva los extremos. Los dos botones de icono llevan `ariaLabel` (`iconButton.previousPage` y `iconButton.nextPage`).

### GalleryViewer
Visor a pantalla completa de `VegetationGallery`; se monta solo cuando `index !== null`. Props: `images`, `index`, `onIndexChange` y `onClose`. Es un diálogo modal (`role="dialog"`, `aria-modal`, `aria-labelledby` hacia el nombre de la foto, `tabIndex={-1}`) sobre un fondo `bg-ink/95`, con `useDialogFocus` (foco a la caja, trampa de Tab, Escape y devolución del foco). Una envoltura `aria-live="polite" aria-atomic` contiene el `<h2>` con el nombre legible (`photoName`) y el contador «n de N» (`gallery.viewer.counter`), para que se anuncien juntos. «Anterior», «Siguiente» (y las flechas del teclado) dan la vuelta en los extremos: los botones nunca se deshabilitan. Los botones miden 48×48 con nombre (`iconButton.previousPhoto`, `nextPhoto` y `close`): bajo `md`, anterior y siguiente abajo (zona del pulgar) y cerrar arriba a la derecha; desde `md`, anterior y siguiente centrados a los lados. Sin animaciones. Mientras está abierto bloquea el desplazamiento del `body` (`overflow: hidden`) y lo restaura al cerrar o desmontar (A6). Solo pinta el `<img>` si `isSafeImageUrl` ([06](06-utilidades-hooks-config.md)) acepta la URL de la foto; si no, deja la caja vacía y no pide la imagen (S7).

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
| `loadVersion(key)` | `GET /get-data/<key>` con `api.getAuth` (el backend exige token con `.xlsx`; `/list-files` sigue con `api.get`). Un 401 lo gestiona `api.js`; un 422 (archivo corrupto) muestra el error con «Reintentar». Se descartan las respuestas cuya clave ya no es la actual (las flechas sobre un `<select>` cerrado disparan `change` por opción en Windows) |

Marcado: opción vacía (`emptyOption`), un `<optgroup label={provincia}>` por provincia y una `<option>` por versión, cuyo texto incluye la provincia («Almería 10/11/2026 · V1»; un `<select>` cerrado no muestra la etiqueta del grupo). Las versiones salen en el orden del backend. Un `LoadSpinner inline` queda siempre montado; los errores se muestran con `InlineError` y un `ButtonAlternative` «Reintentar» (repite la misma clave); la lista vacía muestra `emptyState` («Todavía no se ha subido ningún archivo de datos, así que no hay versiones para elegir.»: explica la causa, distinta del error de carga) y un `Link` estático a `/upload-files`. El `<select>` lleva `aria-describedby` al texto de vacío, al error de la lista y/o al de la versión (`failedKey`); deshabilitado se pinta con `disabled:border-moss disabled:text-moss disabled:opacity-100 disabled:cursor-not-allowed` (`moss` sobre `surface`, 6,27:1 según A1) en lugar de `opacity-50`; medido en local con API simulada (11/11/2026): `opacity` 1, color `rgb(75, 100, 74)`, con `aria-describedby` al mensaje «No data files have been uploaded yet…» y sin tabla.

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

**Arrastre y anuncios (T7, 12/11/2026):** `dragover` y `drop` en `window` con su limpieza; solo hacen `preventDefault` si `dataTransfer.types` incluye `'Files'` (B49 refinado en la vuelta 2: soltar un archivo fuera de la zona ya no lo abre, y arrastrar texto o enlaces no se bloquea); los duplicados por nombre y tamaño se quitan dentro del mismo `drop` (B52); el `<p role="status">` sigue montado y cada anuncio hace `setAnnouncement('')` y escribe el texto con un `setTimeout` de 100 ms (ref, limpiado al desmontar y en el anuncio siguiente), de modo que el mismo texto se repite (B53).

**Interfaz:** zona de arrastre con el icono `upload_file` (`aria-hidden`) y el texto de ayuda; lista `<ul aria-label>` con el estado de cada archivo (`uploadFiles.fileStatus.*`) y una papelera por fila (nombre `removeFile`); barra `role="progressbar"` con `aria-valuemin`, `aria-valuemax`, `aria-valuenow` y `aria-valuetext` («Subiendo archivo n de N…») y un `LoadSpinner inline` siempre montado; botón «Subir N archivos» (plural de i18next, `uploadFilesButton_one`/`_other`) con `loading`; mientras se sube, quitar o elegir archivos está desactivado; los inputs de archivo ocultos llevan `aria-hidden` y `tabIndex={-1}`. Los errores de subida y de borrador no encontrado van en línea (`InlineError`); `DialogAdvice` queda solo para la decisión sobre campos vacíos. **Cambio de comportamiento deliberado:** tras un `500` al confirmar o un fallo de red, la lista **conserva** el estado de error (antes se vaciaba), de modo que al reintentar solo se suben los archivos que no están en `done`; con dos o más errores solo se muestra el primero (la cola se corta en el primero). Peticiones, cabeceras y cuerpos no cambian.

Si el usuario cancela o cierra el diálogo de confirmación, se envía `confirmed: false`, se detiene la cola y no se muestra el éxito. Se comprueba la respuesta de cancelar: `404` muestra `errorDraftNotFound` y otro fallo `errorUploadMessage`; en ambos no se vacía la lista (se puede reintentar). Usa `api.postFormAuth` y `api.postAuth`: no lee el token y un `401` (en `/upload`, al confirmar o al cancelar) redirige a `/login`, cosa que hace `api.js`; el componente solo lo reconoce para no abrir el diálogo de error ni vaciar la cola. Un fallo reintentable de Cognito al renovar (`type: 'auth_unavailable'`, `status: 503`; la sesión se conserva) no es un `401`: muestra el error en línea (`errorUploadMessage`) en lugar de cortar en silencio. El `404` de `/upload/confirm` se interpreta por estado: cualquier `404` en esa ruta se muestra como "el borrador ya no existe". Ver el diagrama en [01-arquitectura.md](01-arquitectura.md#flujo-de-subida-de-datos-api-v2).

### ContactRecipientsManager
Gestión de los correos que reciben las dudas del formulario de contacto (BL1). Misma estructura que `TermsManager`: `<div>` (ya no `<section aria-labelledby>`) con `<h1>` (`.focus-heading`, `tabIndex={-1}`, clase del `<h1>` de `DataManagement`), `InfoButton` (`topic`) y `LoadSpinner inline` siempre montado. Va en `/manage-recipients` (`RecipientsManagement`), a ancho completo. Desde el 12/11/2026: `requestRef` descarta respuestas antiguas de `GET /list-recipients` (B64); `isLoadingList` empieza en `true` y «Añadir» queda `inactive` si hay máximo o la lista no está lista, con `aria-describedby` al aviso de máximo (prioridad `atMax` > cargando > error), a `contactRecipients.loadingHint` («Cargando la lista…» / «Loading the list…») mientras carga o al `InlineError` de carga, y `handleAdd` no hace nada sin lista (B65); la fila es `<form noValidate onSubmit>` con el botón `type="submit"` (Enter añade una sola vez, B67) y el `InlineError` del campo anuncia (`announce`) solo si el foco ya estaba en el campo (Enter), no al pulsar el botón (B66); las columnas de la galería usan `ResizeObserver` (B68, en `VegetationGallery`). Contrato en [03](03-api.md) y [para-backend](integracion/para-backend.md).

| Estado / función | Descripción |
|---|---|
| `email`, `recipients`, `isLoadingList`, `isError`, `busy`, `fieldError`, `focusRequest` | Campo, lista, carga, error de carga, operación en curso (`'add'` o `'remove'`), error de validación (`'required'`, `'email'` o `'duplicate'`) y petición de foco al título |
| `fetchRecipients()` | `GET /list-recipients`. Si la respuesta no es una lista, o falla (500, 404 con un backend sin desplegar, red), `InlineError` con `contactRecipients.errorLoad` y «Reintentar»; no se pinta una lista vacía |
| Contador | `contactRecipients.counter` («N de 5 destinatarios») junto al `<h2>`, solo sin error ni carga |
| `handleAdd()` | Sale si ya hay `RECIPIENTS_MAX` (5). Valida con `validateRecipientEmail` ([06](06-utilidades-hooks-config.md)): un fallo pinta `InlineError`, `aria-invalid`, `aria-describedby` y lleva el foco al campo, **sin** llamar a la API. Si pasa, `POST /add-recipient` con `{ email: email.trim() }`, `notifySuccess`, campo vacío y recarga; si falla (400, 429 o 500), `notifyError` y se conserva lo escrito. El campo es `TextInput type="email" maxLength={254}` con etiqueta visible |
| `handleRemove(address)` | Cierra el diálogo, `DELETE /delete-recipient` con `{ email }`, aviso, recarga y, **haya ido bien o no**, el foco al `<h2>` (`focusRequest`: el botón que abrió el diálogo se desmonta o se desactiva). Una guarda `removing` (ref) descarta un segundo borrado mientras el primero sigue en curso (doble clic o doble Enter en «Eliminar») |
| Lista | `<ul aria-label>` en el orden del servidor, `key={normalizeEmail(email)}`, filas `min-h-12` con el correo en `<span class="min-w-0 break-all">` (texto, nunca HTML) y la «x» (`ButtonPrincipal icon="close"`, `shrink-0`, 48×48) con nombre `contactRecipients.removeRecipient` que incluye el correo. Sin destinatarios: `contactRecipients.empty` (explica que se usa la dirección por defecto) |
| Confirmación | `DialogAdvice variant="warning"`, `confirmText` `dialogAdvice.deleteButton` y el correo en `<strong>` dentro del mensaje; Cancelar y Escape no llaman a la API |
| Mínimo y máximo | Con 5 destinatarios, «Añadir» usa `inactive` y `aria-describedby` hacia `contactRecipients.maxReached` (con la lista cargando, hacia `contactRecipients.loadingHint`; con error de carga, hacia el `InlineError`); con 1, la «x» usa `inactive` con `aria-describedby` hacia `contactRecipients.lastRecipient`. Ambos textos van visibles, en `text-sm text-moss`, nunca como aviso |

El cliente valida solo por usabilidad: la regla la impone el servidor. Cubierto por `ContactRecipientsManager.test.js` (cargando, error 500 y 404 con reintento, vacío, con datos, formato, duplicado, máximo, mínimo, cancelar, foco). La integración real con el backend de `dev` **(por confirmar)**.

### TermsManager
Desde el 12/11/2026 va en `/manage-terms` (`TermsManagement`): `<div>` con `<h1>` (antes `<section>` con `<h2>`); el foco tras borrar sigue yendo al título.

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
Desde el 12/11/2026 va en `/manage-gallery` (`GalleryManagement`) con `<h1>` y `<div>` (antes `<h2>` y `<section>`).

Gestión de las imágenes de la galería. Cada fila lleva una miniatura (`Thumbnail` local: `img` de 48×48 con `src` la URL prefirmada de `GET /list-images`, `alt=""`, `loading="lazy"`, `object-cover`; con `onError` —la URL caduca a la hora— se oculta el `img` y queda una caja de 48 px con borde `sage`. Antes de pedir la imagen, `isSafeImageUrl` (utilidad compartida con `VegetationGallery` y `GalleryViewer`, [06](06-utilidades-hooks-config.md)) solo acepta `https:` (y `http:` únicamente para `localhost` y `127.0.0.1`); si no es válida muestra la misma caja vacía **sin pedir la imagen** (seguridad.md S7); `key={image.url}` reinicia el fallo con una URL nueva). Mismo patrón que `TermsManager` (`<h2>`, `InfoButton`, avisos con `useToast`, lista `<ul aria-label>` con `imagesListLabel`, borrar con confirmación, papelera con nombre `deleteImage`).

| Estado / función | Descripción |
|---|---|
| `imageTitle`, `imageFile`, `images` | Título, archivo elegido y lista actual |
| `fieldError` | `{ field: 'title' \| 'file', key }`, comprobado en este orden: falta el título (`imageTitleRequired`, tras `trim()`: un título de solo espacios ya no pasa), título no válido (`adviceInvalidImageTitle`) y falta la imagen (`imageFileRequired`, con foco y `aria-describedby` en «Seleccionar imagen»). Error en línea con `InlineError`; sin petición |
| `fetchImageUrls()` | `GET /list-images` |
| `handleFileChange(e)` | Guarda el archivo elegido (JPEG, PNG, GIF o WebP); se muestra su nombre o `noImageSelected` |
| `handleImageUpload()` | Rechaza un título con `/`, `\`, `..`, caracteres de control o `, ' : & # ? % "` (sin tope de longitud), envía `POST /upload-image` (multipart `file` + `title`) y recarga. Botón «Añadir imagen» |
| `deleteImage(fileName)` | Tras confirmar, `DELETE /delete-image { imageKey: fileName }` y recarga |

### LoginForm
Formulario propio de acceso con SRP contra Cognito. Solo pinta: la lógica es de [`useCognitoLogin`](06-utilidades-hooks-config.md#acceso-con-cognito-srchooksusecognitologinjs) y nunca toca tokens (los guarda `api`). Si el componente se desmonta durante `signIn`, `api` guarda igualmente los tokens y la persona queda con sesión abierta sin navegar (B28 en [09](09-estado-actual-y-deuda-tecnica.md)). Al autenticarse navega a `/upload-files` con `replace`.

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
**Props:** `onLoad(bool)` y `onSent()` (se llama tras un envío correcto; `Home` lo usa para enfocar el `<h2>` de `#contacto`). Es un `<form noValidate>`: la validación es propia y no la del navegador. `validateContact` ([06](06-utilidades-hooks-config.md)) calcula los errores en cada render; cada campo muestra el suyo (`InlineError` con `aria-invalid` y `aria-describedby`) solo después de salir de él (`onBlur`) o de intentar enviar, y el error desaparece al corregirlo. El mensaje exige 20 caracteres como mínimo tras `trim` (el límite propio del backend es **(por confirmar)**) y el correo, un formato `nombre@dominio`. Los campos son `TextInput` con `hint` (máximos: nombre 100, correo 254, asunto 150 y mensaje 2000 con `maxLength`), `autoComplete`, `required` y, el mensaje, `multiline`.
**Botón «Enviar»:** local al formulario (no es `ButtonPrincipal`): un `<button type="submit">` con `aria-disabled` y `aria-describedby` hacia la ayuda mientras el formulario no es válido, y `BUTTON_INACTIVE_CLASS` (borde discontinuo `moss`, sin relleno, `cursor-not-allowed`); válido, `BUTTON_PRINCIPAL_CLASS`. Se usa `aria-disabled` y no `disabled` porque un botón `disabled` bloquea el Enter implícito: pulsarlo o dar Enter **no envía**, pero muestra los cuatro errores y lleva el foco al primer campo inválido (para el usuario sigue deshabilitado: lo anuncia, se ve inactivo y no envía). Encima, una lista «Para enviar, falta:» (`home.contactForm.submitHelpTitle`) con una frase por cada fallo.
**Anuncio de errores (vuelta 1, 12/11/2026):** tras un envío inválido los errores se pintan **sin** `role` (`announceError={false}` en `TextInput`, que pasa `announce={false}` a `InlineError`) y un único `<p role="status" class="sr-only">` anuncia «Hay N errores en el formulario» (`home.contactForm.errorSummary_one` y `_other`), de modo que el lector no repite cuatro alertas. Cuando el usuario edita un campo con error y sale de él, ese campo vuelve a `role="alert"`. El texto real y el plural se prueban con i18next real en `ContactForm.i18n.test.js` (B59 b).
**Doble envío y solo lectura:** un ref (`sending`) hace que `handleSubmit` salga sin hacer nada mientras `POST /send-email` está en curso, y el estado `isSending` pone los cuatro campos en `readOnly` durante la petición (no `disabled`: conservan el foco y el valor). **Tras el éxito (BL2):** se vacían los cuatro campos, `touched`, `silent` y el contador del resumen (sin `aria-invalid`, sin `role="alert"` ni texto en el `role="status"`), el aviso de éxito se mantiene y se llama a `onSent`. **Tras un fallo** (400, 429, red o 500) se conserva todo lo escrito y sale el `InlineError`. Cubierto por `ContactForm.test.js` y, con i18next real (texto y plural de `errorSummary`), por `ContactForm.i18n.test.js`.
**Envío:** `handleSubmit(e)` hace `POST /send-email` solo con datos válidos; el éxito se avisa con `notifySuccess` (`role="status"`) y el error se muestra en `InlineError` (`formError`) encima de «Enviar», que se limpia al enviar: `429` usa `dialogAdvice.errorEmailRateLimit`, `400` `errorEmailInvalid` y el resto `errorEmailMessage`. Ya no usa `DialogAdvice` ni `useDialog`. Las cuatro etiquetas se asocian a sus campos con `htmlFor` e `id` derivados de `useId` (únicos entre instancias). Contrato con el backend: sin cambios (ver [para-backend](integracion/para-backend.md)).

### EmailContactGrid
Lee `home.emailsData`, una cadena con el formato `Nombre / email / Nombre / email ...`, la divide por `/` en pares `{ name, email }` y los muestra en una columna (dos desde `sm`) con enlaces `mailto:` de 44 px, subrayados y con `break-all` solo donde hace falta; texto de 16 px y el nombre en `font-bold text-ink` (antes `font-semibold`).

### TextInput
Campo de texto con etiqueta visible. Props: `label` (obligatoria, con `htmlFor`), `id` (por defecto de `useId`), `placeholderText`, `value`, `onChange`, `onBlur`, `invalid`, `describedBy`, `inputRef`, `announceError` (por defecto `true`; `false` pinta el error sin `role`), `type`, `maxLength`, `autoComplete`, `required`, `readOnly` (por defecto `false`; llega al control; lo usa `ContactForm` durante el envío), `multiline` (pinta un `<textarea>` de `min-h-32 py-stack-md` en lugar de un `<input>` de `h-12`), `hint` y `error`. Es un campo controlado: muestra siempre `value`. `rounded-xl`, borde `brand-dark`, placeholder `moss` y `focus-ring-inset`. `hint` es una línea de ayuda en `text-sm text-moss` (con su `id`, enlazada por `aria-describedby`); `error` pinta un `InlineError` (con su `id`) y activa el borde y el anillo `danger` y `aria-invalid`, igual que `invalid` (que usan las páginas privadas). Los `aria-describedby` se combinan (`describedBy`, ayuda y error).

---

## Elementos básicos

### Reveal
Aparición única al entrar en pantalla (`src/components/Reveal.js`, valores en `src/config/reveal.js`): `Reveal({ as='div', index=0, disabled=false, className, children, ...rest })` pinta `data-reveal` y tres estados: `visible` (por defecto), `hidden` (`.reveal-hidden`: opacidad 0 y `translateY` de `stack-md`, 12 px) y `revealed` (`.reveal-in`: transición de 450 ms con `cubic-bezier(0.16, 1, 0.3, 1)` y `transitionDelay` de `staggerDelay(index)`, de 0 a 300 ms como máximo). En `useLayoutEffect` se queda `visible` si `disabled`, si no existe `IntersectionObserver`, si hay `prefers-reduced-motion` o si ya está en la primera pantalla (decisión por posición en el documento: `rect.top + scrollY < innerHeight`, porque `App` sube la página después); si no, pasa a `hidden` y se observa dentro de un `try` (si falla, `visible`). Hay **un solo `IntersectionObserver`** para todo el módulo (`threshold: 0`, `rootMargin: '0px 0px -10% 0px'`), con un `Map` de elemento a callback: `unobserve` al revelar o desmontar y `disconnect` cuando el mapa se vacía. Con foco (`focusin`, también por clic) pasa a `visible` sin transición. El estado final no deja `transform` ni `will-change`. No se anida, y no se aplica al hero, a `#home-descripcion` ni a `#contacto`. `disabled` se usa para no repetir la animación al paginar o filtrar (`Explore`) ni al cambiar columnas (galería). Usan `Reveal`: Home, About (tarjetas `as="li"`), Cookies, NotFound, Explore y la galería. Las privadas no lo usan: llevan `animate-page-fade` en su contenedor.

### ButtonPrincipal
Botón primario (relleno `brand`, texto `ink`, hover `brand-dark`). Exporta las clases `BUTTON_PRINCIPAL_CLASS` y `BUTTON_INACTIVE_CLASS` para los `Link` con aspecto de botón (los CTA de `Home`) y para el botón de envío de `ContactForm`.

| Prop | Descripción |
|---|---|
| `text` | Texto |
| `onClick` | Acción |
| `icon` | Si está presente, pinta un botón cuadrado de 48×48 (`text-brand-dark`, hover `bg-brand text-ink`) con el icono de Material Symbols y sin texto |
| `className`, `disabled` | Estilo extra y estado desactivado transitorio (el navegador lo saca del orden de Tab). Con texto, `disabled` usa `BUTTON_INACTIVE_CLASS`: la misma forma, borde discontinuo `moss`, sin relleno, `text-moss` y `cursor-not-allowed`, sin `hover` ni `opacity-50` (también en las privadas). En la rama de icono usa `ICON_BUTTON_INACTIVE_CLASS` (`h-12 w-12`, `border-2 border-dashed border-moss text-moss`, sin `hover:`), también sin `opacity-50` (B60 cerrado) |
| `inactive` | Estado inactivo **que se explica por teclado**: `aria-disabled="true"` sin `disabled` nativo, así que el botón recibe el foco con Tab, el clic hace `preventDefault` y no llama a `onClick`, y puede enlazarse con `aria-describedby` (llega por `...rest`) a un texto visible que explica el motivo (máximo de destinatarios, último destinatario). Mismas clases inactivas que `disabled` en las dos ramas. Precedente: «Enviar» de `ContactForm` |
| `ariaLabel` | Nombre accesible; solo se aplica en la rama `icon`. La ligadura lleva `aria-hidden="true"` |
| `type` | `"button"` por defecto; quien envíe un formulario pasa `type="submit"` |
| `loading` | `aria-busy` y `aria-disabled` (no `disabled`, para no perder el foco), el clic se ignora y se muestra el icono `progress_activity` |
| `...rest` | Llega al `<button>` (`id`, `aria-expanded`, `aria-controls`...) |

Con texto: `min-h-12 min-w-[84px] max-w-full`, sin `truncate`. Desaparecen `dropdownOptions`, `onOptionSelect` y el modo desplegable. Las dos ramas llevan `focus-ring`.

### ButtonAlternative
Botón secundario: `border-2 border-brand-dark bg-surface text-brand-deep`, hover `bg-brand text-ink`, mismo tamaño y tipografía que `ButtonPrincipal`; exporta `BUTTON_ALTERNATIVE_CLASS` (el CTA «Galería» de `Home`). Deshabilitado usa `BUTTON_INACTIVE_CLASS` (importada de `ButtonPrincipal`: borde discontinuo `moss`, texto `moss`, sin `opacity-50` ni `hover`). Props: `text`, `onClick`, `className`, `type` (`"button"` por defecto), `disabled`, `loading` y `...rest`. Ya no tiene modo desplegable ni chevrons.

### DialogAdvice
Modal de aviso o confirmación, animado. El título es un `<h2>` (antes `<h3>`: saltaba un nivel bajo el `<h1>` de las páginas, A7).

| Prop | Descripción |
|---|---|
| `dialogTitle`, `dialogMessage` | Contenido |
| `dialogDetails` | `{ title, content }` opcional, en un `<details>` plegable |
| `showActions` | `true` → botones Confirmar y Cancelar; `false` → solo Cerrar |
| `variant` | Variante de `noticeStyles` del icono y el borde (por defecto `info`). Las confirmaciones de `FileUpload` (campos vacíos, «¿continuar?», que no es un borrado), `ImageGalleryManager`, `TermsManager` y `DataManagement` pasan `variant="warning"`: icono y borde naranja `warning`, también en las páginas privadas (cambio visible previsto, 12/11/2026) |
| `dialogMessage` (ajuste) | El `<p>` del mensaje lleva `whitespace-pre-wrap [overflow-wrap:anywhere]`: es un hijo flex y `break-words` no le basta; un correo de 254 caracteres sin espacios no desborda el diálogo a 320 px (medido por el orquestador) |
| `confirmText` | Texto del botón de confirmar (por defecto `dialogAdvice.confirmButton`; el borrado usa `dialogAdvice.deleteButton`, «Eliminar») |
| `onConfirm`, `onClose` | Acciones. Clic en el fondo = `onClose` |

Se usa junto con el hook `useDialog` dentro de `<AnimatePresence>`. Solo sirve para confirmar el borrado de una versión, un término, una imagen o un destinatario (con el nombre en el mensaje) y la decisión sobre campos vacíos de `FileUpload`; el resto de avisos van por `ToastProvider` o `InlineError`. El título es `text-brand-deep`.

**Accesibilidad (A6):** la caja interior es `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (el `h3` del título, con `useId`) y `tabIndex={-1}`. Llama a `useDialogFocus(useIsPresent(), onClose)`: mientras el diálogo sale de pantalla se desactivan el listener y la trampa y el foco vuelve a quien abrió. Escape equivale a cancelar: llama a `onClose`, nunca a `onConfirm`.

### ToastProvider
Proveedor de avisos (`src/components/ToastProvider.js`; el contexto y el hook están en [`useToast`](06-utilidades-hooks-config.md#usetoast-srchooksusetoastjs)). Envuelve `App` y monta **siempre** dos regiones dentro de un contenedor `fixed top-20 z-[55]`: `role="status"` (éxitos) y `role="alert"` (errores). Cada aviso lleva icono `aria-hidden`, texto y un botón de cerrar de 44×44 (`feedback.close`). El éxito se cierra solo a los 8 s y el contador se para con el ratón encima o el foco dentro y reinicia al salir (WCAG 2.2.1); los errores no tienen temporizador y se quedan hasta cerrarlos. Sin animación y nunca mueve el foco. Al estar las regiones siempre montadas, los tests no deben usar `getByRole('alert' \| 'status')` sin filtro: comprueban el texto y su región con `closest` o `within`.

### InlineError
`InlineError({ id, announce = true, children })`: un `<p>` con `role="alert"` (con `announce={false}` sin `role`, para que lo lea el foco por `aria-describedby` o un resumen aparte y no se anuncie dos veces) con `NOTICE_BASE` y la variante `error` de `noticeStyles` (borde y texto `danger`, sobre `surface`) y el icono `error` en `aria-hidden`; sin prop de variante. El campo se asocia con `aria-invalid` y `aria-describedby={id}` y el foco va al campo solo cuando la validación falla.

### InfoButton
Icono `info` (`text-moss`) que muestra un tooltip al pasar el ratón, al enfocar o al pulsar (el clic lo muestra; no alterna). La caja del tooltip usa `NOTICE_BASE` y la variante `info` (borde `moss`, sobre `surface`, con el icono `info` delante del texto) más `text-left text-sm shadow-lg`. Props: `tooltipText` y `topic` (opcional). Con `topic` el `aria-label` es `iconButton.infoAbout` («Información: {{topic}}»), con el título o la etiqueta visible de al lado (así una página con varios «i» no repite el nombre); sin `topic` se queda en `iconButton.info` (`Explore`). `adjustTooltipPosition()` (en `useLayoutEffect` y en `resize` mientras se ve) mide el tooltip y lo desplaza en horizontal para que quede entre 16 px y `innerWidth − 16`; si su borde inferior pasa de `innerHeight` (menos 72 px bajo 768 px, por la barra inferior) y cabe encima, lo coloca encima. El botón es `type="button"`, de 44×44 (`h-11 w-11 shrink-0`), con `aria-describedby` hacia el tooltip y `focus-ring`; el icono `info` va en un `<span aria-hidden="true">`. El `id`, el `role="tooltip"` y `hidden` están en una envoltura transparente (`top-full pt-2`, o `bottom-full pb-2` encima; sin `mt-2`; `w-max max-w-[min(28rem,calc(100vw-2rem))]`, sin `min-w-*`) y la caja visible (borde `sage`, `bg-surface`, sombra) es un `<span>` interior: el hueco con el botón forma parte del tooltip y no dispara `onMouseLeave`. Escape lo oculta mientras se ve (WCAG 1.4.13). Medido en local con API simulada (11/11/2026): 7 usos con `aria-label` distinto («Information: Choose the dataset», «…Non-Latinisms Exception», «…Gallery management», «…Select files»), de 44×44 px, y el tooltip dentro del viewport a 1440, 768 y 390 px (a 390 px: `left` 31 y `right` 374 con `clientWidth` 375).

### LoadSpinner
Props `label` e `inline` (falso por defecto). Por defecto, capa a pantalla completa semitransparente con un círculo girando (`animate-spin`) en `role="status"` y un texto `sr-only` (`label` o `feedback.loading`). Con `inline` es un `div role="status"` de línea que quien lo usa deja **siempre montado** con `label` vacío en reposo (sin spinner); con texto, muestra el círculo y el texto. No es un skeleton.

### Switch
Interruptor sobre un checkbox con estilos de `styled-components`. Props: `checked` y `onChange`.

### ScrollIndicator
Flecha del hero de `Home`: ya no es fija ni rebota. Prop `targetId`: al pulsarla lleva a esa sección con `scrollIntoView` (`behavior: 'auto'` si el sistema pide movimiento reducido, `useReducedMotion()`) y **enfoca el destino** (`focus({ preventScroll: true })`): la sección `home-descripcion` lleva `tabIndex={-1}` y `.focus-heading`, así el siguiente Tab continúa desde allí. Va **en el flujo** del hero (`flex justify-center`), sin `fixed` ni `absolute` y sin el hook `UseAtBottom` (retirado). Botón de 48×48 con icono `text-surface`, `aria-label` `iconButton.scrollDown`, la ligadura en `aria-hidden` y `focus-ring`.

### ImageComponent
Imagen o fondo a partir de una URL directa o de una clave de S3.

| Prop | Descripción |
|---|---|
| `directUrl` | URL que se usa tal cual (lo habitual, con `assetUrl`) |
| `imageKey` | Si no hay `directUrl`, pide `GET /get-image?imageKey=` (con `encodeURIComponent`) y usa `imageUrl`. Sin `imageKey` no llama a la API |
| `isBackground` | Pinta un `div` con fondo y un velo uniforme `ink` al 70 % (`rgba(12, 24, 17, 0.7)`: un estilo en línea no admite clases; `theme.test.js` comprueba que es `ink` al 0,7). Ya no lleva `background-attachment: fixed` ni `min-height` propia: la altura la da quien lo usa (el hero de `Home`, `min-h-[calc(100svh-4rem)]`) |
| `className`, `children` | Estilo y contenido (solo en modo fondo) |
| `alt`, `width`, `height`, `loading` | Solo en modo imagen (`<img>`): `alt` vacío por defecto (decorativa; antes `alt="Imagen"`), y la caja reservada y la carga diferida las decide quien lo usa (`About` no usa `lazy`: está en la primera pantalla) |

### EmptyState
`EmptyState({ title, children, action, role })`: estado vacío o de error de una página. Un `<div max-w-prose>` con el título en `<h2 text-xl font-bold text-brand-deep>`, la causa en un párrafo `text-base text-ink-soft` y, como mucho, una acción debajo. Solo admite `role="alert"` (el estado de error, que sí es un aviso); los casos vacíos van sin rol y cualquier otro valor se ignora. Lo usan `Explore` (error, sin datos y sin resultados con «Quitar filtros») y `VegetationGallery` (error con «Reintentar» y vacío). Sin ilustraciones.

### LogoLink
`LogoLink({ href, src, alt })`: logo institucional como enlace externo (`target="_blank"`, `rel="noopener noreferrer"`, `focus-ring`, caja `h-16 w-32` con la imagen `object-contain`, `width`/`height` reservados y `loading="lazy"`). El nombre accesible sale del `alt` (`institutions.<id>`) y un `<span class="sr-only">` añade «(se abre en una pestaña nueva)» (`a11y.opensInNewTab`). Lo usan `Footer` y `Home`; los datos de cada logo, `config/institutions.js`. Todas las direcciones son `https`.

---

## Sin uso

### ImageCarrousel
Carrusel infinito con imágenes de `VITE_CAROUSEL_IMAGE_KEYS` (vía `GET /get-image`, con la clave codificada con `encodeURIComponent`) o, si no hay, de `via.placeholder.com`. Solo aparece comentado en `Explore`.

### UploadButton
Prototipo antiguo de subida con `alert()` que no envía nada. Se puede borrar.
