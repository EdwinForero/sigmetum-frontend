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
**Efecto:** al montar sustituye el `href` del `<link rel="icon">` por el logo de S3.

### Navbar
Menú principal. `menuItems`: Inicio (`/`), Explorar (`/explorar`), Galería (`/galeria`) y Sobre nosotros (`/sobre-nosotros`).
- Escritorio (`md+`): lista horizontal; la ruta activa aparece con fondo verde.
- Móvil: botón con icono `Menu` que abre un desplegable.

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

Las opciones con `link` se pintan como `<Link>` y las que tienen `component` abren el panel (`motion.div` que entra desde `x: -100%`).

### ErrorBoundary
Componente de clase. `getDerivedStateFromError` activa `hasError`, `componentDidCatch` escribe el error en consola y el render muestra "Algo salió mal" con un botón para recargar. Envuelve toda la aplicación en `index.js`.

### ProtectedRoute
Guardia de las rutas privadas.

| Prop | Descripción |
|---|---|
| `element` | Página que se muestra si hay sesión válida |

| Estado / función | Descripción |
|---|---|
| `isAuthenticated` | `null` (comprobando, muestra el spinner), `true` o `false` |
| `showDialog` | Aviso de sesión caducada |
| `isTokenExpired(token)` | Decodifica el JWT con `jwt-decode` y compara `exp` con la hora actual. Si no se puede decodificar, devuelve `true` |
| `checkAuth()` | Sin token → `false`. Con token → `GET /auth`; si responde y el token ha caducado muestra el aviso, si no `true`. Si la llamada falla → `false` |
| `handleCloseDialog()` | Borra el token y marca como no autenticado, lo que redirige a `/login` |

### CookieBanner
Banner de consentimiento y modal de configuración.

| Estado / función | Descripción |
|---|---|
| `isVisible` | Se muestra si `document.cookie` no contiene `cookieConsent=accepted` |
| `isModalOpen` | Modal de configuración abierto |
| `cookiePreferences` | `{ all, advertising, advertisingTracking, functionality, personalization, security }` |
| `handleAccept()` | Guarda `cookieConsent=accepted` y `cookiePreferences=<JSON>` durante un año |
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

**Estado:** `searchText`. **Cálculo:** `filteredItems = SortItemsList(items que contienen searchText)`.

### FilterSearchBar
Campo de búsqueda con icono de lupa.
Props: `placeholderText`, `value`, `onChange`. Es un campo controlado: muestra siempre `value`.

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
| `filteredSpecies` | Registros de `data` cuyo `Especies Características` incluye esta especie |
| `uniqueAttributes` | Por cada atributo (provincia, municipio, altitud media, sector biogeográfico, piso bioclimático, ombrotipo, naturaleza del sustrato, tipo de serie, serie de vegetación y vegetación potencial), los valores únicos ordenados con `SortItemsList` y unidos por comas |
| `formattedQuery` | Nombre codificado para el enlace `https://www.ipni.org/?q=...` |
| `highlightTerms` | La misma utilidad compartida que usa `SpeciesCard` |

Muestra el título con cursivas, un `SpeciesAttribute` por atributo, el botón "Cerrar" y el enlace "Leer más" a IPNI. Se cierra al pulsar fuera.

### SpeciesAttribute
Bloque `<details>` abierto con título y lista. Si `description` es una cadena, la divide por comas y pinta un párrafo en cursiva por valor.

### Table
Tabla paginada genérica.
Props: `data` (`Array<Registro>`) y `rowsPerPage` (5 por defecto).
Las columnas salen de las claves del primer registro y se traducen con `attributes.<col>`. Los valores array se muestran uno por línea. **Estado:** `currentPage`.

### Pagination
Botones anterior/siguiente con el texto "Página X de Y".
Props: `currentPage`, `totalPages` y `onPageChange('prev' | 'next')`. Desactiva los extremos.

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
Formulario de carga múltiple de Excel o CSV.

| Prop | Descripción |
|---|---|
| `onLoad(bool)` | Controla el spinner de la página |

| Estado / función | Descripción |
|---|---|
| `files` | Archivos en cola |
| `normalizeFileName(name)` | Quita acentos (NFD) y cualquier carácter que no sea `[a-zA-Z0-9-_]` del nombre, conservando la extensión |
| `handleFileSelect(e)` | Añade archivos evitando duplicados (mismo nombre y tamaño) y vacía el `<input>` para poder volver a elegir el mismo |
| `handleRemoveFile(i)` | Quita un archivo de la cola |
| `handleSubmit()` | Sube los archivos **uno a uno** con `POST /upload`. Si hay campos vacíos (400 con `emptyFields`), pregunta al usuario y confirma con `POST /upload/confirm`. Cualquier otro error detiene el bucle y muestra un aviso. Si todos suben bien, muestra el éxito y vacía la cola |

Si el usuario cancela o cierra el diálogo de confirmación, se envía `confirmed: false`, se detiene la cola y no se muestra el éxito. Ver el diagrama en [01-arquitectura.md](01-arquitectura.md#flujo-de-subida-de-datos-api-v2).

### TermsManager
Gestión de términos que no se escriben en cursiva.

| Estado / función | Descripción |
|---|---|
| `term`, `terms`, `isLoading`, `isError` | Campo de texto, lista, carga y error |
| `fetchTerms()` | `GET /list-terms` |
| `handleAddTerm()` | Comprueba que no esté vacío ni repetido (sin distinguir mayúsculas), hace `POST /upload-term` y recarga |
| `handleDeleteTerm(term)` | `DELETE /delete-term` y recarga |
| `renderList()` | Spinner, error, vacío o lista ordenada con papelera |

### ImageGalleryManager
Gestión de las imágenes de la galería.

| Estado / función | Descripción |
|---|---|
| `imageTitle`, `imageFile`, `images` | Título, archivo elegido y lista actual |
| `fetchImageUrls()` | `GET /list-images` |
| `handleFileChange(e)` | Guarda el archivo elegido (JPEG, PNG, GIF o WebP) |
| `handleImageUpload()` | Exige título y archivo, envía `POST /upload-image` (multipart `file` + `title`) y recarga. No limpia el formulario al terminar |
| `deleteImage(fileName)` | `DELETE /delete-image { imageKey: fileName }` y recarga |

### LoginForm
| Estado / función | Descripción |
|---|---|
| `username`, `password`, `showPassword`, `showLoginError` | Campos, mostrar u ocultar contraseña y error |
| `handleLogin()` | `POST /log`. Si va bien, guarda el token y navega a `/cargar-archivos`; si no, muestra el error |

---

## Formularios y contacto

### ContactForm
Formulario de contacto (nombre, email, asunto y mensaje).
**Prop:** `onLoad(bool)`. **Función:** `handleSubmit(e)` hace `POST /send-email` y muestra un diálogo de éxito o error. El botón se desactiva si falta algún campo. No valida el formato del email más allá de `type="email"`.

### EmailContactGrid
Lee `home.emailsData`, una cadena con el formato `Nombre / email / Nombre / email ...`, la divide por `/` en pares `{ name, email }` y los muestra en dos columnas con enlaces `mailto:`.

### TextInput
Campo de texto con el estilo del proyecto. Props: `placeholderText`, `value` y `onChange`. Es un campo controlado: muestra siempre `value`.

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

### ButtonAlternative
Botón secundario (borde verde). Tiene las mismas props que `ButtonPrincipal` (sin `disabled`), más `getButtonText(option)` para personalizar el texto en modo desplegable. `LanguageSwitcher` lo usa así.

### DialogAdvice
Modal de aviso o confirmación, animado.

| Prop | Descripción |
|---|---|
| `dialogTitle`, `dialogMessage` | Contenido |
| `dialogDetails` | `{ title, content }` opcional, en un `<details>` plegable |
| `showActions` | `true` → botones Confirmar y Cancelar; `false` → solo Cerrar |
| `onConfirm`, `onClose` | Acciones. Clic en el fondo = `onClose` |

Se usa junto con el hook `useDialog` dentro de `<AnimatePresence>`.

### InfoButton
Icono `info` que muestra un tooltip al pasar el ratón o al pulsar. `adjustTooltipPosition()` lo alinea a la izquierda, al centro o a la derecha para que no se salga de la pantalla. Prop: `tooltipText`.

### LoadSpinner
Capa a pantalla completa semitransparente con un círculo girando (`animate-spin`).

### Switch
Interruptor sobre un checkbox con estilos de `styled-components`. Props: `checked` y `onChange`.

### ScrollIndicator
Flecha fija que rebota en la parte inferior. Al pulsarla baja una pantalla (`scrollBy`) y se oculta al llegar al final (hook `UseAtBottom`).

### ImageComponent
Imagen o fondo a partir de una URL directa o de una clave de S3.

| Prop | Descripción |
|---|---|
| `directUrl` | URL que se usa tal cual (lo habitual, con `assetUrl`) |
| `imageKey` | Si no hay `directUrl`, pide `GET /get-image?imageKey=` y usa `imageUrl` |
| `isBackground` | Pinta un `div` con fondo, capa oscura al 70 %, `background-attachment: fixed` y `min-height: 95vh` |
| `className`, `children` | Estilo y contenido (solo en modo fondo) |

---

## Sin uso

### ImageCarrousel
Carrusel infinito con imágenes de `VITE_CAROUSEL_IMAGE_KEYS` (vía `GET /get-image`) o, si no hay, de `via.placeholder.com`. Solo aparece comentado en `Explore`.

### UploadButton
Prototipo antiguo de subida con `alert()` que no envía nada. Se puede borrar.
