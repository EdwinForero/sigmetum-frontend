# 06. Utilidades, hooks, servicios y configuración

## Configuración (`src/config/`)

### `env.js`
Único punto de lectura de `import.meta.env`. Vite sustituye las variables `VITE_*` **en tiempo de build**: cambiarlas exige volver a compilar. Las variables sin el prefijo `VITE_` no llegan al navegador.

| Clave | Variable | Valor por defecto | Uso |
|---|---|---|---|
| `BASE_URL` | `VITE_BASE_URL` | `http://localhost:8000` | Origen del backend |
| `API_PREFIX` | `VITE_API_PREFIX` | `/api/v1` | Prefijo de versión (debe coincidir con el backend) |
| `S3_URL` | `VITE_S3_URL` | `''` | Base pública de S3 o CloudFront para los recursos estáticos. También se lee **al compilar** (`vite.config.js`) para el favicon: ver [Favicon](#favicon-viteconfigjs-y-faviconhtml) |
| `CAROUSEL_IMAGE_KEYS` | `VITE_CAROUSEL_IMAGE_KEYS` | `[]` | Claves separadas por comas para `ImageCarrousel` (sin uso) |

### `assets.js`
Catálogo de claves de S3 de los recursos estáticos y la función `assetUrl`.

| Constante | Clave en S3 |
|---|---|
| `ASSETS.LOGO` | `assets/logos/app-logo.jpg` |
| `ASSETS.BANNER` | `assets/banners/home-banner.jpg` |
| `ASSETS.ABOUT` | `assets/about/about-us.jpg` |
| `ASSETS.GLOSSARY` | `assets/documents/glossary.pdf` |
| `ASSETS.LOGOS.UMA` | `assets/logos/UMA.jpg` |
| `ASSETS.LOGOS.UAL`, `UGR`, `UHU`, `UJA` | `assets/logos/other-universities/<SIGLA>.jpg` |
| `ASSETS.LOGOS.EFYVE`, `GEOSPACE`, `MAFO` | `assets/logos/collaborators/<NOMBRE>.jpg` |

`assetUrl(key)` → `` `${env.S3_URL}/${key}` ``. Para añadir un recurso: súbelo a esa ruta del bucket, añade la clave aquí y úsalo con `assetUrl(ASSETS.X)`. `ASSETS.LOGO` es además la **única fuente** de la clave del favicon (ver abajo): no se copia en ningún otro sitio.

### Favicon (`vite.config.js` y `faviconHtml`)
El `<link rel="icon">` ya no está en `index.html`: lo inyecta el plugin inline `sigmetum-favicon` de `vite.config.js` con `transformIndexHtml`, así que la primera petición del navegador ya va a la URL correcta y no depende de JavaScript (`Header` no toca el favicon). Actúa en `npm run build` y en `npm run dev`.

| Pieza | Qué hace |
|---|---|
| `faviconTags(s3Url, logoKey)` (`src/utilities/faviconHtml.js`) | Devuelve la etiqueta `<link rel="icon" href="<s3Url>/<logoKey>">` (sin `type`: el logo es JPEG y el navegador detecta el formato) o `[]` si `s3Url` no es una URL `https://` (vacía, `http://`, `//cdn...`, sin esquema o con espacios iniciales; la comparación es estricta y en minúsculas). La barra final no se normaliza, igual que `assetUrl`; **solo en eso es igual**: `assetUrl` no valida el esquema (con `VITE_S3_URL=http://...` el logo de la cabecera y demás recursos cargan en runtime) y solo el favicon exige `https://` (ver B20 en `docs/09`). `npm run quality` y `seguridad.md` solo detectan `http://` literales en el código, no el valor de una variable de entorno |
| `logoKeyFromSource(texto)` (`src/utilities/faviconHtml.js`) | Extrae la clave `LOGO` del texto de `src/config/assets.js` (lanza error si no la encuentra) |
| `isHttpsUrl(s3Url)` (`src/utilities/faviconHtml.js`) | `true` solo si `s3Url` es una cadena que empieza por `https://`; la usan `faviconTags` y el plugin |
| Plugin `sigmetum-favicon` | Guarda `VITE_S3_URL` en `configResolved` (mezcla `.env*` y `process.env`, que es donde Amplify la inyecta); si hay valor y no empieza por `https://`, avisa por la consola del build (`[sigmetum-favicon] VITE_S3_URL no empieza por https://: no se emite el favicon.`) sin romper el build (con la variable ausente o vacía no hay aviso). Solo si el valor es `https://`, lee `assets.js` como texto dentro de `transformIndexHtml` |

- `vite.config.js` no puede importar `assets.js` (importa `env.js`, que usa `import.meta.env`, no disponible al cargar la configuración), por eso lo lee como texto. Un test compara la clave extraída con `ASSETS.LOGO` real.
- **`VITE_S3_URL` también se usa al compilar.** **El favicon exige `https://`** (`seguridad.md` prohíbe los enlaces externos `http://`): un valor que no empiece por `https://` se trata como ausente. Sin ella (vacía, ausente o sin `https://`) el build no falla y `dist/index.html` no lleva ningún `rel="icon"`: el navegador usa el suyo por defecto. No hay icono de respaldo en `public/`.
- La lectura de `assets.js` es diferida para que Vitest, que usa esta misma configuración, no la toque. Un cambio de formato en la línea `LOGO:` haría fallar `dev` y `build` (en voz alta), no `npm test`.

## Servicio HTTP (`src/services/api.js`)

Documentado en [03-api.md](03-api.md#métodos-del-cliente). Resumen:

| Función interna | Descripción |
|---|---|
| `authHeader()` | `{ Authorization: 'Bearer ' + localStorage.token }` |
| `request(path, options)` | `fetch` a `BASE_URL + API_PREFIX + path`. Convierte los fallos de red en `Error('network_error')`, parsea el JSON y lanza un error si `!response.ok \|\| !json.success`. Devuelve `json.data` |

## Hooks

### `useDialog()` (`src/hooks/useDialog.js`)
Estado estándar de un diálogo `DialogAdvice`.

| Devuelve | Descripción |
|---|---|
| `dialog` | `{ visible, title, message, details, onConfirm, onCancel }` |
| `showDialog(title, message, { details?, onConfirm?, onCancel? })` | Abre el diálogo. `onCancel` permite al llamador saber que el usuario lo cerró sin confirmar (la subida de archivos lo usa para cancelar el borrador) |
| `closeDialog()` | Lo cierra y reinicia el estado |

Patrón de uso:

```jsx
const { dialog, showDialog, closeDialog } = useDialog();
// ...
<AnimatePresence>
  {dialog.visible && (
    <DialogAdvice dialogTitle={dialog.title} dialogMessage={dialog.message} onClose={closeDialog} />
  )}
</AnimatePresence>
```

### `useDocumentTitle()` (`src/hooks/useDocumentTitle.js`)
Pone `document.title` con el formato `` `${t(clave)} · SIGMETUM-A` `` según la ruta mostrada. `App` lo llama **una vez**; no se llama en cada página porque `ProtectedRoute` puede mostrar el spinner o redirigir y el título quedaría desfasado.

| Exporta | Descripción |
|---|---|
| `PAGE_TITLE_KEYS` | Mapa ruta → clave de traducción (tabla en [04](04-paginas.md#título-de-página-por-ruta)) |
| `titleKeyFor(pathname)` | Resuelve la clave con `matchPath` (sin distinguir mayúsculas y con o sin barra final); si ninguna ruta coincide, `notFound.title` |
| `useDocumentTitle()` (por defecto) | Efecto con dependencias `[t, key]`: se recalcula al navegar y al cambiar de idioma (en react-i18next `t` cambia de identidad con el idioma) |

Al añadir una ruta en `App.js` hay que añadirla a `PAGE_TITLE_KEYS`: un test lee `App.js` y falla si falta alguna.

### `UseAtBottom()` (`src/utilities/UseAtBottom.js`)
Devuelve `true` cuando la ventana está a 5 px o menos del final del documento. Escucha `scroll` en `window` sin limitar la frecuencia. El nombre empieza en mayúscula, lo que se sale de la convención `useXxx`, aunque funciona.

### `useTokenExpirationHandler(token)` (`src/utilities/TokenExpiration.js`)
**Sin uso.** Muestra un aviso si el token ha caducado y redirige a `/login`. Duplica la lógica de `ProtectedRoute` y se puede eliminar.

## Utilidades

### `convertToXLSX(data)` (`CSVfunctions.js`)
Crea un libro de SheetJS con una hoja `Sigmetum-A` a partir de un array de objetos (`json_to_sheet`).

### `downloadXLSX(filteredData)` (`CSVfunctions.js`)
1. Crea copias de las filas y convierte cada valor array en una cadena `'a, b, c'`. **No modifica los datos originales** (corregido en A2).
2. Genera el libro con `convertToXLSX`, lo escribe como `ArrayBuffer` y crea un `Blob`.
3. Crea un enlace temporal con `download="Sigmetum-A.xlsx"`, lo pulsa y lo retira. No libera la URL con `URL.revokeObjectURL`.

### `highlightTerms(text, terms)` (`highlightTerms.js`)
Divide un nombre científico en fragmentos `{ text, isItalic }` para pintar en redonda los términos no latinos (`subsp.`, `var.`...) y en cursiva el resto.

| Entrada | Salida |
|---|---|
| Sin términos o lista vacía | `[{ text, isItalic: true }]` |
| `terms` como `[{ term }]` (respuesta de la API) o como cadenas | Se aceptan ambos formatos |
| Términos con `.`, `(`, `+`, etc. | Se escapan: el punto es literal y un paréntesis sin cerrar no lanza error |

Lo usan `SpeciesCard` y `DialogSpecies`.

### `FormatFileName(fileName)` (`FormatFileName.js`)
Convierte el nombre técnico de una versión en un texto legible.

Usa el formato real del backend, `AAAA-MM-DD_vN.xlsx`, buscado **al final** del nombre (con o sin ruta delante).

| Entrada | Salida |
|---|---|
| `2026-09-15_v3.xlsx`, `2026-09-15_v10.xlsx` | `15/09/2026 · V3`, `15/09/2026 · V10` |
| `data/Malaga/2026-09-15_v3.xlsx` | `15/09/2026 · V3` |
| Cualquier nombre que no siga el patrón | El mismo nombre sin cambios |

Expresión: `(\d{4})-(\d{2})-(\d{2})_v(\d+)\.xlsx$`. Si el `name` real de `GET /list-files` lleva o no ruta **(por confirmar)**; ambos casos están cubiertos por los tests.

### `SortItemsList(items)` (`SortItemsList.js`)
Ordena **en el propio array** (usa `sort`, que muta) con estas reglas:
- Los textos van antes que los números.
- Los textos se ordenan con `localeCompare` sin distinguir mayúsculas ni acentos (`sensitivity: 'base'`).
- Los números se ordenan de menor a mayor.

Ejemplo: `['300', 'roble', '1200', 'Alcornoque']` → `['Alcornoque', 'roble', '300', '1200']`.
