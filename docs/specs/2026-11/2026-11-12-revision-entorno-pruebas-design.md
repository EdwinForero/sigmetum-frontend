# Revisión del entorno de pruebas: diseño, funcionalidad, rutas en inglés, tres páginas de contenido, animaciones y deuda: spec

Fecha: 2026-11-12 · Estado: cerrado

## Objetivo

Revisar con Playwright el entorno de pruebas (rama `feature/sigmetum_front_v2`, backend de dev) en todos los anchos y funciones, y corregir lo que falle. Hay un fallo funcional grave (H1: `/administrar-datos` no muestra datos de ninguna versión porque el backend responde 500 con un `.xlsx`), varios desajustes de composición (H2 a H5), la separación de «Contenido» en tres páginas (H6), la recuperación de las animaciones de aparición al hacer scroll (H7) y la estandarización de **todas las rutas del frontend a inglés** con redirecciones desde las españolas (H10). Además, una selección de deuda relacionada, ya decidida.

Decisiones del usuario incorporadas (antes preguntas abiertas):

1. Tres páginas separadas de «Contenido» (términos, galería, destinatarios); `/administrar-contenido` redirige a la primera; en `Sidebar`, tres entradas que sustituyen a «Contenido». Además, todas las rutas pasan a inglés (H10).
2. Animaciones: bloques más escalonado ligero; privadas solo con un fundido suave de entrada de página.
3. Ancho común `max-w-6xl` para cabecera, contenido y pie; hero y bandas de color a sangre.
4. Deuda: B64, B65, B66, B67, B68, B70 y, si la medición lo confirma, B49, B52, B53. M30 a M32 del backend no entran.
5. `GET /get-data` para `.xlsx`: filas convertidas, igual que el JSON activo; `.xlsx` corrupto: `422` con mensaje claro.

Supuestos de partida:

- Entorno medido: `https://feature-testing.d37662kpg8985h.amplifyapp.com`. Los hallazgos H1 a H9 vienen medidos por el orquestador; lo listado como «no medido» lo mide este ciclo antes de darlo por bueno.
- El backend se toca en este ciclo, con su propio commit y su propia PR; **se despliega primero**. El commit y el push los hace el usuario.
- Las cifras de código, tests y claves solo viven en `docs/09`; no se fijan aquí.
- «Endpoints en inglés» se interpreta como las **rutas del frontend** (URL de la SPA). Los endpoints de la API del backend ya están en inglés (ver «Impacto en contratos externos»).
- Causa de H1 contrastada con el código del backend: `GET /get-data/:path` (`routes/data.js`) llama a `getFileFromS3` (`aws/awsS3connect.js`), que hace `JSON.parse` del objeto; la clave `.xlsx` pasa la lista de permitidos (`isValidGetDataKey`) pero no es JSON (deuda D1 de `docs/04-api.md`). El flujo de subida y activación ya convierte el Excel con `convertExcelToJson` (primera hoja, fila 1 de cabecera, 11 columnas fijas, listas por comas) y escribe ese resultado en `data/active/<provincia>.json`. El frontend llama a esa ruta desde `FileDropdown` (`api.get('/get-data/<key>')`).

## Mapa de rutas (H10)

Lista real leída de `src/App.js`. Esquema propuesto: inglés, minúsculas, kebab-case, sustantivo para páginas públicas y verbo en infinitivo + sustantivo para las de gestión.

| Ruta actual | Ruta nueva | Tipo |
|---|---|---|
| `/` | `/` (sin cambio) | pública |
| `/explorar` | `/explore` | pública |
| `/galeria` | `/gallery` | pública |
| `/sobre-nosotros` | `/about-us` | pública |
| `/cookies` | `/cookies` (sin cambio) | pública |
| `/login` | `/login` (sin cambio) | pública |
| `/cargar-archivos` | `/upload-files` | privada |
| `/administrar-datos` | `/manage-data` | privada |
| `/administrar-contenido` | redirige a `/manage-terms` | privada (retirada como página) |
| (nueva) | `/manage-terms` (excepción de no latinismos) | privada |
| (nueva) | `/manage-gallery` (gestión de galería) | privada |
| (nueva) | `/manage-recipients` (destinatarios de consultas) | privada |

Los nombres son una propuesta del requisito; la arquitectura puede ajustarlos mientras se respete el esquema (inglés, kebab-case, coherentes entre sí).

## Criterios de aceptación

### Medición (transversal, Playwright)

Procedimiento en `docs/08-guia-desarrollo.md#medición-con-playwright`. La medición la ejecuta el orquestador (único con el MCP); la suite E2E local cubre lo que pueda automatizarse.

M1. Anchos obligatorios: 320, 390, 768 (vertical y horizontal: 768×1024 y 1024×768), 1024, 1280, 1440, 1920, 2560 y 3440. Cada ruta se mide en los anchos de la tabla de rutas.
M2. En cada ruta y ancho: `document.documentElement.scrollWidth <= clientWidth` (sin desbordamiento horizontal), sin solapes entre elementos interactivos y cero imágenes sin `alt`.
M3. Antes de dar un hallazgo por cerrado se guarda la medición «antes» y «después» (x del `<h1>`, anchos de contenedor, alturas) en el resumen del tester; las capturas se hacen con scroll real (para forzar la carga perezosa) y no solo a pantalla inicial.
M4. Lo no medido todavía se mide y se anota el resultado (correcto o bug): cargar-archivos completo (subir, quitar, errores, borrador con celdas vacías), borrado de datos, login, logout y expiración de sesión, formulario de contacto real, filtros y paginación de `/explore` a todos los anchos, visor de galería a todos los anchos y con teclado (flechas, Escape, Tab atrapado, foco devuelto), selector de idioma, menú móvil, banner de cookies (aceptar, configurar) y `/cookies`, 404, tablets, contraste y foco en las privadas, y las animaciones (H7). Cada bug encontrado se reproduce en un test o en una medición antes de corregirlo (TDD).
M5. Lo que no se pueda medir (Safari, Firefox, backend real, barras de desplazamiento clásicas) se marca **(por confirmar)**.

Tabla de rutas y anchos (medición mínima; «todos» = M1 completo; rutas ya con el nombre nuevo):

| Ruta | Tipo | Anchos mínimos | Qué se mide además |
|---|---|---|---|
| `/` (Home) | pública | todos | H2, H3, H8, hero, imágenes con scroll real, formulario de contacto |
| `/explore` | pública | todos | H4, filtros, paginación, descargas, tabla, ficha de especie |
| `/gallery` | pública | todos | rejilla, visor con teclado, B68 |
| `/about-us` | pública | todos | H5, tarjetas de igual altura |
| `/cookies` | pública | 320, 390, 768, 1024, 1440, 2560 | banner y página |
| Cualquier ruta inexistente (404) | pública | 320, 390, 768, 1440, 2560 | composición y animación |
| `/login` | pública | 320, 390, 768, 1440 | flujo con MFA solo si hay credenciales de prueba **(por confirmar)** |
| `/upload-files` | privada | 320, 390, 768, 1024, 1440, 2560 | flujo completo, foco, contraste |
| `/manage-data` | privada | 320, 390, 768, 1024, 1440, 2560 | H1, selector de versión, tabla, borrado |
| `/manage-terms`, `/manage-gallery`, `/manage-recipients` | privada | 320, 390, 768, 1024, 1440, 2560 | H6 |
| Las nueve rutas españolas antiguas (ver R2) | — | 390 y 1440 | redirección, con barra, `?` y `#` |

### De código: H1 (backend, el más grave)

B1. `GET /get-data/data/<provincia>/AAAA-MM-DD_vN.xlsx` responde `200` con `{ "success": true, "data": [...] }`, donde `data` son las filas de la primera hoja con las **mismas claves, orden de columnas y reglas de lista por comas** que escribe el flujo de subida y activación en `data/active/<provincia>.json` (la conversión que ya usan `POST /upload`, `POST /upload/confirm` y `POST /update-file`). Una prueba sube un Excel de prueba y comprueba que el `data` de la versión es igual (`deepEqual`) al JSON activo generado del mismo Excel.
B2. La clave activa `data/active/<provincia>.json` responde lo mismo que antes (sin regresión) y `GET /get-merged-data` no cambia.
B3. Las filas con campos vacíos se devuelven igual que en el JSON activo (la respuesta no filtra ni falla por celdas vacías).
B4. Una versión inexistente sigue dando `404`, y una clave no permitida sigue dando `400 Invalid path` sin llamar a S3. Un `.xlsx` corrupto (no se puede leer como libro de Excel) da `422` con un mensaje claro en el campo `error` del envoltorio (`{ success: false, error }`), no el `500` genérico; el fallo se registra en el log del servidor. Una prueba con un buffer no válido lo comprueba.
B5. Una provincia con tilde (Málaga, en NFC) funciona en `GET /get-data` y en el flujo completo (clave codificada en la URL). Se prueba también contra el entorno de pruebas desplegado, con `Jaén` y `Málaga`.
B6. Las pruebas del backend pasan con `node --test --test-concurrency=2` en local y con Node 22 (`npx -y node@22`, el de la CI); el lint del backend pasa.
B7. Sin dependencias nuevas en el backend (`exceljs` ya está), salvo justificación y `npm audit`.

### De código: H1 (frontend)

F1. En `/manage-data`, elegir cada versión de cada provincia del entorno de pruebas (al menos Jaén V1 y V2, y una con tilde) muestra la tabla con datos y sin mensaje de error; se mide con Playwright contra el backend de dev desplegado con B1 a B5. Hasta que el backend esté desplegado, la medición se hace con API simulada y se marca **(por confirmar contra backend real)**.
F2. Los estados ya correctos se conservan: error con «Reintentar», respuestas desordenadas descartadas, deseleccionar vuelve a vacío y el cambio entre versiones muestra el estado de carga.
F3. Se prueba también el borrado de una versión (la lista y el activo se actualizan) y que una lista por comas se pinta legible en la tabla.
F4. Contrato: `docs/integracion/para-backend.md` refleja el nuevo comportamiento de `GET /get-data` con `.xlsx` (incluido el `422`); sin cambios en `src/services/api.js` salvo que la medición demuestre lo contrario.

### De código: H10 (rutas del frontend en inglés)

R1. Todas las rutas de la SPA siguen el mapa «Mapa de rutas»: cada ruta nueva responde con su página; en el código no queda ninguna cita de las rutas españolas salvo la tabla de redirecciones (comprobable con una búsqueda en `src/` y `e2e/`).
R2. Cada ruta española antigua (`/explorar`, `/galeria`, `/sobre-nosotros`, `/cargar-archivos`, `/administrar-datos`, `/administrar-contenido`) redirige con `Navigate replace` (sin añadir entrada al historial) a su ruta nueva; `/administrar-contenido` va a `/manage-terms`. Se conservan la cadena de consulta y el `#ancla` si los hay, y se admite la barra final. Una prueba de `App` cubre las seis redirecciones.
R3. Las redirecciones de rutas privadas llevan al mismo control de sesión: sin sesión, una ruta privada antigua termina en `/login` y no muestra la barra de gestión ni contenido privado (la sesión se sigue confirmando solo en `ProtectedRoute`).
R4. Las redirecciones no producen parpadeo de contenido ni cambian el título del documento erróneamente: tras redirigir, `document.title` es el de la ruta nueva (`useDocumentTitle`).
R5. Se actualizan todos los sitios que citan rutas: `Navbar`, `Footer`, `Sidebar` (incluido su mapa de entradas por ruta), `ProtectedRoute`, `LoginForm` (destino tras iniciar sesión), `CookieBanner`, `FileDropdown`, `Home`, `useDocumentTitle` (mapa de títulos), `App` (listas de rutas privadas, `showSideMenu` y comparaciones de ruta), la suite E2E (`e2e/`), todos los tests que las citan y los textos (`t()`) que las nombren. Sin enlaces rotos: una búsqueda y la E2E de enlaces de navegación lo comprueban.
R6. `/login` y `/cookies` no cambian (ya están en inglés); `src/services/api.js` sigue redirigiendo a `/login` sin cambios.
R7. Backend e infra: se revisan y se anota el resultado. Hoy: en el código del backend no hay citas de las rutas del frontend; en la documentación de integración del backend (`para-frontend.md`), de infra (`para-frontend.md`, `estado-y-deuda-tecnica.md`) y del frontend (`para-infra.md`, `para-backend.md`) hay ejemplos con `/explorar` y otras rutas que se actualizan al nombre nuevo (los de infra, solo como aviso, porque `sigmetum-infra` es solo lectura). La regla de reescritura de SPA es un catch-all sin lista de rutas, de modo que no necesita cambios **(por confirmar contra el código de `sigmetum-infra`)**. Correos, CORS y URL de retorno de Cognito: no se han hallado rutas del frontend; se confirma con búsqueda y, si aparece alguna, se anota en el aviso.
R8. No hay cambios de contrato de la API: ningún endpoint del backend se renombra en este ciclo. Si la revisión encuentra alguno no inglés, se anota como deuda con el impacto de contrato y no se renombra aquí.
R9. Documentación al día con las rutas nuevas (ver «De documentación»), y el aviso de PR explica que las URL españolas antiguas se mantienen como redirecciones.

### De código: H2 (alineación de cabecera, contenido y pie; ultrawide)

D1. A 1280, 1440, 1920, 2560 y 3440 px el borde izquierdo y el derecho del contenido de la cabecera (logo e idioma a la izquierda, navegación a la derecha), de las páginas públicas y del pie coinciden dentro de ±1 px (`getBoundingClientRect` del primer y del último elemento visibles de cada bloque). A 320, 390, 768 y 1024 px no se pierde el margen lateral existente (16, 24 y 32 px).
D2. Hay un único ancho máximo, `max-w-6xl`, para el contenido de cabecera, contenido y pie. El fondo de la cabecera y del pie y las bandas de color siguen a sangre (el ancho máximo solo limita el contenido interior). A 2560 y 3440 px queda la «isla» central asumida por el usuario; se comprueba por captura y por la distancia horizontal entre el logo y el primer enlace de navegación (la misma que a 1440 px dentro de ±1 px).
D3. Las páginas privadas (con la barra lateral de gestión) mantienen su alineación y no desbordan a 2560 y 3440 px; el `<h1>` de las tres páginas privadas actuales y de las tres nuevas queda en la misma `x`.
D4. El ancho máximo es un token o una clase usada igual en todas las páginas públicas y se documenta en `DESIGN.md` («Espaciado y rejilla»); sin anchos fijos en píxeles.
D5. El hero y las bandas de color (y la galería a ancho completo) siguen a sangre y sin barras horizontales; el contenido de cada una queda dentro del ancho común.

### De código: H3 (Home, entidades)

E1. «Proyecto liderado por…», «Otras universidades» y «Entidades colaboradoras» quedan centradas respecto del contenedor y entre sí: el centro horizontal de cada bloque coincide con el del contenedor dentro de ±1 px a 390, 768, 1024, 1440 y 2560 px.
E2. La Universidad de Málaga con sus 11 nombres no queda en una columna estrecha con un vacío a la derecha: la anchura ocupada por cada bloque de entidades es al menos el 60 % de la del contenedor a 1024 px y más (umbral propuesto, **por confirmar** con la captura «después»).
E3. La separación vertical entre entidades es regular: la diferencia entre separaciones consecutivas del mismo grupo es ≤ 1 px y todas pertenecen a la escala de espaciado `{4, 8, 12, 16, 24, 32, 48, 64}`.
E4. Los logos de Huelva, Jaén y el resto son visibles tras un scroll real a 390 px (`naturalWidth > 0` y la captura no los muestra en blanco). Si la causa es la carga perezosa o el esqueleto, queda corregida; si es un artefacto de la captura sin scroll, se anota y no se cambia código.
E5. Los logos conservan el `alt` y la relación de aspecto; los nombres de las entidades siguen siendo texto real.

### De código: H4 (Explorar)

X1. El borde izquierdo del contenido de `/explore` queda alineado con el de las demás páginas públicas, o la diferencia se debe solo a la barra lateral de gestión y se mide respecto del `<main>` según la excepción actual de `DESIGN.md`; la medición dice cuál es el caso, y la excepción se cierra si deja de ser necesaria.
X2. La fila «Download glossary / Download results» y sus botones de información no queda apretada junto a la paginación: separación vertical mínima de 16 px a 390 y 768 px, y sin solape ni salto de línea feo a 320 px. Los botones «i» conservan su objetivo táctil (48×48) y el tooltip no se corta por el borde.
X3. Se revisa el ritmo vertical de `/explore` con los tokens de la escala (`py-section`, `stack-lg`, `stack`); no quedan espacios fuera de la escala sin motivo.
X4. Sin regresión en filtros, paginación (con movimiento reducido, sin deslizamiento), tabla y ficha de especie con teclado.

### De código: H5 (Sobre nosotros)

S1. El párrafo introductorio y la imagen a ancho completo quedan compuestos con equilibrio a 1024 px y más: no queda a la derecha del párrafo un vacío de más de la mitad del contenedor (la composición, dos columnas o medida de lectura equilibrada, la elige la arquitectura dentro de `DESIGN.md`: texto corrido con `max-w-prose` y sin justificar).
S2. Las tres tarjetas siguen con alturas iguales a todos los anchos medidos (diferencia ≤ 1 px por fila) y se apilan en una columna a 390 px sin desbordes.
S3. Contraste y jerarquía de encabezados sin cambios (un único `<h1>`).

### De código: H6 (tres páginas de gestión de contenido)

C1. Existen tres páginas privadas, cada una con su ruta (`/manage-terms`, `/manage-gallery`, `/manage-recipients`), su `<h1>`, su título de documento (`useDocumentTitle`), sus textos en `es` y `en` y su entrada propia en la barra de gestión (`Sidebar`): Excepción de no latinismos (`TermsManager`), Gestión de galería (`ImageGalleryManager`) y Destinatarios de consultas (`ContactRecipientsManager`).
C2. Cada ruta nueva va dentro de `ProtectedRoute` y de `isPrivateRoute` de `App` (la barra de gestión solo se muestra con sesión confirmada, como las privadas actuales); sin sesión, redirige al login.
C3. `/administrar-contenido` ya no es una página: redirige a `/manage-terms` (R2). Se mide con un enlace directo y con una recarga (la reescritura de SPA, I3 de `para-infra.md`, ya está en el entorno de pruebas).
C4. `Sidebar` muestra tres entradas nuevas (términos, galería, destinatarios) que sustituyen a la de «Contenido», en su misma posición (entre «Datos» y «Cargar archivos»), con nombre accesible, icono, estado activo (`aria-current`) y orden coherente a todos los anchos de la tabla: lateral desde `md`, inferior por debajo. Con el número final de entradas, la barra inferior no desborda a 320 px ni tapa contenido (`BOTTOM_BAR_HEIGHT` y `scroll-padding-bottom` siguen válidos) y los objetivos táctiles miden ≥ 44 px. Los iconos de las tres entradas son distintos entre sí.
C5. Cada página usa el contenedor de las privadas (`mx-auto w-full max-w-6xl px-4 sm:px-5 pb-6`), con el `<h1>` en la misma `x` que `/manage-data` y `/upload-files` y un único panel a ancho completo (sin el `grid` de dos columnas ni el `lg:col-span-2` de hoy).
C6. El foco, los anuncios y los mensajes de cada panel se conservan (foco al `<h2>` tras quitar un destinatario, etc.); no queda un `<h2>` por `<h1>` duplicado y el orden de Tab de cada página es coherente.
C7. Tests: una prueba por página (título, `<h1>`, contenido, ruta protegida), una de `Sidebar` con las entradas, una de `useDocumentTitle` con las tres rutas, una de `App` con las rutas nuevas y la redirección de `/administrar-contenido`, y una de i18n que comprueba que las claves nuevas existen en `es` y `en` con el mismo conjunto.
C8. Los textos que ya existen (`contentManagement.*`, términos, galería, `contactRecipients.*`) se reutilizan; las claves nuevas siguen el patrón actual y no se duplican.

### De código: H7 (animaciones de aparición al hacer scroll)

A1. Una única definición de la animación de aparición (duración, desplazamiento, easing, escalonado y umbral) usada por todas las páginas donde se aplique; sin parámetros distintos por página.
A2. Valores medibles: opacidad de 0 a 1; desplazamiento vertical de entrada ≤ 12 px; duración entre 300 y 600 ms; easing de salida suave (`ease-out` o curva equivalente, sin rebote ni muelle); escalonado entre hermanos ≤ 80 ms y ≤ 6 elementos escalonados por bloque; una sola ejecución por elemento (al volver a pasar por la pantalla no se repite). Los valores exactos los afina la arquitectura y se registran en `DESIGN.md`.
A3. Páginas públicas animadas: Home, Sobre nosotros, Explorar, Galería, Cookies y 404. Granularidad: cada sección o bloque aparece (opacidad y ~12 px, una vez); además, logos, tarjetas y filas aparecen con un escalonado muy leve dentro de su bloque (A2 fija el máximo). El visor y el esqueleto de la galería siguen sin animación.
A11. La rejilla de la galería y las tarjetas de `/explore` se animan **solo en la primera carga**: no se repite al paginar, filtrar, cambiar de columnas ni al volver a pintar la lista. Una prueba lo comprueba (se cambia de página o filtro y no hay animación nueva).
A12. Privadas (`/upload-files`, `/manage-data`, `/manage-terms`, `/manage-gallery`, `/manage-recipients`): solo un fundido suave de entrada de página (opacidad, sin desplazamiento, misma duración y easing que A2), una sola vez por navegación; sin aparición por bloque ni escalonado. No afecta al foco, a los anuncios ni a `ProtectedRoute` (el contenido privado sigue sin pintarse sin sesión confirmada).
A4. Con `prefers-reduced-motion: reduce` emulado en Playwright, ningún elemento tiene `transform` distinto de `none` ni `opacity` inferior a 1 en ningún instante tras la carga, y no hay animaciones de aparición activas (`getComputedStyle` y `document.getAnimations()`), también en las privadas (A12).
A5. CLS `< 0,01` medido con `PerformanceObserver` de `layout-shift` durante una carga y un scroll completo de cada ruta animada a 390, 1440 y 2560 px: la animación solo cambia `transform` y `opacity` y el espacio del elemento está reservado antes de aparecer.
A6. Contenido visible por defecto: si `IntersectionObserver` no existe o falla, todo el contenido es visible (`opacity: 1`); se prueba con un test que lo elimina. (Con JavaScript desactivado la SPA no pinta nada, así que no es un criterio medible **(por confirmar)**.)
A7. Lo que ya está en pantalla al cargar (por encima del pliegue) no espera: el primer bloque no se retrasa más de 100 ms ni empeora el LCP más de 100 ms respecto de la línea base medida antes del cambio **(línea base por medir)**.
A8. El anclaje `/#contacto`, el foco programático (`ScrollIndicator`, `onSent`) y el uso con teclado funcionan: un elemento aún no animado que recibe foco o es destino de un ancla se hace visible de inmediato.
A9. Sin dependencias nuevas: se usa `motion` (importado de `motion/react`, ya en el proyecto) o CSS con `IntersectionObserver`; cualquier biblioteca nueva se justifica y pasa `npm audit`. Se respeta `MotionConfig reducedMotion="user"` de `App` y la guía de animación (solo `transform` y `opacity`, sin animaciones infinitas).
A10. Tests: la lógica de aparición (una sola vez, observador ausente, movimiento reducido, solo primera carga de la rejilla) tiene pruebas unitarias; la E2E local cubre A4 y A5.

### De código: H8 y accesibilidad general

Y1. El enlace «here/aquí» del banner de cookies (hoy 25×14 px) tiene un objetivo táctil suficiente: mínimo 24×24 CSS px (WCAG 2.2, 2.5.8) y, si no es posible por ir en línea dentro de una frase, la excepción de enlace en línea queda documentada y se mide su separación con los vecinos. La meta de 44 px de la guía se propone solo si el enlace va aparte **(por confirmar)**.
Y2. En las páginas nuevas y en todo lo que se toque: sin `dangerouslySetInnerHTML`, textos por `t()` con clave en `es` y `en`, foco visible (`focus-ring`), nombre accesible en botones de icono, avisos con `aria-live`, contraste ≥ 4,5:1, `lang` del documento y un solo `<h1>`.
Y3. El foco y el contraste de las privadas se miden (M4); los fallos se corrigen o se anotan como deuda con identificador.

### De código: deuda elegida

Cada deuda elegida se cierra con su prueba o su medición; las no elegidas siguen en `docs/09` sin cambio.

T1. B64 (panel de destinatarios): una respuesta antigua de `GET /list-recipients` no pisa a una más nueva; prueba con respuestas desordenadas.
T2. B65: mientras la lista de destinatarios no ha cargado, «Añadir» no valida contra `[]` (queda inactivo o espera).
T3. B66: el error del campo de destinatario se anuncia una sola vez (`announce={false}` en el `InlineError` enlazado con `aria-describedby`).
T4. B67: Enter en el campo añade el destinatario.
T5. B70: una sola persona gramatical en los textos `contactRecipients` de `es`.
T6. B68 (galería): el diseño reacciona con `ResizeObserver` en lugar de `resize` de ventana; se mide con un cambio de ancho del contenedor sin `resize` de ventana.
T7. B49, B52 y B53 (`/upload-files`): solo si la medición (M4) los confirma como bugs funcionales; si no se confirman, siguen en `docs/09` sin cambio y se anota el resultado de la medición.

### De código: calidad y cierre

Q1. `npm test` (con `--maxWorkers=2` en esta máquina), `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check` pasan; el tope `--max-warnings` no crece y baja al recuento real si se corrigen avisos. Si se toca `plugins/`, también `npm run agentes:test`.
Q2. `npm run docs:gate` en verde antes del commit; hay un `docs/specs/*-aviso-pr.md` con `Integración:` (hay impacto en `para-backend.md`).
Q3. Los seis archivos de `docs/specs/2026-11` borrados por la retención del paso 0 no se restauran ni se tocan.
Q4. Backend: `node --test --test-concurrency=2` y también con Node 22, y su propio cierre documental.

### De documentación

Frontend:

1. `docs/09-estado-actual-y-deuda-tecnica.md`: fecha de hoy en «Última actualización», fila nueva en el historial con lo medido (por ancho, H1 a H10 con su estado, la deuda cerrada y lo que no se cerró), métricas actualizadas con `npm run docs:check -- --metrics` y las filas de deuda cerradas o nuevas (con identificador nuevo para lo hallado y no corregido).
2. `docs/04-paginas.md` y `docs/01-arquitectura.md`: el mapa de rutas nuevo (todas en inglés), las tres páginas nuevas (rutas, `<h1>`, componentes), las redirecciones desde las rutas españolas y qué pasa con `/administrar-contenido`.
3. `docs/05-componentes.md`: el componente o la utilidad de aparición, los componentes movidos y los nuevos.
4. `docs/07-i18n-y-estilos.md`: claves nuevas (`es` y `en`) y tokens o clases nuevas de ancho máximo y de animación.
5. `docs/06-utilidades-hooks-config.md`: si hay un hook o una utilidad de aparición nuevos y el mapa de títulos de `useDocumentTitle`.
6. `DESIGN.md`: «Espaciado y rejilla» con el ancho común `max-w-6xl` de cabecera, contenido y pie (con fondos y bandas a sangre) y la excepción de `/explore` si cambia; «Movimiento» con la animación de aparición (valores de A2), la regla de la rejilla (A11), el fundido de las privadas (A12) y su desactivación; «Diseño adaptable» con los anchos medidos (hasta 3440 px); «Lagunas conocidas» al día; las rutas citadas, con el nombre nuevo.
7. `docs/guias/buenas-practicas-frontend.md` §9 (animación): la regla de aparición única y el fundido de las privadas; `docs/guias/accesibilidad.md` A11 (movimiento), las rutas que cite y el objetivo táctil del banner si se decide.
8. `docs/08-guia-desarrollo.md`: anchos y rutas nuevas añadidos al procedimiento de medición y los tests nuevos.
9. `docs/integracion/para-backend.md`: `GET /get-data` con `.xlsx` ya funciona, formato de respuesta, `422` ante un `.xlsx` corrupto y orden de despliegue (backend primero); las rutas del frontend que cite, con el nombre nuevo.
10. `docs/integracion/para-infra.md`: los ejemplos de rutas (`/explorar`, `/sobre-nosotros`, etc.) con el nombre nuevo y nota de que la regla de SPA no cambia.
11. `CLAUDE.md`, `README.md` y `docs/README.md`: solo si cambia algo de lo que citan (por ejemplo, las rutas de gestión).

Backend (su propio commit):

12. `docs/04-api.md`: `GET /get-data/:path` con `.xlsx` devuelve las filas convertidas (formato, `422` ante `.xlsx` corrupto, tilde) y se retira el límite D1.
13. `docs/07-estado-y-deuda-tecnica.md`: D1 cerrada (con fecha y commit), cifras de pruebas y fecha de última actualización al día.
14. `docs/05-modulos.md` y `docs/06-almacenamiento-s3.md`: qué módulo convierte el Excel para esta ruta y que `getFileFromS3` ya no se usa para `.xlsx`.
15. `docs/integracion/para-frontend.md`: el cambio de contrato desde el lado del frontend (despliegue primero), con la fecha; sus ejemplos de rutas del frontend con el nombre nuevo.
16. Aviso de PR del backend con `Integración:`; sin impacto en `para-infra.md` salvo que la medición diga lo contrario.

Infra (solo lectura): sus documentos citan `/explorar` como ejemplo; no se editan aquí y se anota en el aviso de PR para que el usuario los actualice cuando proceda.

## Fuera de alcance

- Modo oscuro, rediseño de la identidad (colores, tipografías) y cualquier cambio en la paleta.
- Funciones de producto nuevas (filtros nuevos, edición de datos): solo se corrige lo que falle.
- Renombrar endpoints de la API del backend (ya están en inglés).
- Restaurar los seis archivos de `docs/specs/2026-11` borrados por la retención, ni tocar sus documentos.
- Infraestructura (`sigmetum-infra` es solo lectura): si una medición apunta a infra (cabeceras, reescritura de SPA, caché), se anota en el aviso y no se corrige aquí.
- Probar en Safari y Firefox y contra un backend real de producción **(por confirmar)**.
- La deuda no elegida: B46, B48, B54, B63 (salvo remedición de paso si se toca el hero), B69 y M30 a M32 del backend.
- Commit, push, PR y despliegue: los hace el usuario.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: **lo afecta**. `GET /get-data/:path` pasa a devolver las filas convertidas para claves `.xlsx` (antes `500` por D1) y a responder `422` con mensaje claro ante un `.xlsx` corrupto. La clave y la forma `{ success, data }` no cambian; solo deja de fallar. El backend **se despliega antes** que el frontend si este depende del cambio: un frontend sin cambios contra un backend viejo sigue dando el error actual, no empeora.
- **API del backend en inglés (confirmado):** los 24 endpoints de `docs/03-api.md` del frontend coinciden con los de `docs/04-api.md` del backend y todos son inglés (`/healthcheck`, `/auth`, `/list-files`, `/get-data/:path`, `/get-merged-data`, `/upload`, `/upload/confirm`, `/update-file`, `/delete-file`, `/send-email`, `/list-images`, `/get-image`, `/list-terms`, `/upload-image`, `/delete-image`, `/upload-term`, `/delete-term`, `/list-recipients`, `/add-recipient`, `/delete-recipient`). Ninguno está en español; no se renombra ninguno. Solo se observa que el estilo es verbo-sustantivo en kebab-case salvo `/healthcheck`, `/auth`, `/upload` y `/get-merged-data`: es cuestión de estilo, no de idioma, y cambiarlo rompería el contrato, por lo que queda fuera.
- **Rutas del frontend (H10):** son URL públicas de la SPA, no contrato con el backend. Afectan a: las URL guardadas y favoritos de los usuarios (se mantienen con redirecciones), la documentación de integración (`para-backend.md` y `para-infra.md` del frontend, `para-frontend.md` del backend y de infra, con ejemplos que citan rutas españolas) y los códigos QR o enlaces externos que apunten a rutas antiguas **(por confirmar)**: la redirección los cubre mientras no se retire. La regla de reescritura de SPA de infra es un catch-all, así que no necesita cambios **(por confirmar)**.
- `docs/integracion/para-infra.md`: **no lo afecta** en lo funcional. Las rutas nuevas dependen de la reescritura de SPA (I3), resuelta en el código de infra y presente en el entorno de pruebas; en preproducción puede faltar aplicarla (F16 de `docs/09`, **por confirmar**). No hay variables, recursos de S3 ni cabeceras nuevas.
- Áreas de contrato de `.claude/flujo.json` que podrían tocarse: `src/services/api.js` (solo si la medición lo exige) y `src/config/assets.js` (solo si cambian recursos). Si se tocan, hace falta el aviso `docs/specs/*-aviso-pr.md` con cambio en `docs/integracion/` o `Integración: sin impacto — <motivo>`.

## Preguntas abiertas

Ninguna. Quedan como **(por confirmar)** durante el ciclo, sin bloquear el spec: los nombres exactos de las rutas nuevas (propuestos arriba; la arquitectura puede ajustarlos), la existencia de QR o enlaces externos a las rutas antiguas, y la regla de SPA de preproducción.

---

## Decisiones de la puerta 2 (12/11/2026): ediciones que mandan sobre el texto anterior

- Decisión 5: «filas convertidas **con token** (`tokenAuth` solo en la rama `.xlsx`; el activo `.json` sigue público); corrupto: 422». Al último supuesto se añade «`FileDropdown` pasa a `api.getAuth` (sin cambios en `api.js`)». En la tabla de medición, la fila de las «nueve rutas» pasa a «Las seis rutas españolas antiguas | — | 390 y 1440 | redirección con y sin barra; `?` y `#` no se conservan».
- H1: B1, B4 y B5 «con token válido»; B4 añade «también con `AccessDenied` (404)»; **B8 (nuevo):** una clave `.xlsx` sin token, con token inválido o caducado, da `401` con el mensaje de `tokenAuth` sin llamar a S3, también con `/` codificadas; el activo sigue dando `200` sin token y una clave no permitida sin token sigue dando `400`; `tests/estructura-rutas.test.js` clasifica la ruta y `tests/rutas-protegidas.test.js` cubre su 401. F4: «`FileDropdown` pide la versión con `api.getAuth`; `para-backend.md` refleja el 401 y el 422; `api.js` sin cambios».
- H10: R2: la consulta y el ancla **no** se conservan; el destino sale siempre de la tabla constante y es del mismo origen; una prueba comprueba que `/explorar?//evil.example` y `/galeria#//evil` terminan en `/explore` y `/gallery` sin consulta ni ancla. R7: las redirecciones son solo de cliente (sin 301); se anota para infra.
- H7 y deuda: A4 «… ningún elemento animado por la aparición (`[data-reveal]` y el contenedor con `animate-page-fade`) …» con la nota «desviación: el velo de la galería tiene `opacity-0` a propósito». T3: «el error del campo se anuncia una sola vez por camino: con alerta si el foco ya estaba en el campo (Enter); sin alerta si el foco se mueve desde el botón».
- Documentación e impacto: el punto 7 añade «la §2 de `buenas-practicas-frontend.md`: rutas de la SPA en inglés y kebab-case; textos de usuario en español con `t()`»; el punto 9 añade «401 sin token en `.xlsx`; `FileDropdown` con `api.getAuth`»; los puntos 12 y 15, «401 sin token». Punto nuevo de backend: «`seguridad.md` S3, S4, S5, S6 y OWASP; `01-arquitectura`; CLAUDE.md del backend (excepción de la puerta)». En «Impacto», `para-backend.md` añade «el `.xlsx` exige token; nadie lo usaba con éxito (siempre daba 500)».
- Nuevo (puerta 2): criterio D4 se extiende a `NotFound` (sistema de ancho común, sin colores ni anchos en píxeles, sin `<button>` dentro de `<Link>`), y a la barra lateral con `overflow-y-auto` en alturas cortas.
