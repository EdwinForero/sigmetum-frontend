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
- Un único verde de marca, usado como acento (relleno de botones y estado activo), nunca como fondo de texto largo; el verde de los títulos es su variante oscura `brand-deep`.
- Fondo claro casi blanco y tinta verde muy oscura; los verdes grisáceos se reservan para bordes, hover y apoyo.
- Superficies planas con bordes finos; la sombra solo en menús desplegables y diálogos.
- Iconos de Material Symbols Outlined; fotografía de vegetación como protagonista en portada y galería.
- Dos idiomas (es/en): el diseño tiene que aguantar textos de longitud distinta.

## Colores

Son **tokens** de `theme.extend.colors` en `tailwind.config.js` (`bg-brand`, `text-ink`...); `spacing.nav` (4,5 rem) es la altura de la barra inferior (`h-nav`, `pb-nav`, `bottom-nav`). Los valores y los contrastes los fija `src/theme.test.js`. Se añadieron dos tokens a la paleta histórica (`brand-deep` y `danger`) por la decisión C1 de la spec de la auditoría de las páginas privadas: es la excepción a «No añadas colores nuevos» y se justifica por el contraste (ver abajo).

| Token | Valor | Se usa para |
|---|---|---|
| `brand` | `#15B659` | Relleno de botón principal, ítem de navegación activo o con ratón y bordes de acento. **No** como texto sobre fondo claro |
| `brand-dark` | `#0e9447` | Hover del botón principal, borde del botón alternativo y de los campos, iconos y casilla marcada |
| `brand-deep` | `#0B7A3B` | Títulos y texto verde sobre fondo claro; texto del botón alternativo |
| `surface` | `#F9FBFA` | Fondo general |
| `ink` | `#0C1811` | Texto principal, pie, capas oscuras y texto sobre `brand` |
| `ink-soft` | `#14281D` | Párrafos largos |
| `sage` | `#99BBA8` | Bordes suaves y hover. **No** para texto ni placeholders |
| `moss` | `#4B644A` | Placeholders, icono de información y texto de ayuda |
| `danger` | `#B42318` | Errores, siempre con icono y texto |

### Contraste (WCAG 2.1 AA, recalculado el 11/11/2026)

| Pareja | Relación | Resultado |
|---|---|---|
| `ink` sobre `surface` | 17,50:1 | Cumple |
| `ink-soft` sobre `surface` | 14,96:1 | Cumple |
| `brand-deep` sobre `surface` / sobre blanco | 5,23:1 / 5,44:1 | Cumple |
| `moss` sobre `surface` | 6,27:1 | Cumple |
| `danger` sobre `surface` / sobre blanco | 6,33:1 / 6,57:1 | Cumple |
| `ink` sobre `brand` | 6,82:1 | Cumple |
| `ink` sobre `brand-dark` (hover) | 4,63:1 | Cumple |
| `brand-dark` sobre `surface` (iconos y bordes: componentes, 3:1) | 3,78:1 | Cumple |
| **`brand` sobre `surface`** (en los dos sentidos) | **2,57:1** | **No cumple: no se usa para texto ni sobre él** |
| **`sage` sobre `surface`** | **2,02:1** | **No cumple: ya no se usa para texto** |

**Reglas:**
- Texto sobre un relleno `brand` (botón principal, ítem activo, `th` de tabla): `ink`, nunca `surface`.
- Texto o título en verde sobre fondo claro: `brand-deep`, nunca `brand`.
- Placeholders y ayuda: `moss`. Errores: `danger` con icono y texto.
- El color no puede ser la única señal (estado, error, activo): el ítem de navegación activo suma peso y borde `ink`.
- Un botón desactivado (`opacity-50`) está exento de contraste (WCAG 1.4.3).

**Deuda:** las tarjetas de `About` (`surface` sobre `brand`) y otros textos de páginas públicas siguen con el contraste anterior; las letras U, M y A del logotipo de `Header` (rojo, azul y verde de marca) están por debajo del umbral pero un logotipo está exento. Quedan hexadecimales arbitrarios en varios componentes (B13, parcial).

## Tipografía

| Token | Fuente | Se aplica a |
|---|---|---|
| `font-primary` | Amaranth | `body`, `h1`-`h3`, `th`, `summary` |
| `font-secondary` | Sen | `p`, `button`, `a`, `label`, `span`, `input`, `td`, `li` |

Se cargan desde Google Fonts en `index.html`, junto con Material Symbols Outlined. **No introduzcas una tercera familia.**

- Los **nombres científicos van en cursiva**, y los términos no latinos (`subsp.`, `var.`) en redonda: lo resuelve `highlightTerms`. No pongas cursiva a otros textos para enfatizar; usa el peso.
- Cuerpo en 16 px (`text-base`) y interlineado cómodo (`leading-normal` como mínimo) en texto largo.
- Los botones usan `font-bold`, `text-base` y `leading-tight` y ya no recortan su texto (sin `truncate`): se parten en varias líneas si hace falta.
- Hay un `<h1>` por página en `Home`, `Cookies`, `NotFound`, `Login` y las tres páginas privadas, con un `<h2>` por sección (B18 resuelto en ellas); `/explorar` sigue abriendo con `<h2>`. En páginas nuevas, un `<h1>` por página.
- Los textos de interfaz salen siempre de `t('clave')`: el diseño no puede depender de una longitud fija.

## Espaciado y rejilla

- Escala de Tailwind (múltiplos de 4 px). Altura mínima de botón y de campo: `min-h-12` (48 px); objetivos táctiles de 44 px como mínimo (los de solo icono, 48×48); margen horizontal `px-4` y `sm:px-5`.
- Rejilla y anchos máximos: las páginas privadas usan un contenedor `mx-auto w-full max-w-6xl` (`max-w-3xl` la de carga) dentro de un `main` con `min-w-0`; las públicas aún definen el suyo. En páginas nuevas, usa un solo `max-w-*` por página y evita anchos fijos en píxeles (`px-40`, `w-[512px]`, `min-w-72` y `max-w-screen` se retiraron de las privadas).
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

Reutiliza `ButtonPrincipal`, `ButtonAlternative`, `ToastProvider` (`useToast`), `InlineError` y, para confirmar o decidir, `DialogAdvice` y `useDialog` antes de crear otros ([docs/05](docs/05-componentes.md)).

- **Botón principal (`ButtonPrincipal`):** fondo `brand`, texto `ink`, hover `brand-dark`, `rounded-xl`, `min-h-12` (48 px), mínimo 84 px de ancho y `max-w-full`. Con `icon`: cuadrado de 48×48, icono `brand-dark` y hover `bg-brand text-ink`. Deshabilitado: `opacity-50` y `cursor-not-allowed`. Con `loading`: `aria-busy` y `aria-disabled` (sin `disabled`, para no perder el foco), el clic se ignora y se ve `progress_activity`. Recibe `...rest` (`aria-expanded`, `id`...). Ya no existe el modo desplegable.
- **Botón alternativo (`ButtonAlternative`):** mismo tamaño y tipografía; fondo `surface`, borde `brand-dark` de 2 px, texto `brand-deep`, hover `bg-brand text-ink`, `rounded-xl`; admite `disabled`, `loading` y `...rest`.
- **Botones de solo icono:** llevan `aria-label` traducido (claves `iconButton.*`; `ButtonPrincipal` lo recibe en la prop `ariaLabel`), la ligadura del icono con `aria-hidden="true"` y la clase `focus-ring`. En los botones con texto, las ligaduras decorativas (chevrons, `open_in_new`) también llevan `aria-hidden="true"` y no se añade `aria-label`. Área táctil de 44×44 px como mínimo (B1 resuelto en los botones existentes; el área táctil no se ha medido **(por confirmar)**).
- **Botón de mostrar contraseña (dentro de un campo):** botón de solo icono de 48×48 px, en `moss` (6,5:1 sobre blanco), pegado al borde derecho del campo, `rounded-lg`, `overflow-hidden` (hasta que cargue la fuente de iconos el nombre de la ligadura taparía la contraseña), icono `visibility` o `visibility_off` y anillo `.focus-ring`. El `input` reserva `pr-12`. Su `aria-label` es fijo y distinto por campo; el estado va en `aria-pressed`.
- **Clave del MFA y QR:** la clave se muestra en un `<code>` en grupos de 4 caracteres separados por espacios (parte la línea solo entre grupos; sin `break-all`). El QR mide 192 px (`w-48`, `max-w-full`), va centrado, con fondo blanco y quiet zone de 4 módulos dentro del propio SVG (módulos en `ink`), de modo que se lee igual en modo oscuro; no se pinta la dirección `otpauth://`.
- **Fichas (`SpeciesCard`):** `rounded-lg`, `border` en `sage`, altura mínima de 72 px, texto `ink` de 16 px con cursiva para el nombre científico.
- **Menús desplegables:** fondo blanco, borde gris, `rounded-lg`, `shadow-lg` (el panel del menú móvil de `Navbar`).
- **Campos de formulario (`TextInput`, `FilterSearchBar`):** siempre controlados (`value` + `onChange`) y con **etiqueta visible** (`<label htmlFor>` con `id` de `useId`; el `placeholder` no sustituye a la etiqueta y los gestores ya no lo ponen). `h-12 rounded-xl`, borde `brand-dark`, placeholder `moss`, `.focus-ring-inset`; con error, `aria-invalid` y `aria-describedby` hacia un `InlineError`.
- **Avisos:** el éxito va a una región `role="status"` y el error a una `role="alert"`, ambas de `ToastProvider` (siempre montadas, `fixed top-20`, por encima del contenido y por debajo del panel de filtros): icono, texto y botón de cerrar de 44×44; el éxito se cierra solo a los 8 s con pausa al pasar el ratón o enfocar, el error se queda hasta cerrarlo. Nunca mueven el foco ni se animan.
- **Error en línea (`InlineError`):** `<p role="alert">` con borde y texto `danger`, icono `error` y el texto; se pone junto al campo o encima del botón que envía, y el foco va al campo solo cuando la validación falla.
- **Selector nativo (`<select>`):** para elegir una opción de una lista corta (idioma, versión de datos): `<label>` visible o `sr-only`, `h-11`/`h-12`, `rounded-xl`, borde `brand-dark`, `.focus-ring`, un `<optgroup>` por grupo y la información del grupo repetida en el texto de la opción (un `<select>` cerrado no muestra la etiqueta del grupo). Es preferible a un desplegable propio: teclado, lector y táctil son los del navegador.
- **Barra de navegación de gestión (`Sidebar`):** inferior fija bajo `md` (`h-nav`, 72 px) y lateral fija desde `md` (`w-28`, bajo la cabecera). Cada ítem lleva icono y **etiqueta visible**; enlaces con `aria-current="page"`; activo `bg-brand font-bold` con borde `ink` (superior en la inferior, izquierdo en la lateral) y hover `bg-brand`; «Filtros» es un botón con `aria-expanded` y «Cerrar sesión» un ítem más. El panel de filtros es un diálogo modal (`z-[60]`, hermano de la barra) que cubre cabecera y barra. El banner de cookies, `sticky`, se coloca encima (`bottom-nav md:bottom-0`).
- **Diálogos (`DialogAdvice`, `DialogSpecies`):** entran con un fundido del fondo y una caja que cae con muelle (`stiffness 300`, `damping 25`). Llevan `role="dialog"`, `aria-modal="true"`, `aria-labelledby` con el título y `tabIndex={-1}`, y el hook `useDialogFocus` ([docs/06](docs/06-utilidades-hooks-config.md)) lleva el foco a la caja al abrir, atrapa Tab, cierra con Escape y devuelve el foco a quien abrió. Todo diálogo nuevo reutiliza ese hook (B2 resuelto en `DialogAdvice` y `DialogSpecies`, y el panel de filtros de `Sidebar` lo usa; `CookieBanner` sigue sin cumplir A6). **Diálogo de confirmación de borrado:** `DialogAdvice` con `showActions`, el nombre del elemento en el mensaje (p. ej. «Almería 10/11/2026 · V1») y `confirmText` «Eliminar»; Cancelar y Escape no borran. Tras borrar, el foco va a un encabezado (`.focus-heading`, `tabIndex={-1}`) porque el botón que abrió el diálogo se desmonta.
- **Foco:** nunca quites el contorno sin una alternativa visible. Hay tres clases en `src/index.css` (`@layer components`, sobre `:focus-visible`): `.focus-ring` (contorno `ink` de 2 px con separación de 2 px y un halo `surface` de 2 px por dentro, para que el anillo se vea también sobre fondos oscuros como el `CookieBanner`) y `.focus-ring-inset` (contorno `ink` de 2 px hacia dentro, sin halo, para campos cuyo `input` va dentro de un `label` con `overflow-hidden` que recortaría el anillo exterior: `FilterSearchBar` y `TextInput`) y `.focus-heading` (sin contorno: subrayado de 2 px, con separación de 4 px, del color del texto; es el patrón para **encabezados no interactivos que reciben foco programático** con `tabIndex={-1}`, como el `<h2>` de cada paso de `LoginForm`; un contorno sobre toda la caja del título resultaba un recuadro grueso). Se usa `outline` y no `ring` porque el contorno se mantiene en el modo de alto contraste de Windows. **Aviso:** `.focus-ring` pone `box-shadow` con la misma especificidad que una utilidad de Tailwind y en una capa posterior, así que una utilidad `shadow-*` o `ring-*` futura en ese elemento ganaría sobre el halo; no las combines sin comprobarlo. El pintado, el contraste real y el recorte del anillo no se han visto en un navegador **(por confirmar)**.
- **Pantallas con datos:** cubren siempre **cargando, error, vacío y éxito** (`LoadSpinner` —en línea y siempre montado, con texto, en las listas y selectores—, `InlineError`, texto de vacío que explica qué hacer y `ToastProvider`).
- **Tablas anchas (`Table`):** dentro de `role="region"` con nombre, `tabIndex={0}` y `overflow-x-auto`; `caption` `sr-only` y `th scope="col"` con texto `ink` sobre `brand`. La paginación queda fuera de la región.
- **Listas de gestión:** `<ul aria-label>` con filas `min-h-12`, el nombre con `break-words` y una papelera de 48×48 a la derecha con nombre que incluye el elemento.

## Movimiento

Framer Motion (paquete `motion`) con los patrones ya existentes: aparición al hacer scroll (`opacity 0, y 50` → visible, una sola vez), modal con muelle, cambio de página con deslizamiento horizontal y plegado de listas. El panel de filtros, los avisos y el selector de versión no se animan. Duración de transiciones de estado (hover, foco): 150–200 ms con `ease` **(sugerencia, por confirmar)**.

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

Puntos de corte de Tailwind: `sm` 640, `md` 768, `lg` 1024 y `xl` 1280 px. Se diseña y se comprueba en **cinco anchuras: 320, 375, 768, 1024 y 1280 px**. Por debajo de `md`, la navegación principal pasa a menú hamburguesa y la barra de gestión es inferior; desde `md` es lateral. `Explore` ajusta los elementos por página según el ancho. Diseña primero para móvil. Áreas táctiles de 44 px como mínimo. Las tablas anchas se desplazan en horizontal dentro de su región en lugar de romper la página. En la auditoría de las páginas privadas se midieron 320, 375 y 1280 px con Playwright (sin desbordamiento, objetivos ≥ 44 px, cabecera hasta 305 px; procedimiento en [docs/08](docs/08-guia-desarrollo.md#medición-con-playwright)); 768 y 1024 px **(por confirmar)**.

**Scroll y foco:** `html` lleva `scroll-padding-top` (5 rem: cabecera de 4 rem más margen) y `scroll-padding-bottom` (20 rem: barra inferior más banner de cookies compacto en móvil, medido: 228 px a 320 px y 196 px a 375 px) para que el elemento enfocado no quede tapado (WCAG 2.4.11).

## Guía de iteración

1. Trabaja un componente cada vez y reutiliza los existentes.
2. Antes de añadir un color, comprueba si ya existe uno en la tabla de arriba.
3. Si mueves la paleta, cámbialo en `tailwind.config.js` (colores del tema), actualiza `src/theme.test.js` y [docs/07](docs/07-i18n-y-estilos.md); quedan hexadecimales arbitrarios en varios componentes (deuda B13, parcial).
4. Verifica a mano con teclado, a 320 px de ancho y en inglés.
5. Si cambias este documento, actualiza los apartados "Hoy" tras contrastarlos con el código.

## Lagunas conocidas

- No hay modo oscuro: **(por decidir)** si se quiere.
- Los hexadecimales de varios componentes (`CookieBanner`, `DialogSpecies`, `SpeciesCard`, `ContactForm`...) aún no usan los tokens.
- No se ha medido el contraste de los estados hover y desactivado de todos los componentes.
- Rejilla y contenedores solo están unificados en las páginas privadas.
- Este documento no incluye capturas ni vistas previas; los valores de las páginas privadas se contrastaron con mediciones en un navegador (Playwright), el resto se redactó leyendo el código.
