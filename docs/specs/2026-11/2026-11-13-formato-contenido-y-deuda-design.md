# Formato del contenido y deuda pendiente: spec

Fecha: 2026-11-13 · Estado: cerrado

## Objetivo

El contenido de las páginas no sigue una composición común: en Sobre nosotros hay tres anchos distintos, un párrafo con la tercera columna vacía, tarjetas de contenido desigual y huecos de ritmo irregulares; en Cookies el texto y los separadores miden distinto, las viñetas son texto con «•» y los títulos numerados están escritos a mano. El resto de páginas (Home, Explorar, Galería, 404 y las cinco privadas) debe revisarse con el mismo criterio. El resultado esperado es que la misma clase de elemento (título, párrafo, lista, separador, tarjeta, sección) se vea y se mida igual en todas las páginas, con la escala de `DESIGN.md`, y que se cierre una selección pequeña de deuda (B71 forma parte del bloque de formato) más las sustituciones de hash pendientes (`255a2de`).

Hallazgos de partida (medidos por el orquestador a 1440 px y leídos en el código; las páginas privadas se miden en la verificación, no se han leído a fondo):

- **Sobre nosotros:** párrafo de ~620 px en dos de tres columnas; imagen a 1088 px a ~28 px del párrafo y ~64 px de hueco hasta tres tarjetas de textos de ~330, ~370 y ~480 caracteres (la tercera, mucho más larga). Párrafo a `text-lg` y tarjetas a `text-base`; color `ink-soft` en el párrafo e `ink` en las tarjetas.
- **Cookies:** texto a ~530 px y separadores (`border-t`) a ~730 px; `h2` a 24/36 px y `h3` a 20/30 px; Home usa `h3` a 20/24 px (el mismo nivel, otra talla). Los dos textos con viñetas («Tipos de cookies» y «Cómo utilizamos las cookies») son una sola cadena con «•» y `\n\n` renderizada con `whitespace-pre-line`; la segunda mezcla frase introductoria, cinco viñetas y un párrafo final. Los títulos de categoría llevan «1.» a «4.» dentro de la cadena. Los separadores y los `mt-*` entre bloques no usan los mismos valores en Cookies, Sobre nosotros y Home.
- **Entre páginas:** `h1` de 36/48 px en las públicas salvo `/explore` (30 px, sin salto a `md`); párrafo de lectura `text-base`, `text-lg`, `md:text-lg` y `md:text-2xl` según la página; Home centra su bloque de entidades y alinea a la izquierda el resto; el bloque «Correo» y «Ubicación» de Home usa bordes `ink-soft` distintos a los `moss` de Cookies.

## Decisiones del usuario (2026-11-13)

1. **Sobre nosotros:** dos columnas desde `lg` (párrafo introductorio a la izquierda e imagen a la derecha) y las tres tarjetas debajo, con la misma altura y el mismo ritmo. Cierra B71.
2. **Cookies:** se estructuran las claves de i18n: claves nuevas por elemento de lista y para el cierre, en es y en; `ul`/`li` reales; categorías sin numeración escrita a mano (`ol` o títulos limpios, lo decide el `architect` según accesibilidad); prueba de paridad es/en ampliada. El significado del texto legal no cambia.
3. **Umbrales de diseño:** se aceptan los propuestos (65ch, vacío lateral ≤ 45 %, 72 px, 16/24 px, etc.) como criterios por defecto, salvo lo que `DESIGN.md` o las guías contradigan (si chocan, manda la guía). El `architect` decide con `DESIGN.md` y justifica: la talla del `h3` desde `md`, la talla del `h1` de `/explore` y el ancho de los separadores frente al texto.
4. **Deuda del frontend:** entran B83, B84, B85 y B72 (esta última solo si el nuevo formato de la galería no la cierra; si no la cierra, se mide y queda anotada con su causa). B71 va dentro del bloque de formato. Quedan fuera B82, B79, B80, B81, B63, B46 y B74.
5. **Backend:** solo se sustituyen los hashes (M30 a M32 del `docs/07-estado-y-deuda-tecnica.md` del backend por `255a2de`, y B75 de `docs/09` del frontend). Ningún cambio en el código del backend ni commit propio de código; la edición de su `docs/07` es un cambio de documentación del backend.

## Criterios de aceptación

Convenciones de medición: Playwright con las imágenes reales (`VITE_S3_URL`), anchos **320, 390, 768, 1024, 1440, 1920, 2560 y 3440 px**, idiomas **es y en**, y rutas públicas (`/`, `/explore`, `/gallery`, `/about-us`, `/cookies`, ruta inexistente) más las cinco privadas con sesión y API simuladas. «Escala» = los valores computados {4, 8, 12, 16, 24, 32, 48, 64} px y los tokens `stack*`, `section*` y `gutter*` de `DESIGN.md`. Los umbrales son los aceptados por el usuario (decisión 3); donde se indica «lo decide el architect», el criterio se cumple con el valor que justifique con `DESIGN.md`.

### De código

**Medibles con Playwright (formato)**

1. **Anchos de lectura.** Todo párrafo de prosa de dos o más líneas mide como máximo 65 caracteres de ancho (`65ch` computado) en todos los anchos; ningún párrafo de prosa queda por debajo de 45 caracteres por línea (excepto la última línea) a partir de 768 px. El texto corrido de una misma página usa un único ancho de lectura (los valores computados de los párrafos de prosa de una página coinciden con ±1 px).
2. **Ritmo vertical = escala.** La distancia vertical entre bloques hermanos de cada página pertenece a la escala y es la misma para el mismo tipo de relación en todas las páginas públicas: título a contenido de sección 24 px; título a contenido de un `h3` 16 px; párrafo a párrafo 16 px; elemento de lista a elemento de lista, un solo valor de la escala; sección a sección 48 px bajo `md` y 64 px desde `md`; entre imagen y texto 24 o 32 px (valor único, hoy ~28 px). Ningún margen o hueco de un bloque de contenido queda fuera de la escala (se recorre el DOM de `main` y se comprueban los márgenes y huecos computados).
3. **Escala de títulos única.** Cada nivel tiene el mismo tamaño, peso, color e interlineado en todas las páginas públicas y se comprueba a todos los anchos: `h1` 36 px (48 px desde `md`), `h2` 24 px (36 px desde `md`), `h3` 20 px, todos Amaranth 700 y `brand-deep` (excepciones: el `h1` del hero, `surface` sobre la foto, y los títulos de tarjeta, `forest`). Interlineado de títulos como máximo 1,25 y de prosa 1,5 o más. Lo decide el `architect` con `DESIGN.md` y lo justifica: la talla del `h3` desde `md` (hoy 30 px en Cookies y 24 px en Home; una sola para todas), si el `h1` de `/explore` pasa a 36/48 px o conserva 30 px, y si las gestiones adoptan la misma escala de `h1`.
4. **Listas reales.** Ningún texto visible empieza por «•» y ningún título lleva numeración escrita en la cadena; los grupos de elementos paralelos (tipos de cookies, usos, categorías) son listas con elementos en `ul`/`ol` (el lector de pantalla anuncia «lista, N elementos»; se comprueba el número de `li` y que cada `li` pertenece a un `ul`/`ol`). Las categorías de cookies se muestran sin numeración manual: o bien un `ol` (el número lo pone el navegador) o bien títulos limpios; lo decide el `architect` según accesibilidad y lo justifica.
5. **Separadores.** Todo separador (`border-t`, `border-b`, `hr`) mide lo mismo que el texto del bloque que separa (|Δ| ≤ 1 px entre el ancho del separador y el ancho de la columna de texto adyacente) y arranca en la misma `x`; en cada página, todos los separadores comparten ancho y color. Lo decide el `architect` con `DESIGN.md`: si el texto de Cookies se ensancha al contenedor completo o los separadores se estrechan al texto (afecta a 1 y 5 a la vez; debe cumplir ambos criterios).
6. **Tarjetas de contenido equilibrado.** Las tarjetas de una misma fila (las tres de Sobre nosotros, debajo de las dos columnas) miden la misma altura (|Δ| ≤ 1 px), mismo relleno interior y mismo tamaño de título y texto (hoy el texto de tarjeta es `text-base` y el del párrafo introductorio `text-lg`); el espacio vacío bajo el texto de la tarjeta más corta es de como máximo 72 px (tres líneas). Con `ink` o `ink-soft` según una sola regla para todo el texto corrido. Si el desequilibrio de textos (~330, ~370 y ~480 caracteres) no permite cumplir los 72 px sin cambiar el texto, se anota la medición y el `architect` propone la salida sin editar el texto (el significado institucional no cambia, criterio 16).
7. **Vacíos laterales.** A partir de 1024 px, ningún bloque de contenido de las públicas deja más del 45 % del ancho del contenedor vacío a un lado sin figura, imagen o columna que lo compense (con `65ch` a 18 px el vacío es ~40 %, ver 1). Se mide el ancho útil del bloque frente al del contenedor a 1024, 1440, 1920, 2560 y 3440 px. En Sobre nosotros, desde `lg` el párrafo introductorio y la imagen ocupan dos columnas, sin tercera columna vacía.
8. **Coherencia entre páginas.** Para cada rol (párrafo introductorio, párrafo de sección, título de sección, subtítulo, separador, tarjeta, lista, imagen de contenido), el conjunto {tamaño, peso, color, interlineado, ancho, márgenes} computado es idéntico en todas las páginas donde aparece. Sin hexadecimales arbitrarios, sin anchos en píxeles en las clases (solo los tokens de `tailwind.config.js` y los valores de `DESIGN.md`; un token nuevo exige justificarlo y recalcular contraste en `src/theme.test.js`).
9. **Alineación y encuadre.** La `x` izquierda de `h1`, párrafos, imágenes de contenido y listas de una página coincide con la del contenedor (±1 px) salvo los bloques centrados declarados en `DESIGN.md` (banda oscura y entidades de Home, 404). En Sobre nosotros, desde `lg`, el párrafo está en la columna izquierda y la imagen en la derecha, alineadas a la rejilla; bajo `lg` se apilan y la imagen guarda la misma separación respecto del texto anterior y del posterior (|Δ| ≤ 1 px, valor de la escala) sin solaparse con él.
10. **Sin desbordes ni solapes.** A 320–3440 px, es y en, `scrollWidth <= innerWidth`, sin solapes de bloques de contenido y con objetivos ≥ 44 px (enlaces de texto ≥ 24 px de ancho, como hoy).
11. **Páginas privadas.** Las cinco gestiones y el formulario de subida cumplen 2, 3 (con su propia escala solo si el `architect` lo decide y lo justifica), 8 y 10 a 320, 390, 768, 1024, 1440, 2560 y 911×512, y siguen usando un solo `max-w-*` por página (`DESIGN.md`, Espaciado y rejilla).
12. **Explorar y Galería.** Se mide cabecera, barra de herramientas, rejilla y ficha con los mismos criterios 2, 3, 8 y 10; se conservan los valores documentados de la rejilla de la galería (columnas, huecos de 12 y 16 px) salvo que el `architect` justifique otra cosa.

**No regresión y calidad**

13. `e2e/public-pages.spec.js` (178 pruebas, `npm run e2e -- --workers=1`) pasa. Las aserciones que dependen de la estructura (p. ej. `section p` de Sobre nosotros) se actualizan con criterio y se anotan, no se borran; se añaden pruebas para los criterios 1 a 10.
14. Los tests de traducciones pasan (`src/languages/translations.test.js`: paridad de claves y marcadores `{{x}}` entre es y en, sin traducciones vacías) y se amplían: paridad es/en de todas las claves nuevas de `cookies.*` (elementos de lista y cierre), y la prueba actual de que las claves de cookies no llevan «•» ni `<a>` se extiende a todas las claves de `cookies.*`; además, ninguna clave de título de categoría lleva numeración escrita.
15. `npm test` (`npx vitest run --maxWorkers=2` en local), `npm run build`, `npm run lint` (sin subir el tope de avisos), `npm run quality`, `npm run docs:check` y `npm run agentes:test` (si se toca `plugins/`) pasan; `npm run docs:gate` en verde antes del commit. `src/noInvisibleChars.test.js` pasa (escapes, no caracteres literales).
16. Los textos institucionales y legales (Sobre nosotros y Política de cookies) no cambian de significado: cualquier edición de una cadena es solo estructural (lista, quitar numeración manual, separar frase introductoria y cierre) y las claves de i18n nuevas dejan es y en alineados clave a clave.

**De accesibilidad (la guía manda sobre `DESIGN.md`)**

17. **Orden de encabezados.** Un solo `h1` por página, ningún salto de nivel (`h1` → `h2` → `h3`), también en es y en y a todos los anchos; la numeración visual no cambia el nivel semántico.
18. **Listas semánticas.** Las listas de 4 son `ul`/`ol` reales; los pares título-descripción repetidos (categorías de cookies) se resuelven sin perder el orden de lectura.
19. **Contraste.** Todo texto nuevo o cambiado usa los pares ya validados en `DESIGN.md` (`ink`, `ink-soft`, `brand-deep`, `forest` sobre `sage-soft`, `surface` sobre `ink`); `src/theme.test.js` sigue pasando y no se introduce un par sin medir.
20. **Foco, zoom y movimiento.** Sin pérdida de contenido a 200 % de zoom y 320 px; el foco sigue visible y no queda tapado; `Reveal` no oculta contenido con movimiento reducido (E2E actual); sin cambios de CLS por encima de la línea base (`/about-us`, `/cookies`, `/explore` y `/gallery` a 390 px < 0,1; el objetivo de B72 es < 0,01).

**Deuda (selección aceptada)**

21. **B71** queda resuelta por el criterio 7 en Sobre nosotros: ya no hay tercera columna vacía a `lg`.
22. **B85:** `NavLink` de la barra de gestión muestra el estado activo (`aria-current="page"`) también con barra final (`/manage-data/`); un test que falle por el motivo correcto precede al cambio.
23. **B83:** `/%45xplore` (y el resto de rutas con caracteres codificados que el enrutador decodifica) se pintan como `/explore` con datos y barra, o se documenta con una prueba por qué no (sin pasar datos del usuario a `Link`, `navigate` ni a una expresión regular sin escapar).
24. **B84:** `validateContact.js` acepta y rechaza el mismo conjunto de direcciones que el servidor: `o'brien@example.com` se rechaza en el cliente con el mensaje de correo no válido (el patrón del servidor excluye `,;:<>()'"\` y espacios; el cliente no). Tests con casos válidos y no válidos, incluidos comillas, `\` y `\p{Cf}`.
25. **B72 (condicionada):** se mide el CLS de 0,029 de `/gallery` a 390 px tras el nuevo formato. Si el cambio de formato lo cierra (< 0,01), B72 pasa a «Resueltos» con la medición; si no, se identifica y anota su causa con la medición antes y después, y B72 queda abierta en `docs/09`.

### De documentación

1. `docs/09-estado-actual-y-deuda-tecnica.md`: «Última actualización» con la fecha de hoy; B71, B83, B84, B85 (y B72 solo si se cierra; si no, anotada con su causa y medición) pasan a «Resueltos» con su medición; B82, B79, B80, B81, B63, B46 y B74 quedan abiertas sin cambios salvo lo que se observe; se sustituye «(hash tras el commit)» de B75 por `255a2de`; las cifras (archivos, tests, claves) se actualizan solo aquí.
2. `docs/07-i18n-y-estilos.md` y `DESIGN.md`: la escala de títulos, el ancho de lectura, el ritmo vertical entre bloques, las listas, los separadores y la composición de Sobre nosotros y Cookies describen lo medido; se elimina la propuesta `lg:text-xl` de B71 y la tercera columna vacía de «Espaciado y rejilla» y «Lagunas conocidas»; la fila «Tarjetas de Sobre nosotros» refleja la decisión tomada. Lo no comprobado se marca **(por confirmar)**.
3. `docs/04-paginas.md`, `docs/05-componentes.md` y `docs/06-utilidades-hooks-config.md` (según lo que se toque) reflejan la estructura nueva de las páginas y, si hay componentes o utilidades nuevos, su API; el inventario de claves de i18n de `cookies.*` refleja las claves nuevas.
4. `docs/guias/accesibilidad.md` (A7, A15) y `docs/guias/buenas-practicas-frontend.md` (sección 8 de estilos) se actualizan solo si cambia una regla o una medición que citan; `docs/08-guia-desarrollo.md` recoge las pruebas E2E nuevas.
5. Backend `docs/07-estado-y-deuda-tecnica.md`: M30, M31 y M32 sustituyen «commit de este ciclo» por `255a2de`. Es un cambio solo de documentación en el repositorio del backend (commit propio del usuario, que se indica en el resumen final); no se toca código del backend ni M33 a M35.
6. Aviso de PR (`docs/specs/*-aviso-pr.md`) con `Integración: sin impacto — <motivo>` si se toca un área de contrato (ninguna prevista) o si lo exige `docs:gate`.

## Fuera de alcance

- Reescribir o traducir de nuevo la política de cookies o los textos de Sobre nosotros: solo cambia su estructura.
- Un modo oscuro, cambios de marca o colores nuevos sin decidirlo y medir su contraste.
- Un cambio global de gestión de foco al cambiar de ruta (B82), el 301 de las URL antiguas (B74, requiere `sigmetum-infra`), la prueba con lector de pantalla real (B80) y la investigación del fallo puntual de Vitest (B81).
- B79 (teórico), B63 (3 px de la flecha del hero a 320×568) y B46 (tema de lint aparte): no entran.
- Cualquier cambio de código del backend, incluidos M33 a M35, y cualquier cambio en `sigmetum-infra`.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta el formato. B84 alinea una validación del cliente con la del servidor (el cliente pasa a rechazar lo que el servidor ya rechazaba con `400`); el contrato HTTP de `POST /send-email` no cambia. Fila de `para-backend.md` que cita la copia de la regla de correo (línea 141): comprobar si hay que mencionar `validateContact.js`. La sustitución de hashes en el `docs/07` del backend es documentación interna del backend, no un contrato.
- `docs/integracion/para-infra.md`: no lo afecta; no cambian S3, rutas del CDN ni variables de entorno (`VITE_S3_URL` solo se usa para medir).
- Áreas de contrato de `.claude/flujo.json` previstas: ninguna tocada (`api.js`, `env.js`, `assets.js`, `package.json`, `.github/**`). Si el plan incorpora una dependencia, pasa por justificación y `npm audit`.

## Preguntas abiertas

Ninguna. Las cinco preguntas anteriores quedaron resueltas por el usuario (ver «Decisiones del usuario»). Lo que sigue delegado al `architect` no es una pregunta abierta sino una decisión de diseño que debe justificar con `DESIGN.md` y las guías: talla del `h3` desde `md`, talla del `h1` de `/explore`, ancho de separadores frente al texto, y `ol` frente a títulos limpios en las categorías de cookies.

---

## Decisiones de la puerta 2 (13/11/2026): mandan sobre el texto anterior

- Decisión de composición de Sobre nosotros: dos columnas desde `lg` (párrafo e imagen) y debajo las tarjetas en 2 + 1: las dos cortas en una fila desde `lg` (misma altura) y la larga sola debajo, a lo ancho de la rejilla y con su texto limitado a 65ch.
- Criterio 1: el ancho de lectura único se aplica por rol: párrafos de prosa fuera de tarjetas por un lado y textos de las tarjetas de una misma fila por otro (iguales ±1); todo texto ≤ 65ch (lectura del orquestador, a confirmar en la puerta final).
- Criterio 2: elemento de lista a elemento de lista, un valor por tipo de lista: 8 px en viñetas de prosa, 32 px entre bloques con `h3` y 0 px en listas de enlaces o nombres (objetivos de 44 px contiguos); desviación declarada en `DESIGN.md`. El recorrido del DOM de `main` comprueba `margin-top`, `margin-bottom`, `row-gap` y `column-gap` (los márgenes horizontales no: `mx-auto`).
- Criterio 3: `h3` 20 px y 24 px desde `md`. Excepciones: hero (`surface`), títulos de tarjeta (24 px fijos, `forest`), títulos de diálogo (24 px fijos, `brand-deep`), `EmptyState` (20 px, interlineado 1,4) y visor (20 px, `surface`). Las gestiones, `h1` de 30 px fijos.
- Criterios 6 y 7: las tarjetas de una misma fila (las dos cortas de Sobre nosotros desde `lg`) tienen la misma altura y el vacío bajo la más corta es como máximo 72 px; la larga ocupa sola la fila siguiente. En `/cookies`, si con la fuente real el vacío supera el 45 %, manda `DESIGN.md` (`max-w-prose` y `x` común) y se anota como desviación medida.
- Criterio 11: un solo `max-w-*` de ancho de página; `max-w-prose` es medida de lectura y no cuenta.
- La Navbar pública conserva el patrón `end` (`/explore/` sin activo): desviación anotada en `docs/09`.
