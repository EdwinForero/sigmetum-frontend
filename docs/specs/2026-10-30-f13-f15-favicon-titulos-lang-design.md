# F13 a F15 (prueba en preproducción): favicon, títulos, idioma del documento, clave de galería y avisos de React Router: spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

La prueba en preproducción del backend (30/10/2026, filas F13 a F15 de `sigmetum-backend/docs/integracion/para-frontend.md`) detectó cuatro defectos del frontend: el favicon se pide a un bucket antiguo (404 y bloqueo ORB; es M10 de docs/09), todas las páginas comparten el mismo `<title>` y el `<html lang>` es fijo en `es-ES` aunque la interfaz cambie a inglés (B15), la galería usa una clave de traducción que no existe y React Router v6 emite dos avisos de consola. Esta spec define el comportamiento esperado, no cómo se construye.

Comportamiento actual comprobado en el código:

- `index.html` fija `<link rel="icon" ... type="image/png">` con una URL del bucket `s3-sigmetumtest`. `Header` la reescribe después de montar con `assetUrl(ASSETS.LOGO)`, cuando la primera petición ya se hizo. `ASSETS.LOGO` es `assets/logos/app-logo.jpg` (JPEG), mientras que el `type` del enlace dice `image/png`.
- `VITE_S3_URL` ya existe (`src/config/env.js`, `.env.example`, `assetUrl`). Si no está definida, `env.S3_URL` es `''`.
- `<title>` es `SIGMETUM-A` en todas las rutas. Las claves de título de página ya existen para: `login.title`, `uploadFiles.title`, `dataManagement.title`, `contentManagement.title`, `cookies.title`, `aboutUs.title`, `gallery.title`, `explore.title` ("Registro de especies") y `navbar.homeOption`/`navbar.exploreOption`. No existe ninguna para el 404 (`notFound` solo tiene `content` y `returnButton`).
- `src/i18n.js` usa `LanguageDetector` y `fallbackLng: 'es'`; los recursos son `es` y `en`. El idioma detectado puede ser una variante (por ejemplo `en-US`) o uno no soportado.
- `VegetationGallery` llama a `t('gallery.noDataFoundPlaceholder', 'No hay datos disponibles.')`; la clave no existe en el bloque `gallery` de `es` ni de `en`, así que siempre se ve el texto por defecto en español. En `src/setupTests.js` el mock de `t` devuelve la clave y **ignora el segundo argumento**.
- `src/index.js` usa `<BrowserRouter>` sin `future`. `react-router-dom` es `^6.27.0`. Las rutas de `App.js` son planas; la única con comodín es `*` (404). Todos los `Link` y `navigate` encontrados usan rutas absolutas.

## Criterios de aceptación

### De código

F13 (favicon)

1. `index.html` ya no contiene la URL `s3-sigmetumtest` ni ningún dominio de bucket fijo. Un test (que hoy falla por ese motivo) lo comprueba leyendo `index.html`.
2. Con `VITE_S3_URL` definida en el momento del build, `dist/index.html` contiene un `<link rel="icon">` cuyo `href` es `VITE_S3_URL` + `/` + `ASSETS.LOGO`, sin literales `%VITE_...%` sin sustituir. Observable con `npm run build` y revisando `dist/index.html`.
3. La clave de S3 del logo vive solo en `src/config/assets.js` (`ASSETS.LOGO`). No se copia en `index.html`, `vite.config.js` ni en ningún otro sitio.
4. Con `VITE_S3_URL` ausente o vacía en el build: el build no falla y `dist/index.html` no emite ningún `<link rel="icon">` (sin favicon; el navegador usa el suyo por defecto). No queda un `href` con `%VITE_S3_URL%` literal ni una ruta rota tipo `/assets/logos/app-logo.jpg` (que en el hosting de la SPA daría el `index.html` por la regla de reescritura). No hay icono de respaldo en `public/`. Cómo se logra lo decide `architect` con el cambio mínimo.
5. El atributo `type` del enlace del icono es coherente con el formato real de `ASSETS.LOGO` (hoy JPEG) o se omite. Hoy declara `image/png`.
6. La petición inicial del favicon ya va a la URL correcta (sin depender de JavaScript). Si tras el cambio la reescritura de `Header` es redundante, se elimina para que haya una sola fuente de verdad; si se conserva como respaldo, se justifica en el plan y sigue sin producir un `href` inválido. Supuesto de esta spec: se elimina (cambio mínimo y coherente), salvo que `architect` encuentre un caso que lo impida (por ejemplo `npm run dev` sin `.env`).
7. `npm run dev` con `.env` que define `VITE_S3_URL` también sirve el icono desde esa URL.

F14.1 (título por ruta)

8. Cada ruta de `App.js` (`/`, `/explorar`, `/sobre-nosotros`, `/login`, `/galeria`, `/cookies`, `/cargar-archivos`, `/administrar-contenido`, `/administrar-datos` y `*`) muestra un `document.title` propio con formato `<Página> · SIGMETUM-A`. "SIGMETUM-A" es el nombre del proyecto y no se traduce. Decididos: `/` es "Inicio · SIGMETUM-A" (`navbar.homeOption`; cada ruta con título distinto, WCAG 2.4.2) y `/explorar` usa `navbar.exploreOption` ("Explorar · SIGMETUM-A").
9. El título cambia al cambiar de idioma sin recargar, y cambia al navegar entre rutas.
10. Se implementa con un hook propio pequeño, sin añadir dependencias (`package.json` sin cambios; nada de `react-helmet`).
11. Los textos de página reutilizan las claves existentes (`navbar.homeOption`, `navbar.exploreOption`, `aboutUs.title`, `login.title`, `gallery.title`, `cookies.title`, `uploadFiles.title`, `contentManagement.title`, `dataManagement.title`). Solo se añade clave nueva donde no hay ninguna: el 404, con `notFound.title` = "Página no encontrada" (`es`) / "Page not found" (`en`). Las claves nuevas existen en `es` y `en` (lo comprueba `src/languages/translations.test.js`).
12. Tests (fallan hoy porque el título es siempre `SIGMETUM-A`): para cada ruta, con la mock de `t` que devuelve la clave, `document.title` es `<clave> · SIGMETUM-A`; una ruta desconocida usa la clave del 404.
13. Una página protegida (`/cargar-archivos`, `/administrar-contenido`, `/administrar-datos`) tiene su título también cuando `ProtectedRoute` redirige a `/login` (el título es el de la ruta realmente mostrada).

F14.2 (`lang` del documento)

14. `document.documentElement.lang` es `es` o `en` y coincide con el idioma mostrado: al cargar (idioma inicial detectado) y tras cambiar con `LanguageSwitcher`, sin recargar.
15. Si el idioma detectado es una variante (`en-US`, `es-ES`) o no soportado (por ejemplo `fr`, que usa el texto de respaldo en español), `lang` es el del texto realmente mostrado (`en` o `es`), nunca el código crudo del navegador. Decidido: con un idioma no soportado, `lang="es"`.
16. `index.html` conserva un `lang` inicial razonable para el instante previo al arranque de React (no se exige quitar el atributo).
17. Test (falla hoy porque nada actualiza `lang`): cambiar el idioma a `en` deja `lang="en"` y volver a `es` deja `lang="es"`. Restricción de prueba: la mock de `react-i18next` de `src/setupTests.js` fija `i18n.language = 'es'` y no emite `languageChanged`; el test tendrá que usar una instancia real de i18next o ampliar la mock, sin romper el resto de tests.
18. Dónde vive el efecto (mismo hook que el título, o en `i18n.js`) lo decide `architect` con el cambio mínimo.

F14.3 (clave de la galería)

19. `gallery.noDataFoundPlaceholder` existe en `es` ("No hay datos disponibles.") y en `en` ("No data available.").
20. `VegetationGallery` llama a `t('gallery.noDataFoundPlaceholder')` sin valor por defecto en español.
21. Test que falla hoy por el motivo correcto: comprueba que la clave existe en ambos JSON con esos textos. Un test de renderizado de `VegetationGallery` **no** demuestra el fallo, porque la mock de `t` devuelve la clave aunque falte en los JSON. Se puede añadir además un test de renderizado de la galería vacía como protección contra regresiones, sabiendo que no sirve como prueba del fallo.
22. Hallazgo reportado, sin ampliar alcance: un grep de `t('clave', 'texto por defecto')`, `defaultValue`, `t(...) ||` e `i18n.t(` en `src/` encuentra **un solo caso** (`VegetationGallery.js:34`). No hay más.

F15 (React Router)

23. `<BrowserRouter>` en `src/index.js` activa `v7_startTransition` y `v7_relativeSplatPath`, y la consola ya no muestra los dos avisos de React Router. `react-router-dom ^6.27.0` admite ambas opciones, así que `package.json` no cambia.
24. Las rutas siguen resolviendo igual: cada ruta de `App.js` y una ruta desconocida muestran la misma página que antes. Con la información leída, `v7_relativeSplatPath` no afecta (solo hay un comodín, `*`, de primer nivel, y los enlaces son absolutos); `architect` lo verifica de nuevo antes de aplicarlo.
25. Si es viable, un test del montaje del enrutador (falla hoy porque la opción no está) lo cubre; si no lo es sin reestructurar `index.js`, se verifica por observación en consola del navegador y se marca **(por confirmar)** hasta hacerlo.

Generales

26. `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check` pasan; `npm run docs:gate` en verde antes del commit.
27. Accesibilidad según `docs/guias/accesibilidad.md`: título de página descriptivo y distinto por ruta (WCAG 2.4.2) e idioma de la página programáticamente determinable y coincidente con el mostrado (WCAG 3.1.1).

### De documentación

1. `docs/09-estado-actual-y-deuda-tecnica.md`: M10 y B15 pasan a resueltos con el hash del commit; F13, F14 (incluido F14.3) y F15 se reflejan como resueltos o parciales según lo que se haga; F16 consta como pendiente de infraestructura con referencia a I3 y C11 sin duplicar su contenido (I3 figura como resuelto en `para-infra.md`: contrastarlo antes de escribirlo); historial y "Última actualización" con 30/10/2026; las cifras (tests, claves) se actualizan solo allí.
2. `docs/05-componentes.md` y `docs/04-paginas.md` (según lo que cambie `Header` y el título por página): se corrige la descripción del efecto del favicon en `Header` y se documenta el título por ruta.
3. `docs/06-utilidades-hooks-config.md`: el hook nuevo, el uso de `VITE_S3_URL` también en el build de `index.html` y la clave de `ASSETS.LOGO` como única fuente del favicon.
4. `docs/07-i18n-y-estilos.md`: las claves nuevas (`gallery.noDataFoundPlaceholder` y `notFound.title`) y el hecho de que `lang` y el título siguen al idioma activo. Sin recuentos.
5. `docs/08-guia-desarrollo.md`: `VITE_S3_URL` se usa también al compilar `index.html`, y qué ocurre si falta (sin favicon).
6. `docs/guias/accesibilidad.md`: la sección del `lang` (hoy "incumple", B15) pasa a cumplir; se añade el estado del título de página (WCAG 2.4.2).
7. `docs/integracion/para-infra.md`: Amplify debe definir `VITE_S3_URL` también en el momento del build (el build la incrusta en `index.html`), no solo en tiempo de ejecución. Comprobado: la sección 3 ya dice que Vite incrusta las `VITE_*` al compilar y que `modules/amplify` la define en app y rama con `var.s3_url`, hoy vacía "hasta resolver I2/C2". Hay que decir a infraestructura que, mientras `s3_url` esté vacía, el favicon no se sirve (criterio 4), y que debe apuntar a CloudFront para que aparezca. Referencia a F16, sin duplicarlo.
8. `docs/integracion/para-backend.md`: anotar que F13 a F15 se atienden en el frontend (sin cambios de contrato con la API).
9. Aviso de PR `docs/specs/*-aviso-pr.md` (obligatorio por tocar áreas de contrato) con la línea `Integración: ...` correspondiente. Sin recuentos tipo "N tests/claves/avisos" fuera de `docs/09`, tampoco en esta spec.

## Fuera de alcance

- F16 (infraestructura: regla de reescritura de Amplify, cabeceras C11, entorno sin datos).
- B1, M1, M13, M11, M17 y cualquier otro hallazgo.
- Cambiar el logo (`ASSETS.LOGO`), subir o convertir archivos en S3, o crear un favicon propio o un icono de respaldo en `public/`.
- Otros `t(..., 'texto por defecto')` (no hay más; ver criterio 22).
- Añadir dependencias o internacionalizar el sufijo "SIGMETUM-A".
- Actualizar a React Router v7.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta en la API (no cambia ninguna llamada, cabecera ni respuesta). Solo hay que anotar que F13 a F15 se atienden.
- `docs/integracion/para-infra.md`: lo afecta. `VITE_S3_URL` pasa a ser necesaria también en el build para el favicon; sin ella no hay icono (criterio 4). Qué debe hacer infraestructura: mantener `VITE_S3_URL` en las variables de Amplify de app y rama (ya definidas) y rellenar `s3_url` con la URL de CloudFront cuando I2 se resuelva; el cambio de valor exige un nuevo despliegue.
- Áreas de `areasContrato` de `.claude/flujo.json` que se tocan con seguridad: `vite.config.js` (si el mecanismo para no emitir el enlace sin `VITE_S3_URL` lo requiere) y, si se añade o cambia documentación de variables, `.env.example`. `package.json` y `src/config/env.js` no deberían tocarse (sin dependencias nuevas; `VITE_S3_URL` ya existe y se reutiliza, no se inventa otra); si `architect` los toca, debe justificarlo. `src/config/assets.js` solo se toca si hace falta exponer la clave del logo al build. Cualquiera de estas áreas exige aviso de PR con la línea `Integración:`.

## Preguntas abiertas

Ninguna. Decisiones del usuario ya incorporadas arriba:

1. `/explorar`: título con `navbar.exploreOption` ("Explorar").
2. `/`: "Inicio · SIGMETUM-A".
3. 404: clave nueva `notFound.title` en `es` y `en`.
4. Sin `VITE_S3_URL` en el build: sin favicon, sin icono de respaldo en `public/`.
5. Idioma no soportado: `lang="es"`.
