# 04. Páginas

Cada página está en `src/pages/` y corresponde a una ruta (ver [01-arquitectura.md](01-arquitectura.md#rutas)).

---

## App (`src/App.js`)

No es una página, pero orquesta todas: define el layout, las rutas y el estado de datos compartido.

**Estado:** ver [01-arquitectura.md](01-arquitectura.md#estado-global-y-flujo-de-datos).

| Función | Descripción |
|---|---|
| `fetchTerms()` | `GET /list-terms` → `noItalicTerms`. Si falla, `exploreError = true`. Memorizada con `useCallback` |
| `fetchData()` | `GET /get-merged-data` → `mergedData` y `filteredSpecies`. Si falla, `exploreError = true` |
| `handleFileDropdownSelect(data)` | La llama `DataManagement` al elegir una versión: fija `filteredData` y quita el spinner |
| `handleFilterChange(filtered)` | Igual, para `filteredSpecies` en el explorador |
| `handleOnSpeciesSelect(set)` | Guarda las especies elegidas en el filtro |
| `menuOptions` | Opciones de la barra de gestión: `filter` (solo en `/explorar`; en `/administrar-datos` ya no hay panel de filtros) abre un `Filter` en un panel de filtros (diálogo modal con `aria-labelledby` hacia el `<h2>` de `Filter`, `titleId`); `dataManagement`, `contentManagement` y `uploadFiles` son enlaces. El `name` de cada opción sale de `t()` con las claves `privateNav.*` (`filters`, `data`, `content`, `upload`) y es la etiqueta visible de cada ítem |
| `showSideMenu` | `true` en `/explorar` y, en las tres rutas protegidas, solo cuando `privateSessionOk` (sesión confirmada por `ProtectedRoute`, que avisa con `onStatusChange`): muestra la barra de gestión y reserva el espacio de la barra inferior (`pb-nav md:pb-0`; desde `md` la barra es `sticky` y no necesita margen) |
| `privateSessionOk` | Estado: `ok` lo pone a `true`; `denied` y `unavailable`, a `false`; `checking` no lo cambia; salir de las rutas privadas, a `false`. Cada `ProtectedRoute` lleva `key` propia, así que cambiar de ruta privada revalida con `/auth` |
| `loadExplore()` | Carga de `/explorar` (limpia filtros y selección y pide `get-merged-data` y `list-terms` en paralelo); la usa el efecto de la ruta y el «Reintentar» de `Explore` (`onRetry`) |
| `handleClearFilters()` | Incrementa `filterResetKey`: el `Filter` se remonta y borra su selección («Quitar filtros» de `Explore`, `onClearFilters`) |
| `isPrivateRoute` | `true` en las tres rutas protegidas: es el valor de `showLogout` de `Sidebar` (el botón «Cerrar sesión» vive en la barra) |

**Estructura de la página:** `App` pinta, por este orden, un enlace «Saltar al contenido» (`skipLink`, visible solo con foco, hacia `#contenido`), `Header`, la barra de gestión (si procede), un único `<main id="contenido" tabIndex={-1}>` con las rutas, el único `<footer>` (`Footer`) y `CookieBanner`. Todo va envuelto en `MotionConfig reducedMotion="user"` y `ToastProvider` (avisos) y cada página privada tiene un `<h1>`, un `<h2>` por sección y un contenedor `mx-auto w-full max-w-6xl` (`max-w-3xl` en la carga); las páginas públicas usan `.page-container` (márgenes 16, 24 y 32 px). Ver [01](01-arquitectura.md#layout).

---

## Título de página por ruta

`App` llama una vez a `useDocumentTitle()` (ver [06](06-utilidades-hooks-config.md#usedocumenttitle-srchooksusedocumenttitlejs)), que pone `document.title` con el formato `<Página> · SIGMETUM-A` según la ruta mostrada (WCAG 2.4.2). El nombre del proyecto no se traduce; la página sí (`t()`), y el título cambia al navegar y al cambiar de idioma sin recargar.

| Ruta | Clave del título |
|---|---|
| `/` | `navbar.homeOption` |
| `/explorar` | `navbar.exploreOption` |
| `/galeria` | `gallery.title` |
| `/sobre-nosotros` | `aboutUs.title` |
| `/cookies` | `cookies.title` |
| `/login` | `login.title` |
| `/cargar-archivos` | `uploadFiles.title` |
| `/administrar-datos` | `dataManagement.title` |
| `/administrar-contenido` | `contentManagement.title` |
| Cualquier otra (404) | `notFound.title` |

El título sigue al `pathname`, no a lo que pinta `ProtectedRoute`: si una ruta protegida redirige a `/login`, el título pasa a ser el de `/login`. La comparación de rutas ignora mayúsculas y la barra final, como el enrutador.

---

## Home (`/`)

Portada del proyecto. Todo con tokens y el contenedor común `.page-container`; sin animaciones de revelado por scroll ni parallax.

| Sección | Contenido |
|---|---|
| Hero | `ImageComponent` de fondo (banner de S3, velo uniforme `ink` al 70 %) de alto `calc(100svh - 4rem)`: `<h1>` (`home.title`, 36 px y 48 px desde `md`, peso 700, sin mayúsculas forzadas), subtítulo (`<p>`), dos CTA que son enlaces (`Link`): «Explorar» con `BUTTON_PRINCIPAL_CLASS` (único botón principal relleno de la página) y «Galería» con `BUTTON_ALTERNATIVE_CLASS`; la flecha (`ScrollIndicator`, `targetId="home-descripcion"`) va dentro del hero, en el flujo |
| Descripción | `<section id="home-descripcion">` con `home.descriptionContent` sobre `bg-ink` (destino de la flecha) |
| Líder del proyecto | Logo de la UMA (`LogoLink`) con la lista de colaboradores (`COLLABORATORS`, fija en el código) |
| Otras universidades | UAL, UGR, UHU y UJA con enlace y colaboradores, en una rejilla |
| Entidades colaboradoras | EFYVE, 3D Geospace y Malagueña Forestal (todos con enlace `https`) |
| Contacto | `<section id="contacto">`: `ContactForm` y, al lado desde `md`, la lista de correos (`EmailContactGrid`) y la ubicación, cada bloque con su `<h3>` |

Los datos de los logos salen de `config/institutions.js` ([06](06-utilidades-hooks-config.md)). **Estado:** `isLoading` (spinner mientras se envía el formulario). **Funciones:** `handleOnLoad(state)` se pasa a `ContactForm` como `onLoad`. **Ancla `#contacto`:** un efecto sobre `[location.key, location.hash]` lleva la sección a la vista al montar y al pulsar de nuevo el mismo enlace (el del pie, `/#contacto`); `App` no sube al principio si hay `#ancla`. Con `/#contacto` el mismo efecto **enfoca el `<h2>` de contacto** (`tabIndex={-1}`, `.focus-heading`, `preventScroll`), para que el siguiente Tab continúe desde ese bloque; la flecha del hero (`ScrollIndicator`) enfoca igual su destino, la sección `home-descripcion` (`tabIndex={-1}` y `.focus-heading`). Cubierto por un E2E nuevo (foco con `/#contacto`).

Medido el 12/11/2026 (local, API simulada; las imágenes de S3 salen rotas en local): la flecha no se cruza con los CTA a 390×844 (es), 1440×700 (en), 1024×600 (en), 320×568 (es) y 390×667 (es), con un hueco CTA→flecha de 166, 146, 96, 24 y 77 px; a 320×568 la flecha termina 3 px por debajo del viewport (hero de 588 px), caso extremo conocido. `<h1>` a 1440 px con `x`=168 (`page-container`), 48 px y peso 700; a 390 px `x`=16 y 36 px. Contraste real del texto sobre la foto: solo se comprobó el peor caso calculado en `theme.test.js` (foto blanca con velo uniforme: `surface` sobre `ink` al 70 % cumple 4,5:1); sobre la foto real **(por confirmar)**.

---

## Explore (`/explorar`)

Explorador público de especies características. Abre con `<h1>` (`text-3xl`, `brand-deep`) y contenedor `.page-container`; el contenedor usa `min-w-0` (sin `whitespace-nowrap`) y la barra de herramientas `flex-wrap gap-2`, de modo que a 768 y 1024 px no desborda y «Descargar glosario» cabe entero. `App` normaliza la ruta quitando la barra final (`/administrar-datos/` también muestra la barra de gestión) y memoriza con `useCallback` los cuatro callbacks de `Filter`.

**Props (desde `App`):**

| Prop | Tipo | Descripción |
|---|---|---|
| `data` | `Array<Registro>` | Conjunto completo, necesario para el diálogo de detalle |
| `filteredSpecies` | `Array<Registro>` | Registros tras aplicar filtros |
| `selectedSpecies` | `Set<string>` | Especies marcadas explícitamente |
| `noItalicTerms` | `Array` | Términos que no van en cursiva |
| `hasError` | `boolean` | Estado de error de carga |
| `isLoading` | `boolean` | Carga en curso: la página pinta el `<h1>` y un `LoadSpinner inline` siempre montado (nodo `status`, con texto solo mientras carga); `App` ya no lo sustituye por un spinner a pantalla completa |
| `onRetry` | `() => void` | «Reintentar» del estado de error: repite las mismas llamadas (`loadExplore` de `App`) |
| `onClearFilters` | `() => void` | «Quitar filtros» del estado sin resultados |

**Estado:** `uniqueSpecies`, `currentPage`, `itemsPerPage`, `pageDirection` (sentido de la animación), `totalResults` (un `useMemo` sobre `data`: número de especies únicas, sin vacíos, calculado en cada cambio de `data`) y el diálogo (`useDialog`). **Corregido en la vuelta 1 (12/11/2026):** antes era un valor guardado una sola vez y, como `Explore` se monta durante la carga, el «de M» quedaba en 0; no llegó a ningún commit. Cubierto por un E2E nuevo (total «de 30»). Las tarjetas llevan `key={species}`.

| Función / efecto | Descripción |
|---|---|
| Efecto sobre `filteredSpecies`, `selectedSpecies` | Aplana `Especies Características` de todos los registros, elimina vacíos y duplicados, filtra por `selectedSpecies` si hay selección, ordena alfabéticamente sin distinguir mayúsculas ni acentos y vuelve a la página 1 |
| `calculateItemsPerPage()` | Elementos por página según el ancho: ≥1280 → 24, ≥1024 → 16, ≥768 → 12 y menos → 7. Se recalcula con `resize` |
| `handlePageChange('next' \| 'prev')` | Cambia de página dentro de los límites y fija la dirección de la animación |
| `handleDownload()` | Abre el glosario PDF (`assets/documents/glossary.pdf`) |
| `variants` | Transición horizontal entre páginas (`x: ±300`) |

**Avisos:** si `assetUrl` falla al abrir el glosario, `notifyError` (aviso persistente `role="alert"`, ya sin `DialogAdvice`). **Medida de la `x` del `<h1>`:** a 1024 y 1440 px no coincide con la de las otras páginas públicas porque la barra lateral de gestión (112 px) ocupa el lado izquierdo; la suite E2E solo exige `h1.x − main.x ≥ 0` (excepción documentada, fuera de alcance mover la barra).

**Render** (`renderContent()`, con el `<h1>` y el `LoadSpinner` siempre delante): cargando → nada más; error → `EmptyState role="alert"` con «Reintentar» (`explore.empty.errorTitle`); sin elementos y con filtros activos → `EmptyState` «Ninguna especie coincide con los filtros» con «Quitar filtros» (llama a `onClearFilters` y enfoca el `<h1>`, `tabIndex={-1}` y `.focus-heading`, porque el botón desaparece); sin elementos y sin filtros → `EmptyState` «Todavía no hay especies que mostrar»; en otro caso, cabecera con resultados, paginación, botones "Descargar glosario" y "Descargar Excel" (cada uno con su `InfoButton`) y cuadrícula de `SpeciesCard`. El test «con datos pero sin especies y sin filtros activos se trata como sin datos» no discrimina (pasaba con el código antiguo; ver [09](09-estado-actual-y-deuda-tecnica.md)).

---

## VegetationGallery (`/galeria`)

Galería en columnas con visor. `<h1>` y un `LoadSpinner inline` siempre montado (`gallery.loading` mientras carga); contenedor `.page-container`.

| Elemento | Descripción |
|---|---|
| Estado | `images`, `isLoading`, `isError`, `columns` y `viewerIndex` (el visor está abierto si no es `null`) |
| Carga | `loadImages()`: `GET /list-images`; descarta imágenes con `fileName` vacío; ignora la respuesta si el componente se desmonta (`requestRef`). «Reintentar» del estado de error la repite |
| Columnas | `columnCount(width)`: 1 bajo 640 px, 2 desde 640, 3 desde 1024 y 4 desde 1280; se recalcula con `resize` |
| Reparto | `toColumns`: **bloques contiguos**, `perColumn = ceil(N / n)`; la columna `c` recibe `images.slice(c·perColumn, (c+1)·perColumn)`. El orden del DOM, el de los datos y el de Tab coinciden (se lee bajando por cada columna) y la columna de una foto no cambia al cargar otras |
| Foto | `<li>` con `<figure>`: botón (`data-photo`, nombre `gallery.openPhoto`) con la imagen (`alt` con `photoName`, `width`/`height` 4:3, `loading="lazy"`) sobre `bg-sage-soft` y pie `text-sm text-ink` con `line-clamp-2`. Sin pulso: la caja con la proporción es el esqueleto |
| Carga (esqueleto) | Seis celdas estáticas `aria-hidden` con proporción 4:3 |
| Clave por foto | `fileName` y, solo en los repetidos, `fileName#2`, `fileName#3`… (`photoKeys`): es la `key` del `<li>`, el `data-photo` del botón y la clave del mapa de refs, para que dos fotos con el mismo nombre no compartan clave ni foco |
| URL de la imagen | Solo se pide si `isSafeImageUrl` ([06](06-utilidades-hooks-config.md)) acepta la URL (`https:`, o `http:` en `localhost` y `127.0.0.1`); si no, la caja queda vacía y no hay petición (S7) |
| Foco | Un mapa de refs por clave de foto: si cambian las columnas con el foco en una foto, el foco vuelve a ella; al cerrar el visor vuelve a la foto que lo abrió (`useEffect`, no `useLayoutEffect`, para ejecutarse después de la limpieza de `useDialogFocus`) |
| Estados | Error → `EmptyState role="alert"` con «Reintentar»; vacío → `EmptyState` (`gallery.emptyTitle`) |
| Visor | `GalleryViewer` ([05](05-componentes.md#galleryviewer)) |

Cubierto por `VegetationGallery.test.js` y por la suite E2E (orden del DOM igual al de los datos, columna estable, CLS ≤ 0,25, visor). **No comprobado:** el cambio de 768 a 1024 px con el visor abierto en un navegador real, y Safari **(por confirmar)**. Los cuatro tests de la galería que no discriminan se listan en [09](09-estado-actual-y-deuda-tecnica.md).

---

## About (`/sobre-nosotros`)

Página estática con `.page-container`: `<h1>` (`brand-deep`), texto del equipo (`max-w-prose`), la imagen de S3 (`assets/about/about-us.jpg`, decorativa con `alt=""`, caja 12:5 reservada con `width`/`height` y **sin** `loading="lazy"`, por estar en la primera pantalla) y tres tarjetas iguales (propósito, misión y valores: `<ul>` de tres `<li>` con `bg-sage-soft`, `border-sage` y un `<h2>` en `forest`, contraste 10,78:1). Ya no lleva `ScrollIndicator` ni animaciones.

---

## Cookies (`/cookies`)

Política de cookies estática, en un `<article>` con `.page-container`. Todos los textos vienen de `cookies.*` en las traducciones. Usa `<Trans>` solo para las negritas; los enlaces externos (ICO, aboutcookies.org y la ayuda de Chrome, Internet Explorer, Safari, Edge, Firefox y Opera) van en una lista «Más información» fuera de los párrafos, cada uno con `rel="noopener noreferrer"`, objetivo de 44 px y aviso de pestaña nueva. Texto a la izquierda, sin justificar, con medida de lectura (`max-w-prose`); los separadores son `border-moss`.

---

## Login (`/login`)

Contenedor centrado que renderiza `LoginForm`: formulario de correo y contraseña con los retos de Cognito (contraseña nueva, registro y código de la aplicación de autenticación). Pinta el `<h1>` con `login.title`. Ver [05-componentes.md](05-componentes.md#loginform). La página `AuthCallback` y la ruta `/auth/callback` se retiraron con el Hosted UI.

---

## FilesUpload (`/cargar-archivos`) · protegida

Contenedor `max-w-3xl` con `<h1>`, descripción y `FileUpload`, que ya no recibe `onLoad`: el progreso y los errores se muestran en la propia tarjeta (ver [05](05-componentes.md#fileupload)). Sin estado propio.

---

## DataManagement (`/administrar-datos`) · protegida

Gestión de versiones de los datos por provincia.

**Props:** `onFileDropdownSelect(data)` (de `App`) y `filteredSpecies` (los datos de la versión ya filtrados).
**Estado:** `fileName` (la `key` de la versión seleccionada), `versionLabel` (nombre legible, p. ej. «Almería 10/11/2026 · V1»), `isLoadingData`, `busyAction` (`'delete'` o `'update'`), `focusRequest`, `fileDropdownRef` (para llamar a `fetchFiles()` del selector) y el diálogo de confirmación. Los resultados van por `useToast` (éxito en `role="status"`, error en `role="alert"`).

| Función | Descripción |
|---|---|
| `handleFileSelect(jsonData, key, label)` | Recibe los registros de la versión elegida, los sube a `App` y guarda la clave y su nombre legible |
| `resetDropdown()` | Vacía la selección y recarga la lista de versiones |
| `askDeleteConfirmation()` | Abre un `DialogAdvice` modal con el nombre de la versión y `confirmText` «Eliminar» (`dialogAdvice.confirmDeleteVersion`) |
| `handleFileDelete()` | Tras confirmar: `POST /delete-file { fileName }`, aviso de éxito o de error, reinicia y pide `focusRequest` para llevar el foco al `<h1>` (el botón que abrió el diálogo se desmonta) |
| `handleFileUpdate()` | `POST /update-file { fileName }`: activa esa versión como la vigente de su provincia, recarga la lista y avisa. Su botón usa `updateDataButtonTooltip` (B9) |

**Render:** `<h1>` (con `.focus-heading`), descripción, etiqueta visible con `InfoButton` y el selector `FileDropdown` (un `<select>` nativo). Con una versión elegida aparecen «Descargar Excel», «Eliminar versión» (con `aria-label` que añade el nombre) y «Actualizar datos» (los dos últimos con `loading`), y debajo una `Table` paginada con los registros filtrados dentro de una región con nombre y desplazamiento propio. Deuda: `dataManagement.description` aún contiene erratas (ver [09](09-estado-actual-y-deuda-tecnica.md)).

---

## ContentManagement (`/administrar-contenido`) · protegida

Contenedor `max-w-6xl` con `<h1>`, descripción y una rejilla de una columna (dos desde `lg`) con `TermsManager` (términos que no van en cursiva) e `ImageGalleryManager` (imágenes de la galería), cada uno con su `<h2>`.

---

## NotFound (`*`)

Página 404 con botón de vuelta al inicio (títulos en `brand-deep`; conserva su `max-w-[960px]`, sin `px-40`). Su título de pestaña es `notFound.title` ("Página no encontrada" / "Page not found"). Además, `VegetationGallery` sin datos muestra `gallery.noDataFoundPlaceholder` (sin texto por defecto en el código).
