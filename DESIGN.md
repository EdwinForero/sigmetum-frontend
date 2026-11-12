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
  danger: "#B42318"
  brand-deep: "#0B7A3B"
  forest: "#0F3D2A"
  sage-soft: "#EAF3EE"
  warning: "#8A5300"
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

Son **tokens** de `theme.extend.colors` en `tailwind.config.js` (`bg-brand`, `text-ink`...); `spacing.nav` (4,5 rem) es la altura de la barra inferior (`h-nav`, `pb-nav`, `bottom-nav`). Los valores y los contrastes los fija `src/theme.test.js`. Se añadieron tokens a la paleta histórica: `brand-deep` y `danger` por la decisión C1 de la auditoría de las páginas privadas, y `forest`, `sage-soft` y `warning` en el pulido de las páginas públicas (12/11/2026). Son la excepción a «No añadas colores nuevos» y se justifican por el contraste (ver abajo); `warning` era el único color semántico que faltaba para los cuatro avisos.

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
| `forest` | `#0F3D2A` | Títulos de las tarjetas de Sobre nosotros, sobre `sage-soft` |
| `sage-soft` | `#EAF3EE` | Fondo de las tarjetas de Sobre nosotros, esqueleto de las fotos de la galería y hover de la navbar. Apenas se distingue de `surface` (1,09:1): se separa con borde `sage`, nunca solo por el fondo |
| `warning` | `#8A5300` | Variante «aviso» (ámbar oscuro), siempre con icono y texto |

### Contraste (WCAG 2.1 AA, recalculado el 12/11/2026)

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
| `forest` sobre `sage-soft` | 10,78:1 | Cumple |
| `ink` / `ink-soft` sobre `sage-soft` | 16,07:1 / 13,73:1 | Cumple |
| `warning` sobre `surface` / sobre blanco | 6,09:1 / 6,33:1 | Cumple |
| `moss` sobre `sage-soft` (borde de hover de la navbar) | 5,76:1 | Cumple |
| `brand-deep` sobre `sage-soft` | 4,81:1 | Cumple (texto grande y normal) |
| `surface` sobre `ink` (pie y banda de Home) | 17,50:1 | Cumple |
| `surface` sobre el velo del hero (`ink` al 70 % mezclado con blanco, foto blanca: peor caso) | 6,53:1 | Cumple |
| **`brand` sobre `surface`** (en los dos sentidos) | **2,57:1** | **No cumple: no se usa para texto ni sobre él** |
| **`sage` sobre `surface`** | **2,02:1** | **No cumple: ya no se usa para texto** |

**Reglas:**
- Texto sobre un relleno `brand` (botón principal, ítem activo, `th` de tabla): `ink`, nunca `surface`.
- Texto o título en verde sobre fondo claro: `brand-deep`, nunca `brand`.
- Placeholders y ayuda: `moss`. Errores: `danger` con icono y texto.
- El color no puede ser la única señal (estado, error, activo): el ítem de navegación activo suma peso y borde (`brand-dark` en la navbar pública, `ink` en la barra de gestión).
- **Estado desactivado:** los botones de texto (`ButtonPrincipal` y el «Enviar» de `ContactForm`) usan borde discontinuo `moss`, sin relleno, texto `moss` (6,27:1) y `cursor-not-allowed`, sin `opacity`: se distinguen sin depender solo del color y cumplen el contraste (criterios 20 y 42 de la spec del pulido). Los botones de solo icono deshabilitados (rama de icono de `ButtonPrincipal`, p. ej. «anterior» de `Pagination`), `ButtonAlternative` deshabilitado y los ítems deshabilitados de `Sidebar` **siguen con `opacity-50`**: antes se daban por exentos (WCAG 1.4.3 exime a los componentes inactivos), pero el objetivo es que todo estado desactivado cumpla (deuda B60). El `<select>` deshabilitado usa `border-moss text-moss opacity-100`.
- **Avisos:** todos sobre `surface`, con borde de 1 px y texto del color de la variante (información `moss`, éxito `brand-deep`, aviso `warning`, error `danger`), sin fondos tintados; el éxito nunca usa `brand` como texto o borde de texto.

**Deuda:** las letras U, M y A del logotipo de `Header` (rojo, azul y verde de marca) están por debajo del umbral pero un logotipo está exento (B42). Quedan hexadecimales arbitrarios en varios componentes (B13, parcial; las páginas públicas, los avisos y `LoginForm` ya usan tokens). El contraste real del texto del hero sobre la foto no se midió con la foto real **(por confirmar)**; el velo uniforme cumple en el peor caso calculado.

## Tipografía

| Token | Fuente | Se aplica a |
|---|---|---|
| `font-primary` | Amaranth | `h1`-`h3`, `th`, `summary` y la cursiva de los nombres científicos (`font-primary italic`) |
| `font-secondary` | Sen | `body`, `p`, `button`, `a`, `label`, `span`, `input`, `textarea`, `select`, `td`, `li` |

Se cargan desde Google Fonts en `index.html` (con `preconnect`), junto con Material Symbols Outlined como subconjunto (`icon_names`, `display=block`; un icono nuevo exige añadirlo a esa lista: `src/iconNames.test.js` lo comprueba). Mukta Malar ya no se pide. Solo se cargan los pesos que se usan: **Amaranth 700 (normal y cursiva) y Sen 400 y 700**. Los iconos están ocultos hasta que carga la fuente y, si falla (`html.icons-failed`), se pinta una caja del color del texto en lugar de la ligadura. **No introduzcas una tercera familia.**

- Los **nombres científicos van en cursiva**, y los términos no latinos (`subsp.`, `var.`) en redonda: lo resuelve `highlightTerms`. No pongas cursiva a otros textos para enfatizar; usa el peso.
- **Roles:** Amaranth para títulos (`h1` a `h3`, `th`, `summary`) y Sen para texto e interfaz (párrafos, etiquetas, controles, botones, enlaces y avisos). Los controles (`input`, `textarea`, `select`, `button`) comparten familia y tamaño (el `textarea` y el `select` ya no usan Amaranth).
- **Escala de tamaños** (la de Tailwind por defecto, sin redefinirla): `sm` 14, `base` 16, `lg` 18, `xl` 20, `2xl` 24, `3xl` 30, `4xl` 36 y `5xl` 48 px; `xs` (12 px) solo en la barra inferior de gestión (bajo 768 px) y el banner de cookies (bajo 640 px). **Pesos:** solo 400 y 700 (se retiraron `font-medium`, `font-semibold` y `font-black`). Medido en las privadas el 12/11/2026: tamaños {12, 14, 16, 18, 20, 24, 32} y solo Sen y Amaranth.
- Cuerpo en 16 px (`text-base`) y interlineado cómodo (`leading-normal` como mínimo) en texto largo; texto corrido con `max-w-prose` y `text-ink-soft`, sin justificar.
- Los botones usan `font-bold`, `text-base` y `leading-tight` y ya no recortan su texto (sin `truncate`): se parten en varias líneas si hace falta.
- Hay un `<h1>` por página en `Home`, `Explorar`, `Galería`, `Sobre nosotros`, `Cookies`, `NotFound`, `Login` y las tres páginas privadas, con un `<h2>` por sección (B18 y B39 resueltos). En páginas nuevas, un `<h1>` por página. El `<h1>` de las públicas mide 36 px y 48 px desde `md` (el de `/explorar`, 30 px) en `brand-deep`, peso 700 y sin `text-transform` (el titular del hero ya no va en mayúsculas); a 1440 px el de Home está en `x`=168 (`page-container`) y a 390 px en `x`=16. Los encabezados de sección van alineados a la izquierda dentro de `.page-container`; solo el enunciado grande de la banda oscura de Home va centrado.
- Los textos de interfaz salen siempre de `t('clave')`: el diseño no puede depender de una longitud fija.

## Espaciado y rejilla

- **Escala con nombre** (tokens de `theme.extend.spacing`; valores computados admitidos {4, 8, 12, 16, 24, 32, 48, 64} px): `gutter` 16, `gutter-md` 24 y `gutter-lg` 32 (margen lateral), `stack-xs` 4, `stack-sm` 8, `stack-md` 12, `stack` 16, `stack-lg` 24 y `stack-xl` 32 (separación dentro de un bloque), `section` 48 y `section-lg` 64 (ritmo entre secciones) y `nav` 72. El código nuevo usa los tokens; las clases por defecto que dan el mismo valor se aceptan sin renombrar. Ritmo: `py-section` en móvil y `md:py-section-lg` entre secciones del mismo nivel, título a contenido `stack-lg` (24 px) y dentro de las tarjetas `stack` (16 px).
- Altura mínima de botón y de campo: `min-h-12` (48 px); objetivos táctiles de 44 px como mínimo (los de solo icono, 48×48).
- Rejilla y anchos máximos: las tres páginas privadas usan el mismo contenedor `mx-auto w-full max-w-6xl px-4 sm:px-5 pb-6` (en la de carga, descripción y formulario van en un `max-w-3xl` alineado a la izquierda, para que el `<h1>` quede en la misma `x`) dentro de un `main` con `min-w-0`; las públicas usan `.page-container` (`mx-auto w-full max-w-6xl px-gutter md:px-gutter-md lg:px-gutter-lg`: márgenes de 16, 24 y 32 px que crecen y no disminuyen al ensanchar). En páginas nuevas, usa un solo `max-w-*` por página y evita anchos fijos en píxeles (`px-40`, `w-[512px]`, `min-w-72` y `max-w-screen` se retiraron de las privadas).
- Portada y galería: mucho espacio vertical. Explorar, tablas y gestión de datos: denso pero con filas legibles.
- **Excepción de `/explorar`:** la `x` del `<h1>` no coincide con la de las otras públicas a 1024 y 1440 px porque la barra lateral de gestión ocupa 112 px a la izquierda (fuera de alcance); se mide respecto del `<main>` (`h1.x − main.x ≥ 0`).

## Profundidad

Plano por defecto. La sombra queda para los elementos flotantes (menús desplegables, diálogos, toasts, tooltip) y, como excepción, para la **cabecera con scroll**: `shadow-md` solo cuando la página se ha desplazado (`scrollY > 0`; arriba desaparece), sin el borde `brand` fijo de antes (la sombra no depende del color). Fichas, tarjetas, avisos y filtros se separan con **borde fino** (`border-sage` o el del aviso), no con sombra.

## Formas

| Radio | Hoy | Uso |
|---|---|---|
| `rounded-xl` (12 px) | Controles | Botones, campos (`TextInput`), `<select>` y selector de idioma |
| `rounded-lg` (8 px) | Superficies | Fichas, tarjetas, avisos, logos y fotos, menús desplegables |
| `rounded` / `rounded-md` | 10 y 2 | Campos y detalles |
| `rounded-full` | 1 | Casos puntuales |

**Regla (12/11/2026):** controles `rounded-xl` y superficies `rounded-lg`, sin inventar valores intermedios. Excepciones: el banner de cookies es una barra a todo el ancho (borde superior, sin radio). Las esquinas no se mezclan dentro del mismo grupo de controles.

## Componentes

Reutiliza `ButtonPrincipal`, `ButtonAlternative`, `ToastProvider` (`useToast`), `InlineError` y, para confirmar o decidir, `DialogAdvice` y `useDialog` antes de crear otros ([docs/05](docs/05-componentes.md)).

- **Botón principal (`ButtonPrincipal`):** fondo `brand`, texto `ink`, hover `brand-dark`, `rounded-xl`, `min-h-12` (48 px), mínimo 84 px de ancho y `max-w-full`. Con `icon`: cuadrado de 48×48, icono `brand-dark` y hover `bg-brand text-ink`. Deshabilitado (con texto): borde discontinuo `moss`, sin relleno, texto `moss` y `cursor-not-allowed`, sin `opacity-50` (la rama de icono sí lo conserva, deuda B60). Exporta `BUTTON_PRINCIPAL_CLASS` y `BUTTON_INACTIVE_CLASS` para los `Link` con aspecto de botón. Con `loading`: `aria-busy` y `aria-disabled` (sin `disabled`, para no perder el foco), el clic se ignora y se ve `progress_activity`. Recibe `...rest` (`aria-expanded`, `id`...). Ya no existe el modo desplegable.
- **Botón alternativo (`ButtonAlternative`):** mismo tamaño y tipografía; fondo `surface`, borde `brand-dark` de 2 px, texto `brand-deep`, hover `bg-brand text-ink`, `rounded-xl`; admite `disabled` (conserva `opacity-50`, deuda B60), `loading` y `...rest`; exporta `BUTTON_ALTERNATIVE_CLASS`. **Un solo botón principal relleno por vista:** en el hero de Home «Explorar» es `brand` y «Galería» es alternativo; en el formulario de contacto «Enviar» es el único `brand` de su bloque.
- **Botones de solo icono:** llevan `aria-label` traducido (claves `iconButton.*`; `ButtonPrincipal` lo recibe en la prop `ariaLabel`), la ligadura del icono con `aria-hidden="true"` y la clase `focus-ring`. En los botones con texto, las ligaduras decorativas (chevrons, `open_in_new`) también llevan `aria-hidden="true"` y no se añade `aria-label`. Área táctil de 44×44 px como mínimo (B1 resuelto en los botones existentes; el área táctil no se ha medido **(por confirmar)**).
- **Botón de mostrar contraseña (dentro de un campo):** botón de solo icono de 48×48 px, en `moss` (6,5:1 sobre blanco), pegado al borde derecho del campo, `rounded-lg`, `overflow-hidden` (hasta que cargue la fuente de iconos el nombre de la ligadura taparía la contraseña), icono `visibility` o `visibility_off` y anillo `.focus-ring`. El `input` reserva `pr-12`. Su `aria-label` es fijo y distinto por campo; el estado va en `aria-pressed`.
- **Clave del MFA y QR:** la clave se muestra en un `<code>` en grupos de 4 caracteres separados por espacios (parte la línea solo entre grupos; sin `break-all`). El QR mide 192 px (`w-48`, `max-w-full`), va centrado, con fondo blanco y quiet zone de 4 módulos dentro del propio SVG (módulos en `ink`), de modo que se lee igual en modo oscuro; no se pinta la dirección `otpauth://`.
- **Fichas (`SpeciesCard`):** `div role="button"` operable con teclado (`tabIndex={0}`, `focus-ring`, Enter y Espacio), `rounded-lg`, `border` en `sage`, fondo `surface` y hover `sage`, altura mínima de 72 px, texto `ink` de 16 px en peso 400 con el nombre científico en Amaranth cursiva.
- **Tarjetas de Sobre nosotros:** tres iguales (`rounded-lg`, `bg-sage-soft`, `border-sage`, relleno `stack-lg`), títulos `forest`.
- **Logos institucionales (`LogoLink`, `config/institutions.js`):** enlace externo con caja `h-16 w-32` y fondo `surface`, a color (sin `grayscale`), con `alt` de la entidad y aviso solo para lectores de «se abre en una pestaña nueva». En el pie van los cinco de las universidades dentro de **una sola placa** `rounded-xl bg-surface` (cinco chips sueltos sobre `ink` serían ruido).
- **Estados vacíos y de error (`EmptyState`):** título `text-xl font-bold text-brand-deep`, una frase de causa en `text-base text-ink-soft` y una sola acción (`Reintentar` o `Quitar filtros`); `role="alert"` solo en el error; sin ilustraciones (fuera de alcance).
- **Visor de la galería (`GalleryViewer`):** modal a pantalla completa sobre `bg-ink/95`, texto `surface`, nombre y «n de N» en una región `aria-live`, imagen solo si `isSafeImageUrl` acepta la URL (S7: `https:`, o `http:` en `localhost` y `127.0.0.1`; si no, caja vacía y sin petición), botones de 48×48 que dan la vuelta en los extremos y nunca se deshabilitan; bajo `md`, anterior y siguiente abajo (zona del pulgar) y cerrar arriba a la derecha; desde `md`, a los lados. Sin animaciones.
- **Navegación principal (`Navbar`) y cabecera:** ítem activo = barra inferior de 4 px `brand-dark` **y** `font-bold`; los demás `font-normal`, mismo borde transparente (el texto no salta) y hover `bg-sage-soft` con `border-b-moss`; en el panel móvil, el activo lleva `bg-sage-soft font-bold underline decoration-4 decoration-brand-dark underline-offset-4` (subrayado de 4 px y negrita, sin franja lateral; decisión del usuario del 12/11/2026, B61; medido a 390 px en local con API simulada). La barra lateral de las privadas conserva su estilo (`bg-brand` con borde `ink`): diferencia consciente entre zona pública y privada. Cabecera: sin borde, `shadow-md` solo con scroll y, bajo 360 px, solo el logo (el nombre sigue en el `aria-label`).
- **Pie (`Footer`):** `bg-ink text-surface` con tres columnas desde `md` (`2fr 1fr 1fr`: Instituciones, Contacto, Enlaces, cada una con su `<h2>`) y una fila final con el copyright y «V 1.0.0»; Galería va entre Explorar y Sobre nosotros. En móvil, los cinco enlaces van en `grid grid-cols-2 gap-x-stack` (una columna desde `md`) con `min-h-11`: el pie mide 944 px a 390 px frente a 1032 con una columna (B62, decisión del usuario; medido en local con API simulada).
- **Menús desplegables:** fondo blanco, borde gris, `rounded-lg`, `shadow-lg` (el panel del menú móvil de `Navbar`).
- **Campos de formulario (`TextInput`, `FilterSearchBar`):** siempre controlados (`value` + `onChange`) y con **etiqueta visible** (`<label htmlFor>` con `id` de `useId`; el `placeholder` no sustituye a la etiqueta y los gestores ya no lo ponen). `h-12 rounded-xl`, borde `brand-dark`, placeholder `moss`, `.focus-ring-inset`; con error, `aria-invalid`, borde y anillo `danger` y `aria-describedby` hacia un `InlineError`. `hint` en `text-sm text-moss` (14 px) bajo el campo; el `textarea` (`multiline`) mide `min-h-32`, más alto que los campos de una línea, y `FilterSearchBar` conserva `pl-10` por la lupa: excepciones documentadas.
- **Cajas de aviso (`noticeStyles`):** `InlineError`, `InfoButton` (tooltip), `DialogAdvice`, los toasts y los avisos de `LoginForm` comparten `NOTICE_BASE` (`rounded-lg border p-stack-md`, icono + texto) y cuatro variantes con color de token (información, éxito, aviso y error; ver «Colores»). Sin sombra salvo toasts y tooltip, que son flotantes. `DialogAdvice` acepta `variant`: las confirmaciones que no son un borrado (campos vacíos de `FileUpload`) y las de borrar de `ImageGalleryManager`, `TermsManager` y `DataManagement` pasan `variant="warning"`, con icono y borde naranja `warning`, también en las páginas privadas (cambio visible del 12/11/2026).
- **Avisos (toasts):** el éxito va a una región `role="status"` y el error a una `role="alert"`, ambas de `ToastProvider` (siempre montadas, `fixed top-20`, por encima del contenido y por debajo del panel de filtros): icono, texto y botón de cerrar de 44×44; el éxito se cierra solo a los 8 s con pausa al pasar el ratón o enfocar, el error se queda hasta cerrarlo. Nunca mueven el foco ni se animan.
- **Error en línea (`InlineError`):** `<p role="alert">` con borde y texto `danger`, icono `error` y el texto; se pone junto al campo o encima del botón que envía, y el foco va al campo solo cuando la validación falla.
- **Banner de cookies (variante B):** barra `sticky` a todo el ancho con `border-t border-moss bg-surface text-ink`, un icono `info` delante del título (`<h2>`) y botones en una fila; los 12 px de `text-xs` (bajo 640 px) y que no sea una tarjeta redondeada son excepciones. Medido a 320×700 el 12/11/2026 (local, API simulada): 217 px en inglés y 233 px en español; con la barra inferior de `/explorar` (72 px), 289 y 305 px, dentro de los 320 px de `scroll-padding-bottom`.
- **Selector nativo (`<select>`):** para elegir una opción de una lista corta (idioma, versión de datos): `<label>` visible o `sr-only`, `h-11`/`h-12`, `rounded-xl`, borde `brand-dark`, `.focus-ring`, fuente Sen (antes Amaranth), deshabilitado con `border-moss text-moss opacity-100` (no `opacity-50`; medido `opacity` 1 en local con API simulada), un `<optgroup>` por grupo y la información del grupo repetida en el texto de la opción (un `<select>` cerrado no muestra la etiqueta del grupo). Es preferible a un desplegable propio: teclado, lector y táctil son los del navegador.
- **Barra de navegación de gestión (`Sidebar`):** inferior fija bajo `md` (`h-nav`, 72 px) y lateral desde `md` (`w-28`), `sticky` bajo la cabecera (`md:top-16`, alto `100dvh - 4rem`) y dentro de la fila flex junto a `main`: ya no es `fixed`, así que no deja hueco debajo ni pasa sobre el pie (medido a 1440 y 768 px en local con API simulada; a 1024 px por confirmar). Etiquetas en `font-normal` y, como excepción, `text-xs` (12 px) y 2 px de borde (barra compartida con las privadas, ancho completo). Aparece solo con la sesión confirmada y se conserva entre páginas privadas durante la revalidación. Cada ítem lleva icono y **etiqueta visible**; enlaces con `aria-current="page"`; activo `bg-brand font-bold` con borde `ink` (superior en la inferior, izquierdo en la lateral) y hover `bg-brand`; «Filtros» es un botón con `aria-expanded` y «Cerrar sesión» un ítem más. El panel de filtros es un diálogo modal (`z-[60]`, hermano de la barra) que cubre cabecera y barra. El banner de cookies, `sticky`, se coloca encima (`bottom-nav md:bottom-0`).
- **Diálogos (`DialogAdvice`, `DialogSpecies`):** entran con un fundido del fondo y una caja que cae con muelle (`stiffness 300`, `damping 25`). Llevan `role="dialog"`, `aria-modal="true"`, `aria-labelledby` con el título y `tabIndex={-1}`, y el hook `useDialogFocus` ([docs/06](docs/06-utilidades-hooks-config.md)) lleva el foco a la caja al abrir, atrapa Tab, cierra con Escape y devuelve el foco a quien abrió. Todo diálogo nuevo reutiliza ese hook (B2 resuelto en `DialogAdvice` y `DialogSpecies`, y el panel de filtros de `Sidebar` lo usa; `CookieBanner` sigue sin cumplir A6). **Diálogo de confirmación de borrado:** `DialogAdvice` con `showActions`, el nombre del elemento en el mensaje (p. ej. «Almería 10/11/2026 · V1») y `confirmText` «Eliminar»; Cancelar y Escape no borran. Tras borrar, el foco va a un encabezado (`.focus-heading`, `tabIndex={-1}`) porque el botón que abrió el diálogo se desmonta.
- **Foco:** nunca quites el contorno sin una alternativa visible. Hay tres clases en `src/index.css` (`@layer components`, sobre `:focus-visible`): `.focus-ring` (contorno `ink` de 2 px con separación de 2 px y un halo `surface` de 2 px por dentro, para que el anillo se vea también sobre fondos oscuros como el `CookieBanner`) y `.focus-ring-inset` (contorno `ink` de 2 px hacia dentro, sin halo, para campos cuyo `input` va dentro de un `label` con `overflow-hidden` que recortaría el anillo exterior: `FilterSearchBar` y `TextInput`) y `.focus-heading` (sin contorno: subrayado de 2 px, con separación de 4 px, del color del texto; es el patrón para **encabezados no interactivos que reciben foco programático** con `tabIndex={-1}`, como el `<h2>` de cada paso de `LoginForm`; un contorno sobre toda la caja del título resultaba un recuadro grueso). Se usa `outline` y no `ring` porque el contorno se mantiene en el modo de alto contraste de Windows. **Aviso:** `.focus-ring` pone `box-shadow` con la misma especificidad que una utilidad de Tailwind y en una capa posterior, así que una utilidad `shadow-*` o `ring-*` futura en ese elemento ganaría sobre el halo; no las combines sin comprobarlo. El pintado, el contraste real y el recorte del anillo no se han visto en un navegador **(por confirmar)**.
- **Tooltip de información (`InfoButton`):** envoltura transparente con `pt-2` (o `pb-2` encima; sin `mt-2`, el hueco es parte del tooltip) y caja interior con `rounded-lg border border-sage bg-surface shadow-lg px-4 py-2 text-sm`, `w-max max-w-[min(28rem,calc(100vw-2rem))]` y desplazamiento horizontal para quedar entre 16 px y `innerWidth − 16`. Con `topic`, el nombre accesible es «Información: <título>».
- **Zona de arrastre (`FileUpload`):** caja `rounded-xl border-2 border-brand-dark p-4` con el icono `upload_file`, texto de ayuda y el botón «Seleccionar archivos»; al arrastrar, borde continuo, `bg-surface`, `font-bold` y el texto de `dropZoneActive`. Miniatura de la galería: `h-12 w-12 rounded-lg border border-sage object-cover`, `alt=""`.
- **Pantallas con datos:** cubren siempre **cargando, error, vacío y éxito** (en las públicas, la carga es un `LoadSpinner` en línea siempre montado, estático, y el vacío y el error son `EmptyState`) (`LoadSpinner` —en línea y siempre montado, con texto, en las listas y selectores—, `InlineError`, texto de vacío que explica qué hacer y `ToastProvider`).
- **Tablas anchas (`Table`):** dentro de `role="region"` con nombre, `tabIndex={0}` y `overflow-x-auto`; `caption` `sr-only` y `th scope="col"` con texto `ink` sobre `brand`. La paginación queda fuera de la región.
- **Listas de gestión:** `<ul aria-label>` con filas `min-h-12`, el nombre con `break-words` y una papelera de 48×48 a la derecha con nombre que incluye el elemento.

## Movimiento

Framer Motion (paquete `motion`) con los patrones que quedan: modal con muelle, cambio de página de `Explore` con deslizamiento horizontal y plegado de listas de `CategoryFilter`. `Home` y `About` ya no revelan por scroll ni usan parallax; la flecha del hero no rebota; la galería, el visor y el esqueleto no se animan. El panel de filtros, los avisos y el selector de versión tampoco. Duración de transiciones de estado (hover, foco): 150–200 ms con `ease` **(sugerencia, por confirmar)**.

**`prefers-reduced-motion` se respeta (B19 resuelto el 12/11/2026):** `App` envuelve todo en `MotionConfig reducedMotion="user"`, `ScrollIndicator` usa `useReducedMotion()` y las transiciones de CSS llevan `motion-reduce:transition-none`; con movimiento reducido emulado, la suite E2E comprueba que no hay fondos fijos ni flecha animada. En código nuevo, usa `useReducedMotion()` o `MotionConfig`, y no dejes animaciones infinitas ni parallax fijo.

## Qué hacer y qué no

### Sí
- Mantén el verde `brand` como acento escaso: un botón principal por vista (en el hero de Home, «Explorar»; ningún otro `bg-brand` relleno).
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

Puntos de corte de Tailwind: `sm` 640, `md` 768, `lg` 1024 y `xl` 1280 px. Se diseña y se comprueba en **cinco anchuras: 320, 375, 768, 1024 y 1280 px** (las páginas públicas, además, con la suite E2E a 390, 768, 1024 y 1440 px). Por debajo de `md`, la navegación principal pasa a menú hamburguesa y la barra de gestión es inferior; desde `md` es lateral. `Explore` ajusta los elementos por página según el ancho. Diseña primero para móvil. Áreas táctiles de 44 px como mínimo. Las tablas anchas se desplazan en horizontal dentro de su región en lugar de romper la página. En la auditoría de las páginas privadas se midieron 320, 375 y 1280 px con Playwright (sin desbordamiento, objetivos ≥ 44 px, cabecera hasta 305 px; procedimiento en [docs/08](docs/08-guia-desarrollo.md#medición-con-playwright)); 768 y 1024 px **(por confirmar)**. En el pulido de las públicas, la cabecera a 320 px mide `scrollWidth` 305 igual a `clientWidth` (antes 343 frente a 321, con el botón del menú fuera de pantalla), la flecha del hero no se cruza con los CTA a 390×844, 1440×700, 1024×600, 320×568 y 390×667 (a 320×568 termina 3 px por debajo del viewport, caso extremo) y la suite E2E no halla desbordes ni solapes. Medido en local con API simulada; backend real, Safari y Firefox **(por confirmar)**.

**Scroll y foco:** `html` lleva `scrollbar-gutter: stable` (el bloqueo del `body` con el panel de filtros abierto no mueve la página; por confirmar con barras clásicas), `scroll-padding-top` (5 rem: cabecera de 4 rem más margen) y `scroll-padding-bottom` (20 rem: barra inferior más banner de cookies compacto en móvil, medido: 217 px (en) y 233 px (es) a 320 px, más 72 px de barra en `/explorar`) para que el elemento enfocado no quede tapado (WCAG 2.4.11).

## Guía de iteración

1. Trabaja un componente cada vez y reutiliza los existentes.
2. Antes de añadir un color, comprueba si ya existe uno en la tabla de arriba.
3. Si mueves la paleta, cámbialo en `tailwind.config.js` (colores del tema), actualiza `src/theme.test.js` y [docs/07](docs/07-i18n-y-estilos.md); quedan hexadecimales arbitrarios en varios componentes (deuda B13, parcial).
4. Verifica a mano con teclado, a 320 px de ancho y en inglés.
5. Si cambias este documento, actualiza los apartados "Hoy" tras contrastarlos con el código.

## Lagunas conocidas

- No hay modo oscuro: **(por decidir)** si se quiere.
- Los hexadecimales de `CategoryFilter`, `Filter`, `Table`, `Login`, `NotFound` y otros aún no usan los tokens (B13); las públicas, los avisos y `LoginForm` sí.
- No se ha medido el contraste de todos los estados hover; el estado desactivado de los botones de icono y de `ButtonAlternative` sigue con `opacity-50` (B60).
- Rejilla y contenedores están unificados en las páginas privadas y en las cinco públicas; `Login` y `NotFound` conservan el suyo.
- El pie en móvil sigue siendo largo (944 px a 390 px, sobre todo por la placa de logos); los enlaces ya van en dos columnas (B62 resuelto). Sin E2E de la rejilla (B59).
- La cursiva de los nombres científicos usa Amaranth cursiva 700, la única cara cursiva que se declara (no existe la 400); el aspecto real frente a la cursiva sintética no se ha comprobado en un navegador con las fuentes reales **(por confirmar)**.
- Este documento no incluye capturas ni vistas previas; los valores de las privadas y de las públicas se contrastaron con mediciones en un navegador (Playwright, en local con la API y la sesión simuladas y las imágenes de S3 rotas), el resto se redactó leyendo el código. Revisión de diseño de la skill `impeccable`: se hizo en el mismo contexto sobre el plan, no sobre una interfaz renderizada ni como el crítico de dos agentes de la skill.
