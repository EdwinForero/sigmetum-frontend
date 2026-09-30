# 06. Utilidades, hooks, servicios y configuración

## Configuración (`src/config/`)

### `env.js`
Único punto de lectura de `import.meta.env`. Vite sustituye las variables `VITE_*` **en tiempo de build**: cambiarlas exige volver a compilar. Las variables sin el prefijo `VITE_` no llegan al navegador.

| Clave | Variable | Valor por defecto | Uso |
|---|---|---|---|
| `BASE_URL` | `VITE_BASE_URL` | `http://localhost:8000` | Origen del backend |
| `API_PREFIX` | `VITE_API_PREFIX` | `/api/v1` | Prefijo de versión (debe coincidir con el backend) |
| `S3_URL` | `VITE_S3_URL` | `''` | Base pública de S3 o CloudFront para los recursos estáticos |
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

`assetUrl(key)` → `` `${env.S3_URL}/${key}` ``. Para añadir un recurso: súbelo a esa ruta del bucket, añade la clave aquí y úsalo con `assetUrl(ASSETS.X)`.

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

> **Desactualizada:** el backend actual nombra las versiones `AAAA-MM-DD_vN.xlsx` (por ejemplo `2026-09-15_v3.xlsx`), así que esta función nunca coincide y devuelve el nombre sin cambios. Ver D2 en [integración con el backend](integracion/para-backend.md#6-discrepancias-verificadas-hoy).

| Entrada | Salida |
|---|---|
| `Málaga_V003_15_09_2026.json` | `Málaga V3 (15/09/2026)` |
| Cualquier nombre que no siga el patrón `Nombre_Vn_dd_mm_aaaa.json` | El mismo nombre sin cambios |

Expresiones que usa: nombre `^([A-Za-záéíóúÁÉÍÓÚüÜñÑ\s]+)_`, versión `_V(\d+)_` (quita los ceros a la izquierda) y fecha `_(\d{2})_(\d{2})_(\d{4})\.json`.

### `SortItemsList(items)` (`SortItemsList.js`)
Ordena **en el propio array** (usa `sort`, que muta) con estas reglas:
- Los textos van antes que los números.
- Los textos se ordenan con `localeCompare` sin distinguir mayúsculas ni acentos (`sensitivity: 'base'`).
- Los números se ordenan de menor a mayor.

Ejemplo: `['300', 'roble', '1200', 'Alcornoque']` → `['Alcornoque', 'roble', '300', '1200']`.
