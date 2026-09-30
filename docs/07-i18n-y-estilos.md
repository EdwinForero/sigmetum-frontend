# 07. Internacionalización y estilos

## Internacionalización

### Configuración (`src/i18n.js`)

- Idiomas: español (`es`, por defecto y de reserva) e inglés (`en`).
- Detección: `i18next-browser-languagedetector` (cadena de consulta, cookie, `localStorage`, navegador...). El idioma elegido queda en `localStorage['i18nextLng']`.
- `escapeValue: false`: React ya escapa el contenido. Por eso **no** se debe usar `dangerouslySetInnerHTML` con traducciones.

### Archivos

`src/languages/es/translation.json` (198 claves) y `src/languages/en/translation.json` (197 claves). Falta en inglés `dataManagement.noDataFoundPlaceholder`.

| Espacio | Claves | Contenido |
|---|---|---|
| `navbar` | 4 | Opciones del menú |
| `footer` | 5 | Enlaces y copyright (`{{currentYear}}`) |
| `home` | 15 | Portada, contacto, correos (`emailsData` con formato `Nombre / email / ...`) y ubicación |
| `explore` | 10 | Explorador, `resultsInfo` (`{{currentResults}}`, `{{totalResults}}`), `dialogSpecies.attributes.*` |
| `gallery` | 1 | Título de la galería |
| `aboutUs` | 8 | Sobre nosotros |
| `filter` | 3 | Textos del filtro |
| `attributes` | 11 | **Nombres visibles de las columnas de datos.** La clave es el nombre exacto de la columna en el Excel (`"Provincia"`, `"Sector Biogeográfico"`...) |
| `login` | 9 | Formulario de acceso |
| `uploadFiles` | 3 | Carga de archivos |
| `dataManagement` | 11 | Administrar datos |
| `contentManagement` | 11 | Administrar contenido |
| `dialogAdvice` | 31 | Todos los mensajes de éxito, error y aviso; `rowEmpty` (`{{rowIndex}}`) y `fieldsMissingMessage` (`{{filename}}`) |
| `cookies` | 28 | Política, banner y modal (con etiquetas `<a>` y `<strong>` para `<Trans>`) |
| `tokenExpiration`, `notFound`, `pagination`, `language`, `ee` | 1-2 | Varios |

### Convenciones

- Usa siempre `t('espacio.clave')`. Para textos con enlaces o negritas, usa `<Trans i18nKey components={{ a: <a .../> }} />`.
- Añade cada clave nueva **a los dos idiomas** a la vez.
- Si se añade una columna nueva al Excel, añade su traducción en `attributes` o se mostrará el nombre en bruto (`t('attributes.X', 'X')`).
- Textos que hoy están fijos en el código y deberían pasar a traducciones: `ErrorBoundary`, nombres de `menuOptions` en `App.js`, colaboradores de `Home.js` y alertas de `UploadButton`.

## Estilos

### Enfoque

Tailwind CSS con clases utilitarias directamente en el JSX. No hay componentes de estilo compartidos salvo los botones. `App.css` es residual y `styled-components` solo se usa en `Switch`.

### Tipografía (`tailwind.config.js` + `index.css`)

| Token | Fuente | Se aplica a |
|---|---|---|
| `font-primary` | Amaranth | `body`, `h1`-`h3`, `th`, `summary` |
| `font-secondary` | Sen | `p`, `button`, `a`, `label`, `span`, `input`, `td`, `li` |

Las fuentes se cargan desde Google Fonts en `public/index.html`, junto con Material Symbols Outlined para los iconos.

### Paleta

Los colores están escritos como hexadecimales arbitrarios (`bg-[#15B659]`). Uso real en el código:

| Color | Muestras | Uso | Nombre propuesto |
|---|---|---|---|
| `#15B659` | 74 | Verde de marca: botones, títulos, bordes, activo | `brand` |
| `#F9FBFA` | 60 | Fondo general y texto sobre verde | `surface` |
| `#0C1811` | 58 | Texto principal, pie y capas oscuras | `ink` |
| `#99BBA8` | 22 | Verde grisáceo: hover, bordes suaves, placeholders | `sage` |
| `#14281D` | 22 | Texto de párrafos largos | `ink-soft` |
| `#111418` | 11 | Etiquetas de formulario | (unificar con `ink`) |
| `#4B644A` | 8 | Texto secundario y títulos de atributos | `moss` |
| `#0e9447` | 1 | Hover del botón de `ErrorBoundary` | `brand-dark` |

**Recomendación:** definirlos en `theme.extend.colors` de `tailwind.config.js` y sustituir los hexadecimales (`bg-brand`, `text-ink`). Así un cambio de marca se hace en un solo sitio. **Problema de contraste (WCAG 2.1 AA):** el verde de marca `#15B659` con `#F9FBFA` da **2,57:1** en los dos sentidos (texto blanco sobre botón verde y títulos verdes sobre fondo claro). No llega ni al mínimo de texto grande (3:1) ni al de texto normal (4,5:1). Los placeholders `#99BBA8` sobre `#F9FBFA` dan 2,02:1. En cambio, `#0C1811` sobre verde da 6,82:1 y cumple. Hay dos opciones: oscurecer el verde de marca para texto y botones (en torno a `#0B7A3B` se superan 4,5:1) o usar texto oscuro sobre los botones verdes.

### Animaciones

Framer Motion, con estos patrones repetidos:

| Patrón | Dónde | Configuración |
|---|---|---|
| Aparición al hacer scroll | `Home`, `About` | `hidden {opacity 0, y 50}` → `visible`, `whileInView`, `viewport.once` |
| Modal | `DialogAdvice`, `DialogSpecies` | Fondo con fundido y caja que cae con muelle (`stiffness 300`, `damping 25`) |
| Cambio de página | `Explore` | Deslizamiento horizontal ±300 px según la dirección |
| Plegar y desplegar | `CategoryFilter`, `FileDropdown` | `height` 0 → `auto` y `clipPath` |
| Panel lateral | `Sidebar` | `x: -100%` → `0` |

No se respeta `prefers-reduced-motion`. Framer Motion lo permite con `useReducedMotion()` o `MotionConfig reducedMotion="user"`.

### Diseño adaptable

Puntos de corte de Tailwind (`sm` 640, `md` 768, `lg` 1024 y `xl` 1280). La barra de navegación pasa a menú hamburguesa por debajo de `md`, y `Explore` ajusta los elementos por página según el ancho. `FilesUpload` usa `px-40` fijo, que en móvil deja poco espacio útil.
