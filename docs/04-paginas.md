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
| `isPrivateRoute` | `true` en las tres rutas protegidas: es el valor de `showLogout` de `Sidebar` (el botón «Cerrar sesión» vive en la barra) |

**Estructura de la página:** `App` pinta, por este orden, un enlace «Saltar al contenido» (`skipLink`, visible solo con foco, hacia `#contenido`), `Header`, la barra de gestión (si procede), un único `<main id="contenido" tabIndex={-1}>` con las rutas, el único `<footer>` (`Footer`) y `CookieBanner`. Todo va envuelto en `ToastProvider` (avisos) y cada página privada tiene un `<h1>`, un `<h2>` por sección y un contenedor `mx-auto w-full max-w-6xl` (`max-w-3xl` en la carga). Ver [01](01-arquitectura.md#layout).

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

Portada del proyecto.

| Sección | Contenido |
|---|---|
| Hero | `ImageComponent` de fondo (banner de S3, efecto parallax con `background-attachment: fixed`), título, subtítulo y botón a `/explorar` |
| Descripción | Texto `home.descriptionContent` sobre fondo oscuro, animado al entrar en pantalla |
| Líder del proyecto | Logo de la UMA con enlace y lista `umaCollaborators` (fija en el código) |
| Otras universidades | `anotherUniverities`: UAL, UGR, UHU y UJA con enlace y colaboradores |
| Entidades colaboradoras | `anotherEntities`: EFYVE, 3D Geospace y Malagueña Forestal |
| Contacto | `ContactForm`, lista de correos (`EmailContactGrid`) y ubicación |

**Estado:** `isLoading` (spinner mientras se envía el formulario).
**Funciones:** `handleOnLoad(state)` se pasa a `ContactForm` como `onLoad`.
**Animación:** `sectionVariants` (`hidden: opacity 0, y 50` → `visible`) con `whileInView` y `viewport.once`.

---

## Explore (`/explorar`)

Explorador público de especies características. Abre con `<h1>`; el contenedor usa `min-w-0` (sin `whitespace-nowrap`) y la barra de herramientas `flex-wrap gap-2`, de modo que a 768 y 1024 px no desborda y «Descargar glosario» cabe entero. `App` normaliza la ruta quitando la barra final (`/administrar-datos/` también muestra la barra de gestión) y memoriza con `useCallback` los cuatro callbacks de `Filter`.

**Props (desde `App`):**

| Prop | Tipo | Descripción |
|---|---|---|
| `data` | `Array<Registro>` | Conjunto completo, necesario para el diálogo de detalle |
| `filteredSpecies` | `Array<Registro>` | Registros tras aplicar filtros |
| `selectedSpecies` | `Set<string>` | Especies marcadas explícitamente |
| `noItalicTerms` | `Array` | Términos que no van en cursiva |
| `hasError` | `boolean` | Muestra el mensaje de error de carga |

**Estado:** `uniqueSpecies`, `currentPage`, `itemsPerPage`, `pageDirection` (sentido de la animación), `totalResults` (ref con el total inicial) y el diálogo (`useDialog`).

| Función / efecto | Descripción |
|---|---|
| Efecto sobre `filteredSpecies`, `selectedSpecies` | Aplana `Especies Características` de todos los registros, elimina vacíos y duplicados, filtra por `selectedSpecies` si hay selección, ordena alfabéticamente sin distinguir mayúsculas ni acentos y vuelve a la página 1. Guarda el total inicial en `totalResults` |
| `calculateItemsPerPage()` | Elementos por página según el ancho: ≥1280 → 24, ≥1024 → 16, ≥768 → 12 y menos → 7. Se recalcula con `resize` |
| `handlePageChange('next' \| 'prev')` | Cambia de página dentro de los límites y fija la dirección de la animación |
| `handleDownload()` | Abre el glosario PDF (`assets/documents/glossary.pdf`) |
| `variants` | Transición horizontal entre páginas (`x: ±300`) |

**Avisos:** si `assetUrl` falla al abrir el glosario, `notifyError` (aviso persistente `role="alert"`, ya sin `DialogAdvice`). **Deuda:** el título de la página es un `<h2>`, no hay `<h1>` (ver [09](09-estado-actual-y-deuda-tecnica.md)).

**Render:** error → mensaje; sin elementos → "sin datos"; en otro caso, cabecera con resultados, paginación, botones "Descargar glosario" y "Descargar Excel", y cuadrícula de `SpeciesCard`.

---

## VegetationGallery (`/galeria`)

| Elemento | Descripción |
|---|---|
| Estado | `imageUrls`, `isLoading`, `isError` |
| Efecto inicial | `GET /list-images`; descarta imágenes con `fileName` vacío |
| `renderContent()` | Nada mientras carga, mensaje de error, mensaje vacío o cuadrícula de 300×300 px. Al pasar el ratón muestra el nombre del archivo sin extensión y con `_` cambiados por espacios |

---

## About (`/sobre-nosotros`)

Página estática (títulos y texto en `brand-deep`/`ink`; las tarjetas `surface` sobre `brand` siguen como deuda de contraste): imagen de S3 (`assets/about/about-us.jpg`), título, texto del equipo y tres bloques animados (propósito, misión y valores) con retardos escalonados de 0,3 s, 0,6 s y 0,9 s. Incluye `ScrollIndicator`.

---

## Cookies (`/cookies`)

Política de cookies estática. Todos los textos vienen de `cookies.*` en las traducciones. Usa `<Trans>` para insertar enlaces (ICO, aboutcookies.org y la ayuda de Chrome, Internet Explorer, Safari, Edge, Firefox y Opera) y negritas.

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
