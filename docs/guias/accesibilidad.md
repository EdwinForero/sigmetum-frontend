# Accesibilidad del frontend

Normas para que la web sea utilizable por todas las personas, con el estado real de cada una. SIGMETUM-A es un sitio público de una universidad: el objetivo es **WCAG 2.1 nivel AA**.

- Complementa a [buenas-practicas-frontend.md](buenas-practicas-frontend.md) y a [seguridad.md](seguridad.md).
- Los hallazgos con id (B) están en [09](../09-estado-actual-y-deuda-tecnica.md). La paleta está en [07](../07-i18n-y-estilos.md#paleta).
- Si un cambio contradice una regla de esta guía, **avisa y pregunta** antes de hacerlo.

## 1. Marco

| Elemento | Detalle |
|---|---|
| Norma técnica | WCAG 2.1 AA (equivale a la UNE-EN 301 549 v2.1.2) |
| Obligación legal | El Real Decreto 1112/2018 (accesibilidad de sitios web y aplicaciones móviles del sector público) exige cumplir ese nivel, publicar una **declaración de accesibilidad** y ofrecer un mecanismo de contacto para quejas. Que aplique a este sitio es **por confirmar con el servicio jurídico de la universidad** |
| Declaración de accesibilidad | **No existe hoy** |
| Principios | Perceptible, operable, comprensible y robusto |

## 2. Reglas

### A1. Contraste de color

- **Regla:** texto normal, al menos **4,5:1**; texto grande (18 px en negrita o 24 px) y componentes de interfaz (bordes de campos, iconos), al menos **3:1**.
- **Cómo se comprueba:** cálculo de la relación de luminancia (por ejemplo con la fórmula WCAG o una herramienta de contraste) antes de elegir un color. No hay comprobación automática.
- **Estado: incumple.** Medido el 30/09/2026 con la paleta actual:

| Combinación | Relación | Resultado |
|---|---|---|
| Texto `#F9FBFA` sobre el verde de marca `#15B659` (botones, bloques) | 2,57:1 | No cumple ni el mínimo de texto grande |
| Verde `#15B659` como texto sobre fondo `#F9FBFA` (títulos, enlaces) | 2,57:1 | No cumple |
| Placeholder `#99BBA8` sobre `#F9FBFA` | 2,02:1 | No cumple |
| Texto `#0C1811` sobre el verde `#15B659` | 6,82:1 | Cumple |
| Texto `#F9FBFA` sobre un verde más oscuro `#0B7A3B` | 5,23:1 | Cumple (propuesta) |

- **Decisión pendiente:** oscurecer el verde de marca (alrededor de `#0B7A3B`) o usar texto oscuro sobre los botones verdes. Afecta a la identidad visual: lo decide quien lleve la marca.

### A2. Todo se puede usar con el teclado

- **Regla:** cualquier cosa que se pueda pulsar es un `<button>` o un `<a>` (no un `<div onClick>`); se alcanza con Tab, se activa con Enter o espacio y el orden de foco es lógico.
- **Cómo:** ESLint avisa con `jsx-a11y/click-events-have-key-events` y `jsx-a11y/no-static-element-interactions`; prueba manual recorriendo la página solo con teclado.
- **Estado:** hay avisos abiertos (elementos no interactivos con `onClick`, por ejemplo las filas de `FileDropdown` y las tarjetas de especie).

### A3. El foco siempre es visible

- **Regla:** nunca quites el contorno de foco sin poner uno alternativo visible (`focus-visible:ring-2`, por ejemplo).
- **Estado: incumple.** `outline-none` aparece en 12 sitios sin alternativa (B17).

### A4. Nombre accesible en controles sin texto

- **Regla:** un botón con solo icono lleva `aria-label` traducido, y el icono, `aria-hidden="true"`.
- **Por qué:** los iconos son **texto** (Material Symbols por ligadura): un lector de pantalla leería "delete", "keyboard_arrow_down" o "arrow_circle_down". Es el aviso más repetido de ESLint (`jsx-a11y/control-has-associated-label`).
- **Estado: incumple.** No hay ningún atributo `aria-*` ni `role` en el código (B16).

### A5. Formularios

- **Regla:** cada campo tiene su `<label>` asociado (`htmlFor` + `id`, o anidado); el `placeholder` no sustituye a la etiqueta; los errores se anuncian (`role="alert"` o `aria-live`) y se asocian al campo (`aria-describedby`); los campos obligatorios se indican.
- **Estado: incumple** en `LoginForm`, `ContactForm` y los campos de texto (B3). Además, en el acceso el botón está fuera del `<form>`, así que Enter no envía (B4).

### A6. Diálogos

- **Regla:** `role="dialog"` (o `alertdialog`), `aria-modal="true"`, `aria-labelledby` con el título, foco que entra al abrir y vuelve al elemento de origen al cerrar, foco atrapado dentro y cierre con **Escape**.
- **Estado: incumple** en `DialogAdvice` y `DialogSpecies` (B2).

### A7. Estructura y navegación

- **Regla:** una sola `<h1>` por página, y los niveles de encabezado no se saltan; existen `<header>`, `<nav>`, `<main>` y `<footer>`; hay un enlace "Saltar al contenido".
- **Estado:** los puntos de referencia existen. Solo `Home`, `Cookies` y `NotFound` tienen `<h1>`; el resto abre con `<h2>` (B18). No hay enlace para saltar al contenido.

### A8. Idioma

- **Regla:** el atributo `lang` del documento coincide con el idioma mostrado.
- **Estado: incumple.** `index.html` fija `lang="es-ES"` y nada lo cambia cuando `LanguageSwitcher` pasa a inglés (B15). Con un efecto que actualice `document.documentElement.lang` al cambiar de idioma se resuelve.

### A9. Imágenes

- **Regla:** las imágenes informativas llevan un `alt` que describe su contenido; las decorativas, `alt=""`.
- **Estado: incumple.** `ImageComponent` pone `alt="Imagen"` en todas, incluidos los logos institucionales, que deberían llevar el nombre de la entidad. El logo de la cabecera tiene `alt="Logo"` (B5). En la galería el `alt` es el nombre de archivo.

### A10. Enlaces

- **Regla:** el texto del enlace dice a dónde lleva; los que abren pestaña nueva lo indican; los enlaces que solo contienen una imagen llevan el `alt` de esa imagen.
- **Estado:** nueve avisos de `jsx-a11y/anchor-has-content` (logos dentro de enlaces, sin `alt` útil).

### A11. Movimiento

- **Regla:** se respeta `prefers-reduced-motion`; nada parpadea ni se mueve sin control del usuario más de 5 segundos.
- **Cómo:** `useReducedMotion` o `<MotionConfig reducedMotion="user">` de Motion, y `@media (prefers-reduced-motion: reduce)` para CSS.
- **Estado: incumple** (B19): fondo con parallax (`background-attachment: fixed`), flecha con rebote infinito y transiciones de página.

### A12. Contenido dinámico

- **Regla:** los estados de carga y los mensajes que aparecen sin acción del usuario se anuncian (`role="status"` o `aria-live="polite"`; los errores, `role="alert"`).
- **Estado: incumple.** `LoadSpinner` no anuncia nada.

### A13. Tooltips

- **Regla:** se muestran también con el foco del teclado, se ocultan con Escape, y el botón se asocia a su texto con `aria-describedby`.
- **Estado: incumple.** `InfoButton` reacciona al ratón y al clic, pero no gestiona el foco ni `aria-describedby`.

### A14. Tablas

- **Regla:** cabeceras `<th scope="col">` y un título o descripción que explique qué muestra la tabla.
- **Estado:** `Table` usa `<th>` pero no `scope` ni título.

### A15. Adaptación y zoom

- **Regla:** la página se usa a 320 px de ancho y con zoom del 200 % sin scroll horizontal ni pérdida de contenido; los elementos que se pulsan son lo bastante grandes (WCAG 2.2 pide 24 por 24 píxeles como mínimo; conviene cumplirlo aunque el objetivo sea la 2.1).
- **Estado:** `FilesUpload` usa `px-40` fijo y `Explore` usa `whitespace-nowrap`, lo que puede desbordar en móvil. Por revisar con una prueba real.

## 3. Cómo se comprueba

| Capa | Qué cubre | Cuándo |
|---|---|---|
| **ESLint `jsx-a11y`** (`npm run lint`) | Etiquetas, `alt`, eventos sin teclado, roles. Los avisos tienen un tope que no puede crecer | En cada cambio |
| **Teclado** | Recorrer la página solo con Tab, Enter, espacio y Escape | Cada pantalla nueva o modificada |
| **Lector de pantalla** | NVDA con Firefox o Chrome en Windows; VoiceOver en Safari | Antes de fusionar cambios de interfaz importantes |
| **Axe DevTools o Lighthouse** | Contraste, nombres, estructura | Cada pantalla nueva |
| **Zoom y móvil** | 200 % de zoom y 320 px de ancho | Cada pantalla nueva |
| **Playwright + axe** (pendiente) | Automatizar axe en las rutas públicas | Siguiente paso recomendado |

ESLint solo detecta una parte de los problemas: no puede juzgar el contraste, el orden de foco ni si un texto alternativo tiene sentido. Las pruebas manuales no se pueden omitir.

## 4. Lista de comprobación para una PR con interfaz

- [ ] Se puede hacer todo solo con el teclado y el foco es visible.
- [ ] Los botones de solo icono tienen `aria-label` y el icono `aria-hidden`.
- [ ] Los campos tienen etiqueta asociada y los errores se anuncian.
- [ ] Los colores nuevos cumplen el contraste (4,5:1 texto, 3:1 componentes).
- [ ] Las imágenes tienen `alt` útil (o vacío si son decorativas).
- [ ] Los diálogos nuevos cumplen A6.
- [ ] La animación nueva respeta `prefers-reduced-motion`.
- [ ] Se ha revisado a 320 px y con zoom al 200 %.
- [ ] `npm run lint` no supera el tope de avisos; si se corrigieron avisos, se bajó el tope.

## 5. Declaración de accesibilidad

Por el Real Decreto 1112/2018 hay que publicar una declaración de accesibilidad (estado de conformidad, contenidos no accesibles y su motivo, fecha, y un canal de contacto). **Falta.** Hasta que los hallazgos B2 a B5 y B15 a B19 y el contraste se resuelvan, su estado sería de conformidad parcial. Decidir con la universidad quién la redacta y dónde se publica (por ejemplo en el pie, junto a "Cookies").

## 6. Mantener esta guía

- Al resolver una regla, se actualiza su "Estado" y se mueve el hallazgo a "Resueltos" en [09](../09-estado-actual-y-deuda-tecnica.md).
- Si se automatiza una comprobación (axe en Playwright, por ejemplo), se mueve de "pendiente" a la tabla de la sección 3.
- Si cambia la paleta, se recalculan y se actualizan las relaciones de la regla A1.
