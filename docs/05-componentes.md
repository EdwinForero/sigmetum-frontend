# 05. Componentes

Todos están en `src/components/`. Son componentes funcionales (salvo `ErrorBoundary`) con estilos Tailwind en línea.

Índice por grupo:

- **Estructura:** [Header](#header) · [Navbar](#navbar) · [LanguageSwitcher](#languageswitcher) · [Footer](#footer) · [Sidebar](#sidebar) · [ErrorBoundary](#errorboundary) · [ProtectedRoute](#protectedroute) · [CookieBanner](#cookiebanner)
- **Explorador y datos:** [Filter](#filter) · [CategoryFilter](#categoryfilter) · [FilterSearchBar](#filtersearchbar) · [SpeciesCard](#speciescard) · [DialogSpecies](#dialogspecies) · [SpeciesAttribute](#speciesattribute) · [Table](#table) · [Pagination](#pagination) · [FileDropdown](#filedropdown)
- **Administración:** [FileUpload](#fileupload) · [TermsManager](#termsmanager) · [ImageGalleryManager](#imagegallerymanager) · [LoginForm](#loginform)
- **Formularios y contacto:** [ContactForm](#contactform) · [EmailContactGrid](#emailcontactgrid) · [TextInput](#textinput)
- **Elementos básicos:** [ButtonPrincipal](#buttonprincipal) · [ButtonAlternative](#buttonalternative) · [DialogAdvice](#dialogadvice) · [InfoButton](#infobutton) · [LoadSpinner](#loadspinner) · [Switch](#switch) · [ScrollIndicator](#scrollindicator) · [ImageComponent](#imagecomponent)
- **Sin uso:** [ImageCarrousel](#imagecarrousel) · [UploadButton](#uploadbutton)

---

## Estructura

### Header
Barra superior fija (`h-16`, `z-50`). Contiene el logo de S3 con enlace a `/`, el texto "SIGMETUM-A" con letras de colores, `LanguageSwitcher` y `Navbar`.
Sin efectos: no toca el favicon. Este sale ya correcto del HTML compilado (plugin de `vite.config.js`, ver [06](06-utilidades-hooks-config.md#favicon-viteconfigjs-y-faviconhtml)); `ASSETS.LOGO` y `assetUrl` solo se usan aquí para el `<img>` del logo.

### Navbar
Menú principal. `menuItems`: Inicio (`/`), Explorar (`/explorar`), Galería (`/galeria`) y Sobre nosotros (`/sobre-nosotros`).
- Escritorio (`md+`): lista horizontal; la ruta activa aparece con fondo verde.
- Móvil: botón con icono `Menu` (`ButtonPrincipal` con `ariaLabel` `iconButton.menu`) que abre un desplegable.

| Estado / función | Descripción |
|---|---|
| `showDropdown` | Desplegable móvil abierto |
| `toggleDropdown()`, `closeDropdown()` | Abrir o cerrar |
| Efecto | Cierra al hacer clic fuera (`mousedown` en `document`, solo mientras está abierto) |

### LanguageSwitcher
Selector ES/EN construido sobre `ButtonAlternative` en modo desplegable.

| Estado / función | Descripción |
|---|---|
| `language` | `'ES'` o `'EN'`, inicializado desde `i18n.language` |
| `dropdownOptions` | `[{ label, value }]`, que se regenera al cambiar `t` |
| `changeLanguage(option)` | Llama a `i18n.changeLanguage('es' \| 'en')`. El detector lo guarda en `localStorage` |
| `getButtonText(option)` | Muestra `option.value` (`ES`/`EN`) en el botón |

### Footer
Enlaces a Inicio, Explorar, Sobre nosotros y Cookies, y el copyright con el año actual (`footer.copyright` con `{currentYear}`).

### Sidebar
Barra lateral de iconos con un panel deslizante.

| Prop | Tipo | Descripción |
|---|---|---|
| `menuOptions` | `Array<{ id, name, icon, link?, component? }>` | Opciones definidas en `App` |
| `exploreData` | `Array \| null` | Si es `null` en `/explorar`, se oculta el filtro |
| `managementData` | `Array` | Se recibe pero no se usa |

| Estado / función | Descripción |
|---|---|
| `exclusions` | Mapa ruta → ids ocultos. Por ejemplo, en `/explorar` solo se ve `filter` |
| `filteredMenuOptions` | Opciones visibles en la ruta actual |
| `activeComponent`, `isOverlayVisible` | Qué `component` se muestra en el panel y si está abierto |
| `handleButtonClick(id)` | Abre el panel con el componente de esa opción |
| `handleOverlayClick()` | Cierra el panel (clic en el fondo o en el botón `Close`) |

Las opciones con `link` se pintan como `<Link>` y las que tienen `component` abren el panel (`motion.div` que entra desde `x: -100%`). Los botones de icono llevan `ariaLabel` con el `name` de la opción y el de cerrar con `iconButton.close`. El panel **no** cumple A6 (sin `role="dialog"`, foco atrapado ni Escape): deuda anotada en `docs/09`.

### ErrorBoundary
Componente de clase. `getDerivedStateFromError` activa `hasError`, `componentDidCatch` escribe el error en consola y el render muestra "Algo salió mal" con un botón para recargar. Envuelve toda la aplicación en `index.js`.

### ProtectedRoute
Guardia de las rutas privadas.

| Prop | Descripción |
|---|---|
| `element` | Página que se muestra si hay sesión válida |

| Estado / función | Descripción |
|---|---|
| `status` | `'checking'` (spinner), `'ok'`, `'denied'` (redirige a `/login`) o `'unavailable'` |
| `checkAuth()` | Sin `getAccessToken()` → `denied`. Con token → `api.getAuth('/auth')` (con los reintentos del `503` de `api.js`): si responde, `ok`; solo un `401` (`error.type === 'http'`, tras la renovación de `api.js`) da `denied`; cualquier otro error (red, `403`, `5xx`, `503` agotado, `auth_unavailable` de la renovación) da `unavailable` sin borrar tokens ni redirigir. Ignora la respuesta si el componente se desmonta. Bajo `React.StrictMode` (desarrollo) el efecto corre dos veces y hace dos `GET /auth` |
| `unavailable` | `<div role="alert">` con un `<h1>` (`login.title`, reutilizado **(por confirmar)** si es el título deseado), el texto `login.serviceUnavailable` un botón `login.retryButton` que vuelve al spinner y repite `GET /auth`, y un botón `login.logOutButton` que cierra la sesión (`api.logout()`, deshabilitado mientras dura la revocación), para no dejar al usuario sin salida si el servicio no se recupera |
| `denied` | `<Navigate to="/login" replace />`: no deja la ruta protegida en el historial |
| `ok` | Un botón `login.logOutButton` (`ButtonPrincipal`, con texto, sin necesidad de `aria-label`) que llama a `api.logout()` (se deshabilita mientras dura la revocación, hasta 3 s), encima del `element`. Es el único control de cierre de sesión, en todas las rutas privadas |

Ya no decodifica el JWT ni comprueba `exp` (se retiraron `jwt-decode`, `isTokenExpired` y el diálogo `tokenExpiration.*`). No toca el almacenamiento directamente: usa `getAccessToken` y `api.logout` (que borra la sesión, revoca el token de refresco y va a `/`), aunque `npm run quality` sigue permitiéndole `localStorage`.

### CookieBanner
Banner de consentimiento y modal de configuración.

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
Una categoría del filtro: cabecera plegable, botón "Limpiar", buscador y lista de casillas.

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
Campo de búsqueda con icono de lupa.
Props: `placeholderText`, `value`, `onChange`. Es un campo controlado: muestra siempre `value`. El `input` lleva `focus-ring-inset` (anillo hacia dentro: el `label` envolvente tiene `overflow-hidden` y recortaría el exterior); el `label` ya no lleva clases de foco, porque no recibe foco.

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
Props: `data` (`Array<Registro>`) y `rowsPerPage` (5 por defecto).
Las columnas son la unión de las claves de todos los registros, en orden de primera aparición (no muta `data`), y se traducen con `attributes.<col>`. Los valores array se muestran uno por línea. **Estado:** `currentPage`.

### Pagination
Botones anterior/siguiente con el texto "Página X de Y".
Props: `currentPage`, `totalPages` y `onPageChange('prev' | 'next')`. Desactiva los extremos. Los dos botones de icono llevan `ariaLabel` (`iconButton.previousPage` y `iconButton.nextPage`).

### FileDropdown
Selector de dos columnas (provincia → versión) para "Administrar datos". Se crea con `forwardRef`.

| Prop | Descripción |
|---|---|
| `onLoad(bool)` | Controla el spinner del padre |
| `onFileSelect(jsonData, key)` | Entrega los registros de la versión elegida |
| `selectedFile` | `key` seleccionada (para resaltarla) |

| Estado / función | Descripción |
|---|---|
| `files` | `{ provincia: [{ key, name }] }` |
| `provinces`, `selectedProvince`, `versions` | Columnas del desplegable |
| `name` | Nombre del archivo elegido (se muestra formateado con `FormatFileName`) |
| `isOpen`, `isError` | Visibilidad y error de carga |
| `fetchFiles()` | `GET /list-files`. **Se expone al padre** con `useImperativeHandle` |
| `handleProvinceSelect(p)` | Muestra las versiones de la provincia |
| `handleVersionSelect(key, name)` | `GET /get-data/<key>` y llama a `onFileSelect` |
| Efecto de coherencia | Si la versión seleccionada ya no existe en `files` (por ejemplo, tras borrarla), limpia la selección |
| Efecto de clic fuera | Cierra el desplegable |

---

## Administración

### FileUpload
Formulario de carga múltiple de Excel (el selector acepta solo `.xlsx`).

| Prop | Descripción |
|---|---|
| `onLoad(bool)` | Controla el spinner de la página |

| Estado / función | Descripción |
|---|---|
| `files` | Archivos en cola |
| `normalizeFileName(name)` | Quita acentos (NFD) y cualquier carácter que no sea `[a-zA-Z0-9-_]` del nombre, conservando la extensión |
| `handleFileSelect(e)` | Añade archivos evitando duplicados (mismo nombre y tamaño) y vacía el `<input>` para poder volver a elegir el mismo |
| `handleRemoveFile(i)` | Quita un archivo de la cola |
| `handleSubmit()` | Sube los archivos **uno a uno** con `POST /upload`. Si hay campos vacíos (400 con `emptyFields`), pregunta al usuario y confirma con `POST /upload/confirm`. Un `404` al confirmar muestra `dialogAdvice.errorDraftNotFound` y detiene el bucle (se interpreta solo por el estado, sin leer el texto). Cualquier otro error detiene el bucle y muestra un aviso. Si todos suben bien, muestra el éxito y vacía la cola |

Si el usuario cancela o cierra el diálogo de confirmación, se envía `confirmed: false`, se detiene la cola y no se muestra el éxito. Se comprueba la respuesta de cancelar: `404` muestra `errorDraftNotFound` y otro fallo `errorUploadMessage`; en ambos no se vacía `files` (se puede reintentar). Usa `api.postFormAuth` y `api.postAuth`: no lee el token y un `401` (en `/upload`, al confirmar o al cancelar) redirige a `/login`, cosa que hace `api.js`; el componente solo lo reconoce para no abrir el diálogo de error ni vaciar la cola. Un fallo reintentable de Cognito al renovar (`type: 'auth_unavailable'`, `status: 503`; la sesión se conserva) no es un `401`: muestra el diálogo de error (`errorUploadMessage`) en lugar de cortar en silencio. El `404` de `/upload/confirm` se interpreta por estado: cualquier `404` en esa ruta se muestra como "el borrador ya no existe". Ver el diagrama en [01-arquitectura.md](01-arquitectura.md#flujo-de-subida-de-datos-api-v2).

### TermsManager
Gestión de términos que no se escriben en cursiva.

| Estado / función | Descripción |
|---|---|
| `term`, `terms`, `isLoading`, `isError` | Campo de texto, lista, carga y error |
| `fetchTerms()` | `GET /list-terms` |
| `handleAddTerm()` | Comprueba que no esté vacío ni repetido (sin distinguir mayúsculas), hace `POST /upload-term` y recarga |
| `handleDeleteTerm(term)` | `DELETE /delete-term` y recarga |
| `renderList()` | Spinner, error, vacío o lista ordenada con papelera (`aria-label` `iconButton.delete`, `focus-ring`, ligadura en `aria-hidden`). El botón de añadir usa `ariaLabel` `iconButton.add`. **Deuda:** la línea que ordena `terms` no copia el array y muta el estado (anotado en `docs/09`) |

### ImageGalleryManager
Gestión de las imágenes de la galería.

| Estado / función | Descripción |
|---|---|
| `imageTitle`, `imageFile`, `images` | Título, archivo elegido y lista actual |
| `fetchImageUrls()` | `GET /list-images` |
| `handleFileChange(e)` | Guarda el archivo elegido (JPEG, PNG, GIF o WebP) |
| `handleImageUpload()` | Exige título y archivo, rechaza un título con `/`, `\`, `..`, caracteres de control o `, ' : & # ? % "` (aviso `dialogAdvice.adviceInvalidImageTitle`, sin petición; sin tope de longitud), envía `POST /upload-image` (multipart `file` + `title`) y recarga. No limpia el formulario al terminar |
| `deleteImage(fileName)` | `DELETE /delete-image { imageKey: fileName }` y recarga |

### LoginForm
Formulario propio de acceso con SRP contra Cognito. Solo pinta: la lógica es de [`useCognitoLogin`](06-utilidades-hooks-config.md#acceso-con-cognito-srchooksusecognitologinjs) y nunca toca tokens (los guarda `api`). Si el componente se desmonta durante `signIn`, `api` guarda igualmente los tokens y la persona queda con sesión abierta sin navegar (B28 en [09](09-estado-actual-y-deuda-tecnica.md)). Al autenticarse navega a `/cargar-archivos` con `replace`.

| Estado / función | Descripción |
|---|---|
| `email`, `password`, `newPassword`, `confirmation`, `code` | Campos controlados. La contraseña, la nueva, la confirmación y el código se vacían al terminar cada petición (en un `finally`) |
| `handleSubmit(event)` | `event.preventDefault()` en la primera línea y, según el paso, `signIn`, `submitNewPassword`, `confirmMfaSetup` o `submitTotp` del hook |
| `copySecret()` | Copia el secreto con `navigator.clipboard.writeText`; el resultado se anuncia en el `role="status"` (`login.copied` o `login.copyFailed`) |
| Foco | Al entrar en un reto, al `<h2>` del paso (`tabIndex={-1}`); al volver a credenciales, al correo; tras un error, a un campo: en credenciales, el primer campo vacío (el valor se lee del DOM porque el estado de la contraseña ya se vació), en los demás pasos el primero. En `mfaSetup` con reintento no hay campo ni `ref` (`ButtonPrincipal` no expone `ref`): el foco no va a ningún sitio (B30 en [09](09-estado-actual-y-deuda-tecnica.md)) |
| `aria-invalid` | Solo con errores de validación (`requiredFields`, `passwordPolicyError`, `passwordMismatch`, `codeFormatError`); con «campos obligatorios», solo en los campos vacíos. Un error de red o de credenciales no marca ningún campo |
| Estructura | Tarjeta con `<h1>` (`login.title`) y un `<h2>` por reto; `<form noValidate method="post">`; cada campo con `<label htmlFor>` y un `<span id>` referenciado por `aria-labelledby`; **ningún campo lleva `name`** (el autocompletado va por `autoComplete`: `username`, `current-password`, `new-password`, `one-time-code`) y la contraseña nunca puede viajar en una URL. El error es un `<p role="alert">` con `key` (se vuelve a anunciar) referenciado por `aria-describedby`; `<p role="status">` siempre presente (`login.loading` mientras `busy`); botón `type="submit"` deshabilitado mientras `busy` |
| Paso `newPassword` | Política (`login.passwordPolicy`) en `aria-describedby`, campo `username` de solo lectura con el correo (para los gestores de contraseñas), contraseña nueva y confirmación |
| Paso `mfaSetup` | **Antes del `<form>`**: ayuda, aviso `login.mfaSetupAgain` si el secreto se generó otra vez, clave y dirección `otpauth://` como texto en `<code className="break-all">` (nunca en un `href`) y botón de copiar (fuera del `form`, solo si existe `navigator.clipboard?.writeText` y no hay reintento). Dentro del `form`: el aviso de error (queda debajo de la clave) y el campo del código. No hay enlaces |
| Reintento en `mfaSetup` | Si el hook expone `retry` (`'associate'` o `'respond'`), no se pinta secreto, ayuda, copia ni campo de código: solo el aviso `login.serviceUnavailable` y el botón `login.retryButton` en lugar de `login.verifyButton`. Si el reintento ya no es necesario (`CodeMismatch` en `respond`), vuelven la clave y el campo del código |
| Código | Antes de validar se limpia de espacios (`123 456` vale); el campo admite `maxLength={7}` por ese motivo |

---|---|
| `hasError` | `true` si `startLogin()` rechaza (falta `VITE_COGNITO_*`, no hay `crypto.subtle`...) |
| `handleLogin()` | Llama a `startLogin()` de `session.js`; un rechazo acaba en un `<span role="alert">` con `login.startError` (no hay promesa sin capturar) |
| Estructura | Sin campos, sin `api`, sin `useNavigate` y sin almacenamiento: `<h2>` con `login.title` y un `ButtonPrincipal` (botón nativo) con `login.logInButton`. Se mantiene el nombre `LoginForm` aunque ya no es un formulario |

---

## Formularios y contacto

### ContactForm
Formulario de contacto (nombre, email, asunto y mensaje).
**Prop:** `onLoad(bool)`. **Función:** `handleSubmit(e)` hace `POST /send-email` y muestra un diálogo de éxito o error: `429` usa `dialogAdvice.errorEmailRateLimit`, `400` `errorEmailInvalid` y el resto `errorEmailMessage`. Los campos limitan la longitud con `maxLength` (nombre 100, correo 254, asunto 150, mensaje 2000). El botón se desactiva si falta algún campo. No valida el formato del email más allá de `type="email"`. Las cuatro etiquetas se asocian a sus campos con `htmlFor` e `id` derivados de `useId` (únicos entre instancias). Los cuatro campos llevan `focus-ring`. El botón de enviar es `type="submit"`; el «Cerrar» de su `DialogAdvice` (dentro del `<form>`) ya no reenvía el correo porque `ButtonPrincipal` es `type="button"` por defecto.

### EmailContactGrid
Lee `home.emailsData`, una cadena con el formato `Nombre / email / Nombre / email ...`, la divide por `/` en pares `{ name, email }` y los muestra en dos columnas con enlaces `mailto:`.

### TextInput
Campo de texto con el estilo del proyecto. Props: `placeholderText`, `value` y `onChange`. Es un campo controlado: muestra siempre `value`. El `input` lleva `focus-ring-inset` (ver `FilterSearchBar`).

---

## Elementos básicos

### ButtonPrincipal
Botón primario (fondo verde).

| Prop | Descripción |
|---|---|
| `text` | Texto. Se copia a un estado interno para el modo desplegable |
| `onClick` | Acción si no hay `dropdownOptions` |
| `icon` | Si está presente, pinta un botón cuadrado con el icono de Material Symbols y sin texto |
| `dropdownOptions`, `onOptionSelect` | Modo desplegable (no se usa en esta variante) |
| `className`, `disabled` | Estilo extra y estado desactivado |
| `ariaLabel` | Nombre accesible del botón; solo se aplica en la rama `icon` (sin él, el botón de icono se anunciaría con la ligadura). La ligadura lleva `aria-hidden="true"` |
| `type` | `type` del `<button>`, `"button"` por defecto (antes era `submit` implícito); quien envíe un formulario debe pasar `type="submit"` |

Las dos ramas llevan `focus-ring`.

### ButtonAlternative
Botón secundario (borde verde). Tiene las mismas props que `ButtonPrincipal` (sin `disabled`), más `getButtonText(option)` para personalizar el texto en modo desplegable. `LanguageSwitcher` lo usa así. Lleva `focus-ring` y las ligaduras de sus chevrons con `aria-hidden="true"`.

### DialogAdvice
Modal de aviso o confirmación, animado.

| Prop | Descripción |
|---|---|
| `dialogTitle`, `dialogMessage` | Contenido |
| `dialogDetails` | `{ title, content }` opcional, en un `<details>` plegable |
| `showActions` | `true` → botones Confirmar y Cancelar; `false` → solo Cerrar |
| `onConfirm`, `onClose` | Acciones. Clic en el fondo = `onClose` |

Se usa junto con el hook `useDialog` dentro de `<AnimatePresence>`.

**Accesibilidad (A6):** la caja interior es `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (el `h3` del título, con `useId`) y `tabIndex={-1}`. Llama a `useDialogFocus(useIsPresent(), onClose)`: mientras el diálogo sale de pantalla se desactivan el listener y la trampa y el foco vuelve a quien abrió. Escape equivale a cancelar: llama a `onClose`, nunca a `onConfirm`.

### InfoButton
Icono `info` que muestra un tooltip al pasar el ratón o al pulsar. `adjustTooltipPosition()` lo alinea a la izquierda, al centro o a la derecha para que no se salga de la pantalla. Prop: `tooltipText`. El botón lleva `aria-label` `iconButton.info` y `focus-ring`; el icono `info` va en un `<span aria-hidden="true">` (el botón conserva también `material-symbols-outlined`).

### LoadSpinner
Capa a pantalla completa semitransparente con un círculo girando (`animate-spin`).

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
