# F13 a F15 (favicon, títulos, lang, clave de galería, React Router): plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-f13-f15-favicon-titulos-lang-design.md`

## Notas de la segunda opinión (aprobadas, obligatorias para el developer)

1. **Regex de `logoKeyFromSource` con el flag `m`:** `/^\s*LOGO:\s*(['"])(.+?)\1/m`. Sin `m`, `^` solo casa al inicio del texto y fallaría contra `assets.js` real (`  LOGO:    'assets/logos/app-logo.jpg',`). `LOGOS:` no se confunde (la `S` va antes de los dos puntos).
2. **Lectura diferida de `assets.js`:** `vite.config.js` es también la config de Vitest, y `configResolved` corre allí. El plugin NO lee `assets.js` en `configResolved`: lo lee dentro de `transformIndexHtml`, y solo si hay `s3Url`. Así Vitest no toca el archivo, un cambio futuro de formato no tumba `npm test`, y `dev` y `build` siguen fallando en voz alta. En `configResolved` solo se guarda `config.env.VITE_S3_URL`. La ruta se resuelve con `new URL('./src/config/assets.js', import.meta.url)`.
3. **Desviación de la letra de la spec (criterio 12):** el test del título usa i18n real con `vi.mock('react-i18next', async (importOriginal) => await importOriginal())` en lugar de la mock global de `t`, porque con la mock global no se puede probar el cambio de idioma ni que las claves existan. Queda anotado; el criterio 9 (cambio de idioma) lo exige.
4. **Comprobación "sin variable" del build:** `.env` local define `VITE_S3_URL`; usar `VITE_S3_URL= npx vite build --outDir <scratchpad>/dist-X --emptyOutDir` (una `process.env` vacía pisa al `.env`) en lugar de retirar el `.env`. Con variable: `VITE_S3_URL=https://cdn.example.test npx vite build ...`. Nunca escribir en `dist/` del repo.
5. El test de `faviconHtml` lee `assets.js` con `new URL('../config/assets.js', import.meta.url)` (o `path.resolve`), no con ruta relativa al `cwd`.
6. En `src/index.test.js`, comprobar el tipo con `el.type === BrowserRouter` importado, no por nombre.
7. Sin recuentos tipo "N tests/claves/avisos" fuera de `docs/09`, también en el aviso de PR y los specs.

## Vuelta 1: decisión del usuario tras la segunda opinión sobre el diff

8. **El favicon exige `https://`.** Una `VITE_S3_URL` que no empiece por `https://` no emite el `<link rel="icon">` (como si faltara la variable) y el plugin avisa por la consola del build (`this.warn` de Rollup/Vite, o equivalente), sin romper el build. Motivo: `docs/guias/seguridad.md` prohíbe los enlaces externos `http://`. La regla vive en `faviconTags` (función pura, testeable) y el aviso en el plugin de `vite.config.js`. Tests nuevos (rojos antes): `faviconTags` devuelve `[]` con `http://...`, con `//cdn...`, con una cadena sin esquema y con espacios; sigue emitiendo con `https://...` (también con barra final, sin cambiar el comportamiento ya cubierto). La barra final no se normaliza (igual que `assetUrl`; fuera de alcance). `.env.example`, `docs/06`, `docs/08`, `para-infra.md` y el aviso de PR reflejan que un valor sin `https://` se trata como ausente.

Crítico: sí. Coincide con "variables de entorno" (`VITE_S3_URL` pasa a leerse en el build; se tocan `vite.config.js` y `.env.example`) y con "accesibilidad" (WCAG 2.4.2 y 3.1.1). No toca sesión, token, dependencias ni CI.

## Decisiones (con alternativas descartadas)

1. **F13, mecanismo.** Un plugin inline en `vite.config.js` con `transformIndexHtml` que devuelve una etiqueta `<link rel="icon">` solo si hay `VITE_S3_URL`. El `<link>` se quita de `index.html`.
   - Se comprobó en `node_modules/vite` (`htmlEnvHook`) que Vite deja `%VITE_X%` como literal y solo avisa si la variable falta. Por eso no se usa `%VITE_S3_URL%` dentro de `index.html`. Se descarta dejar un marcador y quitarlo con una regex (más frágil que inyectar o no).
   - Sin variable, el plugin devuelve `[]`: sin `<link>`, sin `href` roto, sin icono de respaldo. El build no falla.
   - `transformIndexHtml` actúa también en `npm run dev`.
   - La variable se lee con `configResolved(config) { config.env.VITE_S3_URL }`: ese objeto ya mezcla `.env*` y `process.env` (Amplify la inyecta en `process.env` en el build). Más simple que llamar a `loadEnv`.
   - La URL se compone igual que `assetUrl`: `${s3}/${clave}`, sin recortes.
2. **F13, clave del logo.** `vite.config.js` no puede importar `src/config/assets.js`: ese archivo importa `env.js`, que usa `import.meta.env` (`undefined` en el bundle de configuración de Vite). Se lee `assets.js` como texto con `readFileSync` y una función pura `logoKeyFromSource(texto)` extrae `LOGO: '...'` (regex `^\s*LOGO:\s*(['"])(.+?)\1`, que no confunde `LOGO:` con `LOGOS:`). La clave sigue viviendo solo en `assets.js`. Si la extracción falla, lanza error (el build falla en voz alta). Un test compara la clave extraída con `ASSETS.LOGO` importado de verdad dentro de Vitest. Se descarta duplicar la clave, y se descarta hacer `assets.js` o `env.js` importables desde Node (áreas de contrato).
3. **F13, `type` y ubicación.** Se omite `type` (el logo es JPEG y los navegadores detectan el formato). El módulo puro va en `src/utilities/faviconHtml.js` (`buenas-practicas` §2: lógica sin interfaz en `utilities/`) con su test al lado. Vitest solo incluye `src/**/*.test.js`, así que no hay que tocar `include`. Se descarta `scripts/*.mjs`.
4. **Header.** Se elimina el `useEffect` que reescribe el `href` (y `useEffect` del import de React). El `<link>` ya sale con la URL correcta desde el HTML, y sin variable no hay icono, así que ningún caso lo necesita. `ASSETS` y `assetUrl` se siguen usando en el `<img>`.
5. **F14.1, título.** Hook `src/hooks/useDocumentTitle.js` llamado una vez en `App.js`. Lee `useLocation().pathname` y consulta un mapa ruta -> clave con `matchPath` (insensible a mayúsculas y tolera la barra final, como el enrutador). Cualquier ruta sin entrada usa `notFound.title`. Centralizar cubre `ProtectedRoute` sin tocarlo: el título sigue al `pathname`, y tras `Navigate to="/login"` es el de `/login`. Se descarta llamar al hook en cada página (el título quedaría desactualizado mientras `ProtectedRoute` muestra el spinner o redirige). Formato `` `${t(clave)} · SIGMETUM-A` ``; dependencias del efecto `[t, key]` (en react-i18next v15 `t` cambia de identidad al cambiar el idioma).
6. **F14.2, `lang`.** Vive en `src/i18n.js`, no en el hook. Se registra `i18n.on('languageChanged', ...)` **antes** de `.init(...)` (con `resources` en línea el `init` emite `languageChanged` de forma síncrona). Valor: `document.documentElement.lang = i18n.resolvedLanguage || 'es'` (`en-US` da `en`, `es-ES` da `es`, `fr` da `es` por el fallback). `fallbackLng: 'es'` pasa a constante `FALLBACK_LANGUAGE`. `index.html` conserva `lang="es-ES"`.
7. **Tests del `lang`.** `setupTests.js` solo mockea `react-i18next`; `i18next` y `src/i18n.js` son reales. El test importa `./i18n` y llama a `changeLanguage` de verdad. El idioma inicial se prueba con `vi.resetModules()` y `localStorage.i18nextLng` antes de un `await import('./i18n')`.
8. **Tests del título.** La mock global de `t` es `(key) => key` e ignora el segundo argumento. `useDocumentTitle.test.js` desactiva la mock con `vi.mock('react-i18next', async (importOriginal) => await importOriginal())` y usa el i18n real; cada ruta se comprueba contra el texto real del JSON. Si la sobreescritura no se aplica, el developer usa `vi.unmock('react-i18next')` en la cabecera del test y lo anota.
9. **Claves.** `gallery.noDataFoundPlaceholder` (es "No hay datos disponibles.", en "No data available.") y `notFound.title` (es "Página no encontrada", en "Page not found"). El test que falla por el motivo correcto va en `src/languages/translations.test.js`: afirma el texto exacto en cada JSON. No hace falta un test de render de la galería (pasaría hoy). Sin ese test, el criterio de código sobre el valor por defecto se verifica con un grep.
10. **F15.** Verificado con grep en `src/`: las rutas de `App.js` son planas, el único comodín es `*` de primer nivel, y todos los `Link`, `Navigate` y `navigate` son absolutos. `react-router-dom` instalado admite ambas opciones; `v7_relativeSplatPath` no tiene efecto aquí. Test sin reestructurar `index.js`: se mockea `react-dom/client` (`createRoot` con un `render` espía) más `./App`, `./i18n`, `./components/ErrorBoundary` e `./index.css`; se importa `./index` y se inspecciona `children.props.future`. La ausencia de los avisos en la consola real queda **(por confirmar)** en navegador.
11. **Lint.** El tope es el actual y hay que medirlo. Quitar el `useEffect` de `Header` probablemente no baje nada; si baja, `--max-warnings` baja al número medido (`package.json` es área de contrato). Ningún cambio nuevo debe añadir avisos.

## Fase 1

1. **F13: favicon solo con `VITE_S3_URL` en el build**
   - Archivos: crear `src/utilities/faviconHtml.js` y `src/utilities/faviconHtml.test.js`; modificar `index.html` (eliminar solo la línea del `<link rel="icon" ...s3-sigmetumtest...>`), `vite.config.js` y `.env.example` (solo un comentario encima de `VITE_S3_URL`: también se usa al compilar `index.html` para el favicon con `ASSETS.LOGO`; si está vacía, no hay favicon; no copiar la clave del logo ahí).
   - Firmas nuevas: `logoKeyFromSource(fuente: string): string` (lanza `Error` si no encuentra `LOGO`); `faviconTags(s3Url?: string, logoKey: string): Array<{tag:'link', attrs:{rel:'icon', href:string}, injectTo:'head'}>` (devuelve `[]` si `s3Url` es falsa; sin `type`). En `vite.config.js`, un plugin inline `faviconPlugin()` con `name: 'sigmetum-favicon'`: en `configResolved` guarda `config.env.VITE_S3_URL` y lee `assets.js` con `readFileSync(new URL('./src/config/assets.js', import.meta.url), 'utf8')`; en `transformIndexHtml` devuelve `faviconTags(...)`. Los bloques `esbuild`, `server` y `test` no cambian.
   - TDD: (a) escribir primero los tests con un esqueleto que no hace nada (`faviconTags = () => []`, `logoKeyFromSource = () => undefined`) para que fallen por aserción y no por importación: con URL y clave devuelve el `href` `https://cdn.example.test/assets/logos/app-logo.jpg`, `rel` `icon` y sin `type`; con `''` o `undefined` devuelve `[]`; `logoKeyFromSource(readFileSync('src/config/assets.js','utf8'))` es igual a `ASSETS.LOGO` importado de `../config/assets`; una fuente sin `LOGO:` lanza error; `index.html` leído no contiene `s3-sigmetumtest`, ni `rel="icon"`, ni `%VITE_`. (b) Implementar, quitar el `<link>` y cablear el plugin.
   - Comprobación de build (manual, sin tocar `dist/`): `vite build --outDir <scratchpad>/dist-X --emptyOutDir`. Con `VITE_S3_URL='https://cdn.example.test'` el `index.html` generado tiene un `<link rel="icon" href="https://cdn.example.test/assets/logos/app-logo.jpg">` y ningún `%VITE_`; sin la variable no hay ningún `rel="icon"` y el build termina bien. Cuidado: `.env` está en `.gitignore`; si el `.env` local la define, retirarlo temporalmente para el caso "sin". Dev: `npm run dev` con la variable y una petición a `http://localhost:3000` muestra el `<link>`; si no se puede ejecutar, queda **(por confirmar)**.
   - Norma: `docs/integracion/para-infra.md` (Vite incrusta `VITE_*` al compilar; Amplify la define en app y rama); `docs/guias/seguridad.md` (las `VITE_*` son públicas; el valor desplegado debe ser `https://`, responsabilidad de infra); `buenas-practicas` §2.

2. **F13: eliminar la reescritura del `href` en `Header`**
   - Archivos: modificar `src/components/Header.js`; crear `src/components/Header.test.js`. Borrar el `useEffect` y quitar `useEffect` del import de React.
   - TDD (rojo por aserción, hoy el efecto sobrescribe el `href`): el test mockea `./Navbar` y `./LanguageSwitcher`, añade `<link rel="icon" href="https://x.test/icono.jpg">` a `document.head`, renderiza `<MemoryRouter><Header/></MemoryRouter>` y comprueba que el `href` sigue igual; limpia el `<link>` en `afterEach`.
   - Norma: `buenas-practicas` §5 (efectos).

3. **F14.3 y 404: claves nuevas en `es` y `en`**
   - Archivos: modificar `src/languages/es/translation.json`, `src/languages/en/translation.json`, `src/languages/translations.test.js` y `src/pages/VegetationGallery.js`. Añadir `gallery.noDataFoundPlaceholder` y `notFound.title` con los textos de la decisión 9, respetando estilo y sangría; en `VegetationGallery.js` (línea ~34) `t('gallery.noDataFoundPlaceholder')` sin segundo argumento.
   - TDD: en `translations.test.js` un `it` que compare los cuatro textos exactos con los mapas `spanish` y `english` ya aplanados; rojo hoy porque las claves valen `undefined`. Después los JSON y la galería. Comprobación adicional: grep de `noDataFoundPlaceholder'\s*,` sin resultados.
   - Norma: `buenas-practicas` §7 (claves en ambos idiomas).

4. **F14.2: `lang` del documento**
   - Archivos: modificar `src/i18n.js`; crear `src/i18n.test.js`. Constante `FALLBACK_LANGUAGE = 'es'` en `fallbackLng`; función `setDocumentLang` (asigna `document.documentElement.lang = i18n.resolvedLanguage || FALLBACK_LANGUAGE`); registrarla con `i18n.on('languageChanged', setDocumentLang)` antes de la cadena `.use().use().init()`. El `export default i18n` no cambia.
   - TDD (rojo: el `lang` se queda en `es-ES`): `beforeEach` pone `document.documentElement.lang='es-ES'` y limpia `localStorage`. `await i18n.changeLanguage('en')` da `en`, y `es` da `es`; `en-US` da `en`, `es-ES` da `es`, `fr` da `es`; idioma inicial con `vi.resetModules()`, `localStorage.setItem('i18nextLng','en-US')` y `await import('./i18n')` da `en`, y con `fr` da `es`.
   - Norma: `accesibilidad.md` A8 (WCAG 3.1.1).

5. **F14.1: título de página por ruta**
   - Archivos: crear `src/hooks/useDocumentTitle.js` y `src/hooks/useDocumentTitle.test.js`; modificar `src/App.js`.
   - Firmas nuevas: `export const PAGE_TITLE_KEYS = { '/': 'navbar.homeOption', '/explorar': 'navbar.exploreOption', '/sobre-nosotros': 'aboutUs.title', '/login': 'login.title', '/galeria': 'gallery.title', '/cookies': 'cookies.title', '/cargar-archivos': 'uploadFiles.title', '/administrar-contenido': 'contentManagement.title', '/administrar-datos': 'dataManagement.title' }`; `titleKeyFor(pathname): string` con `matchPath` y, sin coincidencia, `'notFound.title'`; `export default function useDocumentTitle(): void` con `useLocation`, `useTranslation` y un `useEffect([t, key])` que asigna `document.title = `${t(key)} · SIGMETUM-A``. En `App.js`: importar el hook y llamarlo una vez, junto a `useLocation`; nada más. Antes de nada, confirmar que existen todas esas claves en ambos JSON (en particular la ruta exacta de `cookies.title`) y corregir el mapa si alguna no existe.
   - TDD (esqueleto sin lógica, rojo porque `document.title` queda vacío; i18n real, decisión 8; un componente `Probe` dentro de `MemoryRouter`): cada ruta de la tabla da el texto real del JSON `es` más ` · SIGMETUM-A` (las claves esperadas se escriben en el test, no se importan del mapa; además se comprueba que existen en `es` y `en`); `/ruta-que-no-existe` da el título de `notFound.title`; `/Explorar/` da el de explorar; cambiar a `en` con `await act(() => i18n.changeLanguage('en'))` cambia el título sin remontar (antes, forzar `es`); `/cargar-archivos` con `<Navigate to="/login"/>` termina con el título de `login.title`; guarda de deriva: leer `src/App.js` y extraer con `/<Route[^>]*\spath="([^"]+)"/g` todas las rutas menos `*`; cada una debe estar en `PAGE_TITLE_KEYS`, y `App.js` debe contener `useDocumentTitle()`.
   - Norma: `accesibilidad.md` (WCAG 2.4.2); `buenas-practicas` §2 y §5.

## Fase 2

6. **F15: opciones `future` en `BrowserRouter`**
   - Archivos: modificar `src/index.js`; crear `src/index.test.js`. `<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>`.
   - TDD (rojo por aserción: `future` es `undefined`): test según la decisión 10, con `vi.hoisted` para el espía `render`; comprobar `type === BrowserRouter` y `props.future` con las dos opciones en `true`.
   - Comprobación manual **(por confirmar)** hasta hacerla: navegador sin avisos de React Router en consola y navegación entre `/`, `/explorar`, `/galeria` y `/cargar-archivos` sin diferencias; mirar `/explorar` en particular (`App.js` resetea estado en un efecto sobre `location.pathname`).

7. **Tope de lint y verificación completa**
   - Archivo: `package.json` solo si `npm run lint` mide menos avisos que el tope. Medir antes de empezar y al terminar. Si baja, ajustar solo el número de `--max-warnings` al valor real; si sube, corregir los avisos nuevos, no subir el tope.
   - Comprobación: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check`.

## A cargo del tester-documentador

- `docs/09-estado-actual-y-deuda-tecnica.md`: M10 y B15 resueltos con el hash del commit; F13, F14 (incluido F14.3) y F15 resueltos (F15 con la nota **(por confirmar)** del navegador si no se hizo); F16 pendiente de infraestructura con referencia a I3 y C11 sin duplicar su contenido; contrastar I3 (`para-infra.md` lo marca "Resuelto en rama `feature/testing` de infra" y el repo de infra tiene las `custom_rule` en `modules/amplify/main.tf`, pero `docs/09` lo lista abierto): alinear los dos documentos, y marcar **(por confirmar)** que el despliegue de preproducción va por detrás; fecha y historial con 30/10/2026; cifras solo aquí, de `npm run docs:check -- --metrics`.
- `docs/05-componentes.md`: quitar la descripción del efecto de `Header` que reescribe el favicon.
- `docs/04-paginas.md`: título por ruta y fallback del 404.
- `docs/06-utilidades-hooks-config.md`: debe mencionar por nombre `useDocumentTitle` y `faviconHtml` (lo exige `docs:check`); explicar el hook y el mapa, el plugin de `vite.config.js`, el uso de `VITE_S3_URL` también al compilar y `ASSETS.LOGO` como única fuente.
- `docs/07-i18n-y-estilos.md`: claves `gallery.noDataFoundPlaceholder` y `notFound.title`; `lang` y título siguen al idioma activo, con `fr` como `es`. Sin recuentos.
- `docs/08-guia-desarrollo.md`: `VITE_S3_URL` también en el build de `index.html` y qué pasa si falta (sin favicon); la tabla de cobertura debe incluir `faviconHtml.test.js`, `Header.test.js`, `i18n.test.js`, `useDocumentTitle.test.js` e `index.test.js`.
- `docs/guias/accesibilidad.md`: A8 pasa a cumple (quitar la referencia a B15 como incumplimiento); añadir el estado del título de página (WCAG 2.4.2).
- `docs/integracion/para-infra.md`: Amplify debe tener `VITE_S3_URL` también en el build; ya la define en app y rama (`modules/amplify/main.tf`); con `s3_url` vacío en prod no habrá favicon; cambiar el valor exige un nuevo despliegue; referencia a F16 sin duplicarlo.
- `docs/integracion/para-backend.md`: F13 a F15 se atienden en el frontend, sin cambios de contrato con la API.
- Aviso de PR `docs/specs/2026-10-30-f13-f15-favicon-titulos-lang-aviso-pr.md` con la línea `Integración: para-infra.md actualizado — VITE_S3_URL pasa a ser necesaria también al compilar (favicon); sin ella no hay favicon. Sin impacto en para-backend.md (la API no cambia).` Se toca `vite.config.js` y `.env.example`, y `package.json` solo si cambia el tope de lint.
- Advertencias: `docs:check` rechaza cifras tipo "N tests/claves/archivos/avisos" fuera de `docs/09`, también en specs y avisos. Los archivos del repo están en LF. Los mensajes de commit irán en inglés, en imperativo y sin prefijo.

## Pruebas

- Nuevas: `src/utilities/faviconHtml.test.js`, `src/components/Header.test.js`, `src/i18n.test.js`, `src/hooks/useDocumentTitle.test.js`, `src/index.test.js`. Modificada: `src/languages/translations.test.js`.
- Cada una se escribe antes del cambio, con esqueleto donde falte el módulo, y se comprueba que falla por aserción.
- Comando: `npm test`; más `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y, antes del commit, `npm run docs:gate`.
