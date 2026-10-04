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
| `handleFileDropdownSelect(data)` | La llama `DataManagement` al elegir una versión: fija `selectedData` y `filteredData` y quita el spinner |
| `handleFilterDataChange(filtered)` | Actualiza `filteredData` solo si cambia (comparación por `JSON.stringify`) |
| `handleFilterChange(filtered)` | Igual, para `filteredSpecies` en el explorador |
| `handleOnSpeciesSelect(set)` | Guarda las especies elegidas en el filtro |
| `menuOptions` | Opciones de la barra lateral: `filter` y `dataManagementFilter` abren un `Filter` en un panel deslizante; `dataManagement`, `contentManagement` y `uploadFiles` son enlaces |
| `showSideMenu` | `true` en las cuatro rutas de datos |

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

Explorador público de especies características.

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

Página estática: imagen de S3 (`assets/about/about-us.jpg`), título, texto del equipo y tres bloques animados (propósito, misión y valores) con retardos escalonados de 0,3 s, 0,6 s y 0,9 s. Incluye `ScrollIndicator`.

---

## Cookies (`/cookies`)

Política de cookies estática. Todos los textos vienen de `cookies.*` en las traducciones. Usa `<Trans>` para insertar enlaces (ICO, aboutcookies.org y la ayuda de Chrome, Internet Explorer, Safari, Edge, Firefox y Opera) y negritas.

---

## Login (`/login`)

Contenedor centrado que renderiza `LoginForm`.

---

## FilesUpload (`/cargar-archivos`) · protegida

Página con título, descripción y `FileUpload`.
**Estado:** `isLoading`. **Función:** `handleOnLoad(state)` muestra u oculta el `LoadSpinner` a pantalla completa.

---

## DataManagement (`/administrar-datos`) · protegida

Gestión de versiones de los datos por provincia.

**Props:** `onFileDropdownSelect(data)` (de `App`) y `filteredSpecies` (los datos de la versión ya filtrados).
**Estado:** `fileName` (la `key` de la versión seleccionada), `isLoading`, `fileDropdownRef` (para llamar a `fetchFiles()` del desplegable) y el diálogo.

| Función | Descripción |
|---|---|
| `handleFileSelect(jsonData, fileName)` | Recibe los registros de la versión elegida, los sube a `App` y guarda la clave |
| `resetDropdown()` | Vacía la selección y recarga la lista de versiones |
| `handleFileDelete()` | `POST /delete-file { fileName }`, muestra el resultado y reinicia |
| `handleFileUpdate()` | `POST /update-file { fileName }`: activa esa versión como la vigente de su provincia y recarga la lista |
| `handleOnLoad(state)` | Controla el spinner |

**Render:** selector `FileDropdown`. Con una versión elegida aparecen "Descargar Excel", "Eliminar versión" y "Actualizar datos", y debajo una `Table` paginada con los registros filtrados.

---

## ContentManagement (`/administrar-contenido`) · protegida

Contenedor de `TermsManager` (términos que no van en cursiva) e `ImageGalleryManager` (imágenes de la galería).

---

## NotFound (`*`)

Página 404 con botón de vuelta al inicio.
