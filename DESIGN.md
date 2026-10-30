---
name: SIGMETUM-A
description: Sistema de diseño de la web de investigación ambiental SIGMETUM-A (frontend). Estructura inspirada en el DESIGN.md de Mintlify; los valores son los de este repositorio.
colors:
  brand: "#15B659"
  brand-dark: "#0e9447"
  surface: "#F9FBFA"
  ink: "#0C1811"
  ink-soft: "#14281D"
  sage: "#99BBA8"
  moss: "#4B644A"
typography:
  font-primary: Amaranth
  font-secondary: Sen
rounded:
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
---

# DESIGN.md de SIGMETUM-A

Lo leen los agentes (y las personas) **antes de crear o cambiar interfaz**. Dice cómo debe verse la web; las normas de cómo se escribe el código están en [docs/guias/buenas-practicas-frontend.md](docs/guias/buenas-practicas-frontend.md) y las de accesibilidad en [docs/guias/accesibilidad.md](docs/guias/accesibilidad.md), que **mandan sobre este documento**. Los valores actuales se documentan en [docs/07-i18n-y-estilos.md](docs/07-i18n-y-estilos.md).

Origen: la estructura sigue el `DESIGN.md` de Mintlify de [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (licencia MIT del repositorio). **Ningún valor de Mintlify se ha copiado**: ni su paleta, ni sus tipografías, ni sus botones. Solo se toma la idea de acento verde escaso, lectura cómoda y jerarquía plana.

Cada apartado distingue **Hoy** (lo que hay en el código, comprobado) de **Objetivo** (lo que se debe hacer en código nuevo). Lo que no esté comprobado se marca **(por confirmar)**.

## Visión

Web pública de una universidad para explorar especies y series de vegetación, con una zona privada para cargar datos. Es un producto de **lectura y consulta**: fichas, filtros, tablas y glosario, con una portada más atmosférica. Tono sereno, científico y natural; la interfaz no compite con el contenido.

Rasgos clave:
- Un único verde de marca, usado como acento (botones, títulos, estado activo), nunca como fondo de texto largo.
- Fondo claro casi blanco y tinta verde muy oscura; los verdes grisáceos se reservan para bordes, hover y apoyo.
- Superficies planas con bordes finos; la sombra solo en menús desplegables y diálogos.
- Iconos de Material Symbols Outlined; fotografía de vegetación como protagonista en portada y galería.
- Dos idiomas (es/en): el diseño tiene que aguantar textos de longitud distinta.

## Colores

Hoy están escritos como hexadecimales arbitrarios (`bg-[#15B659]`).

| Token | Valor | Hoy se usa para | Muestras |
|---|---|---|---|
| `brand` | `#15B659` | Botones, títulos, bordes, activo | 74 |
| `surface` | `#F9FBFA` | Fondo general y texto sobre verde | 60 |
| `ink` | `#0C1811` | Texto principal, pie y capas oscuras | 58 |
| `sage` | `#99BBA8` | Bordes suaves, hover, placeholders | 22 |
| `ink-soft` | `#14281D` | Párrafos largos | 22 |
| `moss` | `#4B644A` | Texto secundario y títulos de atributos | 8 |
| `brand-dark` | `#0e9447` | Hover del botón de `ErrorBoundary` | 1 |

Las muestras son las de [docs/07](docs/07-i18n-y-estilos.md#paleta) a 30/10/2026.

### Contraste (WCAG 2.1 AA, calculado el 30/10/2026)

| Pareja | Relación | Resultado |
|---|---|---|
| `ink` sobre `surface` | 17,50:1 | Cumple |
| `ink-soft` sobre `surface` | 14,96:1 | Cumple |
| `moss` sobre `surface` | 6,27:1 | Cumple |
| `ink` sobre `brand` | 6,82:1 | Cumple |
| `brand-dark` sobre `surface` | 3,78:1 | Solo texto grande (3:1) |
| **`brand` sobre `surface`** (en los dos sentidos) | **2,57:1** | **No cumple** |
| **`sage` sobre `surface`** (placeholders) | **2,02:1** | **No cumple** |

**Hoy:** el botón principal es texto `surface` sobre fondo `brand`, y los títulos y el botón alternativo son `brand` sobre `surface`: incumplen. Es deuda conocida (ver [docs/09](docs/09-estado-actual-y-deuda-tecnica.md)).

**Objetivo en código nuevo:**
- Texto sobre un botón `brand`: usa `ink`, no `surface` (6,82:1).
- Texto o título en verde sobre fondo claro: no uses `brand`. Una opción es un verde más oscuro, `#0B7A3B`, que da 5,23:1 con `surface` **(propuesta, por decidir: cambia la identidad de marca)**.
- Placeholders y texto de ayuda: no uses `sage`; usa `moss`.
- El color no puede ser la única señal (estado, error, activo): añade texto, icono o forma.

## Tipografía

| Token | Fuente | Se aplica a |
|---|---|---|
| `font-primary` | Amaranth | `body`, `h1`-`h3`, `th`, `summary` |
| `font-secondary` | Sen | `p`, `button`, `a`, `label`, `span`, `input`, `td`, `li` |

Se cargan desde Google Fonts en `index.html`, junto con Material Symbols Outlined. **No introduzcas una tercera familia.**

- Los **nombres científicos van en cursiva**, y los términos no latinos (`subsp.`, `var.`) en redonda: lo resuelve `highlightTerms`. No pongas cursiva a otros textos para enfatizar; usa el peso.
- Cuerpo en 16 px (`text-base`) y interlineado cómodo (`leading-normal` como mínimo) en texto largo.
- Los botones hoy usan `font-bold` con `tracking-[0.015em]` y tamaños que crecen con el ancho (`sm:text-sm md:text-base lg:text-xl`).
- `<h1>` solo existe en `Home`, `Cookies` y `NotFound`; el resto de páginas abre con `<h2>` (deuda B18). En páginas nuevas, un `<h1>` por página.
- Los textos de interfaz salen siempre de `t('clave')`: el diseño no puede depender de una longitud fija.

## Espaciado y rejilla

- Escala de Tailwind (múltiplos de 4 px). Altura de botón: `h-10` y `sm:h-12`; margen horizontal `px-4` y `sm:px-5`.
- Rejilla y anchos máximos: **(por confirmar)** no hay un contenedor común; cada página define el suyo. En páginas nuevas, usa un solo `max-w-*` por página y evita anchos fijos en píxeles (`FilesUpload` usa `px-40`, que en móvil deja poco espacio útil).
- Portada y galería: mucho espacio vertical. Explorar, tablas y gestión de datos: denso pero con filas legibles.

## Profundidad

Plano por defecto. Hoy solo hay 10 usos de `shadow`, sobre todo `shadow-lg` en menús desplegables (`bg-white border border-gray-300 rounded-lg shadow-lg`). Fichas y filtros se separan con **borde fino** (`border border-[#99BBA8]`), no con sombra.

## Formas

| Radio | Hoy | Uso |
|---|---|---|
| `rounded-xl` (12 px) | 10 usos | Botones principal y alternativo |
| `rounded-lg` (8 px) | 21 usos | Fichas (`SpeciesCard`), menús desplegables |
| `rounded` / `rounded-md` | 10 y 2 | Campos y detalles |
| `rounded-full` | 1 | Casos puntuales |

**Objetivo:** botones y fichas con los radios de arriba, sin inventar valores intermedios. Las esquinas no se mezclan dentro del mismo grupo de controles.

## Componentes

Reutiliza `ButtonPrincipal`, `ButtonAlternative`, `DialogAdvice` y `useDialog` antes de crear otros ([docs/05](docs/05-componentes.md)).

- **Botón principal (`ButtonPrincipal`):** fondo `brand`, `rounded-xl`, `h-10`/`sm:h-12`, mínimo 84 px de ancho. **Hoy** el texto es `surface` (no cumple el contraste); en código nuevo, texto `ink`. Deshabilitado: `opacity-50` y `cursor-not-allowed`.
- **Botón alternativo (`ButtonAlternative`):** fondo `surface`, borde `brand` de 2 px, `rounded-xl`. **Hoy** el texto es `brand` (2,57:1).
- **Botones de solo icono:** llevan `aria-label` y un área táctil de 44×44 px como mínimo (deuda B1 en los existentes).
- **Fichas (`SpeciesCard`):** `rounded-lg`, `border` en `sage`, altura mínima de 72 px, texto `ink` de 16 px con cursiva para el nombre científico.
- **Menús desplegables:** fondo blanco, borde gris, `rounded-lg`, `shadow-lg`.
- **Campos de formulario:** siempre controlados (`value` + `onChange`) y con `<label>` asociado por `htmlFor`/`id` (deuda B3 en los existentes).
- **Diálogos (`DialogAdvice`, `DialogSpecies`):** entran con un fundido del fondo y una caja que cae con muelle (`stiffness 300`, `damping 25`). Deben llevar `role="dialog"`, `aria-modal`, foco atrapado y cierre con Escape (deuda B2).
- **Foco:** nunca quites el contorno sin una alternativa visible (hoy hay 12 `outline-none` sin ella, deuda B17).
- **Pantallas con datos:** cubren siempre **cargando, error, vacío y éxito** (`LoadSpinner`, `ErrorBoundary`).

## Movimiento

Framer Motion (paquete `motion`) con los patrones ya existentes: aparición al hacer scroll (`opacity 0, y 50` → visible, una sola vez), modal con muelle, cambio de página con deslizamiento horizontal, plegado de listas y panel lateral. Duración de transiciones de estado (hover, foco): 150–200 ms con `ease` **(sugerencia, por confirmar)**.

**Hoy no se respeta `prefers-reduced-motion`** (deuda B19). En código nuevo, usa `useReducedMotion()` o `MotionConfig reducedMotion="user"`, y no dejes animaciones infinitas ni parallax fijo.

## Qué hacer y qué no

### Sí
- Mantén el verde `brand` como acento escaso: un botón principal por vista.
- Usa `ink` para el texto y deja que `surface` respire alrededor.
- Muestra los nombres científicos en cursiva y los textos de interfaz con `t()`.
- Separa con borde fino, no con sombra.
- Comprueba cada color nuevo contra [docs/guias/accesibilidad.md](docs/guias/accesibilidad.md) (mínimo 4,5:1 en texto normal y 3:1 en grande).

### No
- No uses `brand` ni `sage` como color de texto normal sobre fondo claro.
- No añadas colores de acento nuevos ni una tercera tipografía.
- No pongas sombras pesadas en fichas ni tablas.
- No uses solo el color para indicar un estado.
- No uses este documento para saltarte una guía: si chocan, manda la guía y se avisa.

## Diseño adaptable

Puntos de corte de Tailwind: `sm` 640, `md` 768, `lg` 1024 y `xl` 1280 px. Por debajo de `md`, la barra de navegación pasa a menú hamburguesa y `Explore` ajusta los elementos por página según el ancho. Diseña primero para móvil. Áreas táctiles de 44 px como mínimo. Las tablas anchas se desplazan en horizontal en lugar de romper la página.

## Guía de iteración

1. Trabaja un componente cada vez y reutiliza los existentes.
2. Antes de añadir un color, comprueba si ya existe uno en la tabla de arriba.
3. Si mueves la paleta (por ejemplo, el verde oscuro para texto), cámbialo en `tailwind.config.js` como colores del tema y actualiza [docs/07](docs/07-i18n-y-estilos.md); hoy los hexadecimales están repetidos por todo `src/` (deuda B13).
4. Verifica a mano con teclado, a 320 px de ancho y en inglés.
5. Si cambias este documento, actualiza los apartados "Hoy" tras contrastarlos con el código.

## Lagunas conocidas

- No hay modo oscuro: **(por decidir)** si se quiere.
- No hay tokens en `tailwind.config.js` para color ni espaciado; este documento los nombra, pero el código no.
- No se ha medido el contraste de los estados hover y desactivado de todos los componentes.
- Rejilla y contenedores no están unificados entre páginas.
- Este documento no incluye capturas ni vistas previas; se redactó leyendo el código, no la web en ejecución.
