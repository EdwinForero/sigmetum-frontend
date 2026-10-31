# 08. Guía de desarrollo

## Requisitos

- Node.js 20 o superior (la misma versión que el backend en Elastic Beanstalk y que Amplify) y npm. No subas `jsdom` a la 27 o posterior sin subir antes Node: exigen Node 22.
- El backend `sigmetum-backend` arrancado en local o una URL de un entorno desplegado.
- Acceso de lectura al bucket de S3 o a su CloudFront para ver logos, banner y glosario.

## Puesta en marcha

```bash
git clone <repo> sigmetum-frontend
cd sigmetum-frontend
npm ci
cp .env.example .env        # y rellena los valores
npm run dev                 # http://localhost:3000
```

### Variables de entorno (`.env`)

| Variable | Obligatoria | Ejemplo | Descripción |
|---|---|---|---|
| `VITE_BASE_URL` | Sí | `http://localhost:8000` | Origen del backend, sin barra final |
| `VITE_API_PREFIX` | Sí | `/api/v1` | Debe coincidir con `API_PREFIX` del backend |
| `VITE_S3_URL` | Sí | URL pública desde la que se sirven los `assets/…` (CloudFront, ver [integración con infraestructura](integracion/para-infra.md)) | Base pública de los recursos estáticos |
| `VITE_CAROUSEL_IMAGE_KEYS` | No | `gallery/a.jpg,gallery/b.jpg` | Solo para el carrusel, que no se usa |

- `.env` está en `.gitignore`: nunca lo subas al repositorio.
- **`VITE_S3_URL` también se lee al compilar `index.html`:** el plugin `sigmetum-favicon` de `vite.config.js` la usa para inyectar el favicon (`VITE_S3_URL` + `/` + `ASSETS.LOGO`). Debe empezar por `https://`: un valor que no lo haga se trata como ausente y el build lo avisa en la consola (`[sigmetum-favicon] ...`). Si falta, está vacía o no empieza por `https://`, el build no falla pero `dist/index.html` queda **sin favicon** (sin icono de respaldo); lo mismo en `npm run dev` si tu `.env` no la define. Detalle en [06](06-utilidades-hooks-config.md#favicon-viteconfigjs-y-faviconhtml). Para probar el build sin ella sin tocar tu `.env`, una variable de proceso vacía lo pisa: `VITE_S3_URL= npx vite build --outDir <carpeta-temporal> --emptyOutDir`.
- Vite incrusta estas variables en el JavaScript al compilar y solo expone las que empiezan por `VITE_`. **Todo lo que pongas aquí es público**: no guardes secretos.
- Si vienes de la versión anterior (Create React App), renombra las claves de tu `.env` de `REACT_APP_*` a `VITE_*`.
- El backend debe tener `ALLOWED_ORIGIN` apuntando al origen del frontend (por ejemplo `http://localhost:3000`) o el navegador bloqueará las peticiones por CORS.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` (o `npm start`) | Servidor de desarrollo con recarga en caliente en el puerto 3000 |
| `npm run build` | Build de producción optimizado en `dist/` |
| `npm run preview` | Sirve `dist/` en local para probar el build |
| `npm test` | Ejecuta todos los tests una vez (Vitest) |
| `npm run test:watch` | Tests en modo observación |
| `npm run lint` | ESLint. Falla si hay errores o si los avisos superan el tope fijado en el script (`--max-warnings`). Al corregir avisos, se baja el tope |
| `npm run quality` | Puerta de calidad y seguridad: patrones prohibidos, secretos, `npm audit` de producción y ESLint |
| `npm run docs:check` | Comprueba que la documentación no se ha quedado atrás respecto al código (ver [mantenimiento.md](guias/mantenimiento.md)) |
| `npm run docs:gate` | Cierre documental del ciclo (plugin `ciclo-agentico`): comprueba, contra `.claude/flujo.json` y `git status`, que se tocaron los documentos de cada área, que `docs/09` tiene la fecha de hoy y que hay aviso para PR si se tocó un área de contrato. Se ejecuta antes del commit; no está en la CI |
| `npm run agentes:test` | Tests (`node:test`) del plugin `ciclo-agentico` en `plugins/`. Vitest no los recoge (`test.include` en `vite.config.js`) |
| `npm run agentes:bootstrap` | Comprueba e instala, pidiendo confirmación, las dependencias del plugin y los plugins del marketplace local (`-- --dry-run` solo informa) |

## Despliegue

Según `sigmetum-infra`, el frontend se despliega con **AWS Amplify** (región `eu-west-1`, dominio `sigmetum-a.org`), con compilación automática en cada push a la rama configurada. El frontend ya es un proyecto Vite, como espera el `build_spec` de Terraform, pero el módulo de Amplify sigue pendiente de ajustes: ver el hallazgo [A5](09-estado-actual-y-deuda-tecnica.md#prioridad-alta-pendiente).

Checklist para que un despliegue funcione:

1. Directorio de artefactos: `dist` (coincide con el `build_spec` de `sigmetum-infra`).
2. Variables de entorno de Amplify con los nombres que lee el código: `VITE_BASE_URL`, `VITE_API_PREFIX` y `VITE_S3_URL`. **`sigmetum-infra` solo define `VITE_API_URL`**, que este código no lee: hay que ajustar el módulo de Amplify.
3. Regla de reescritura de la SPA: origen `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|pdf)$)([^.]+$)/>`, destino `/index.html`, tipo `200`.
4. Recursos estáticos accesibles: CloudFront con OAC delante del bucket y `VITE_S3_URL` apuntando a esa distribución. `VITE_S3_URL` debe estar definida **en el build** de Amplify: de ella sale también el favicon (sin ella no hay favicon). Debe empezar por `https://` (si no, se trata como ausente y el build avisa) y cambiarla exige un nuevo despliegue.
5. `ALLOWED_ORIGIN` del backend igual al dominio final.

## Convenciones del código

Es un resumen. Las normas completas, con el motivo y cómo se comprueban, están en las [guías de trabajo](README.md#guías-de-trabajo).

- **Componentes:** funcionales, en PascalCase, uno por archivo y con exportación por defecto. Las props se desestructuran en la firma.
- **Llamadas HTTP:** siempre a través de `services/api.js`, nunca con `fetch` directo. Los errores se capturan en el componente y se muestran con `useDialog` y `DialogAdvice`.
- **Textos:** siempre con `t()`, añadiendo la clave en `es` y `en`.
- **Recursos de S3:** declara la clave en `config/assets.js` y usa `assetUrl()`.
- **Estilos:** Tailwind en línea. Reutiliza `ButtonPrincipal` y `ButtonAlternative` en lugar de crear botones nuevos.
- **Animaciones:** Motion (`import { motion } from 'motion/react'`). Envuelve los elementos que se desmontan en `<AnimatePresence>`.
- **Rutas:** en español (`/explorar`, `/sobre-nosotros`). Las privadas se envuelven en `ProtectedRoute`.
- **Ramas y commits:** ramas `feature/<nombre>` sobre `master`. Mensajes en inglés, en imperativo, describiendo el cambio (por ejemplo "Adapt frontend to backend API v2 breaking changes").

## Añadir cosas habituales

**Una página nueva**
1. Crea `src/pages/MiPagina.js`.
2. Añade la `<Route>` en `App.js` (dentro de `ProtectedRoute` si es privada).
3. Si debe estar en el menú, añádela a `menuItems` de `Navbar.js` y a `Footer.js`.
4. Añade sus textos en los dos archivos de traducción.

**Una columna nueva en los datos**
El filtro y la tabla la detectan solos. Añade su nombre visible en `attributes` y, si debe aparecer en el detalle de especie, añádela a `uniqueAttributes` de `DialogSpecies.js` y a `explore.dialogSpecies.attributes`.

**Un endpoint nuevo**
Usa el método adecuado de `api` (`get`, `postAuth`...). Si necesitas un verbo que no existe (por ejemplo `PUT`), añádelo en `services/api.js` siguiendo el mismo patrón.

## Tests

Vitest con Testing Library, en modo `jsdom`. Los tests van junto al código (`Componente.test.js`). `npm test` los ejecuta todos.

### Convenciones

- `src/setupTests.js` simula `react-i18next`: `t('clave')` devuelve la propia clave, así que los tests buscan textos por clave (`screen.getByText('dialogAdvice.cancelButton')`) y no dependen del idioma.
- La red se simula con `vi.stubGlobal('fetch', ...)` y se restaura con `vi.unstubAllGlobals()`.
- Flujo para corregir un fallo: primero un test que falle por el motivo correcto, después el cambio mínimo y por último toda la suite.
- Al crear archivos con barras invertidas (expresiones regulares), no uses `cat <<EOF` desde el shell: puede comerse las barras. Usa el editor.

### Cobertura actual

| Archivo | Qué verifica |
|---|---|
| `utilities/CSVfunctions.test.js` | `downloadXLSX` no modifica los datos y exporta los arrays como texto |
| `utilities/highlightTerms.test.js` | Términos no latinos en redonda, escape de caracteres especiales y punto literal |
| `components/TextInput.test.js`, `FilterSearchBar.test.js` | Los campos son controlados y se vacían cuando el padre los vacía |
| `components/FileUpload.test.js` | Con campos vacíos, confirmar activa el borrador y cancelar envía `confirmed: false`; `accept` solo `.xlsx`; `404` al confirmar y al cancelar; fallo al cancelar; cabecera `Authorization` en `/upload` y en `/upload/confirm`; `401` en `/upload`, al confirmar y al cancelar (borra el token y redirige); `400` sin `emptyFields`; confirmar con `500` vacía la cola. Simula `fetch` y también `location` y el token |
| `services/api.test.js` | `401` en métodos `*Auth` borra el token y redirige; `api.get` y `api.post` no; `401` con cuerpo no JSON; `error.data` en errores con `data`, ausente si no hay; `200` con cuerpo no JSON lanza `SyntaxError` |
| `components/LoginForm.test.js`, `ContactForm.test.js` | Mensajes por `429`, `401`, `400` y `500`; el error del login se anuncia como `role="alert"` y no hay alerta antes de fallar; `maxLength` del contacto; campos localizables por su etiqueta (también al mostrar la contraseña), botón localizable por rol dentro del `<form>`, envío con Enter y con clic sin doble envío, `preventDefault` del envío e ids únicos entre instancias |
| `components/CookieBanner.test.js` | Las dos cookies se escriben con `path=/`, `max-age` de un año y `SameSite=Lax`; `Secure` solo en HTTPS, tanto con «aceptar todo» como desde el modal; `cookiePreferences` sin codificar; con el consentimiento ya dado no se muestra el banner ni se escribe nada. Simula `document.cookie` y `location` |
| `components/ImageGalleryManager.test.js` | Un caso por carácter prohibido del título sin llamar a la API, y un título válido que sí sube |
| `components/ImageComponent.test.js`, `ImageCarrousel.test.js` | `imageKey` con `encodeURIComponent`; sin clave no se llama a la API |
| `components/Table.test.js` | Columnas como unión de claves, orden de primera aparición y sin mutar `data` |
| `components/DialogSpecies.test.js` | Comparación exacta de la especie (cadena y array; una subcadena, `undefined`, `null`, `""` y diferencias de mayúsculas o espacios no cuentan), sin mutar `data` ni `species`, y enlace a IPNI con `rel="noopener noreferrer"` |
| `utilities/FormatFileName.test.js` | Formato `AAAA-MM-DD_vN.xlsx` con y sin ruta, `_v10` y nombres que no coinciden |
| `languages/translations.test.js` | Paridad de claves y de marcadores de interpolación entre español e inglés, que no haya traducciones vacías y el texto exacto de `gallery.noDataFoundPlaceholder` y `notFound.title` en ambos idiomas |
| `utilities/faviconHtml.test.js` | `faviconTags` devuelve `<link rel="icon">` con `href` `<URL>/<clave>` y sin `type`, o nada si no hay URL o no empieza por `https://` (`http://`, `//cdn...`, sin esquema, espacios iniciales o `HTTPS://`); la barra final no se normaliza; `logoKeyFromSource` da la misma clave que `ASSETS.LOGO` real, acepta comillas dobles, no confunde `LOGOS` y lanza error sin `LOGO`; `index.html` no fija ningún favicon, bucket ni marcador `%VITE_` |
| `components/Header.test.js` | `Header` no reescribe el `href` de un `<link rel="icon">` existente |
| `i18n.test.js` | `lang` de `<html>` sigue al idioma (`en`, `es`, `en-US` da `en`, `es-ES` da `es`, `fr` da `es`), también el idioma inicial detectado. Usa `i18next` real (la mock global solo afecta a `react-i18next`) |
| `hooks/useDocumentTitle.test.js` | Título `<Página> · SIGMETUM-A` por ruta con el texto real de `es`, 404 con `notFound.title`, mayúsculas y barra final, cambio de idioma sin remontar, ruta protegida que redirige a `/login`, y guarda de deriva: toda ruta de `App.js` tiene título y `App.js` llama al hook. Usa i18n real (`vi.mock('react-i18next', importOriginal)`) en lugar de la mock global |
| `index.test.js` | `index.js` monta `BrowserRouter` con `v7_startTransition` y `v7_relativeSplatPath` (simula `react-dom/client`, `App` y `i18n`) |
| `languages/es-typos.test.js` | El texto en español de `login.unauthorizedLabel` es exacto y sin el typo «contraeña» (lee el JSON de `es` directamente) |

### Pendiente

1. `Filter`: combinación Y/O de filtros y facetas dependientes.
2. `SortItemsList`.
3. E2E con Playwright: portada → explorar → filtrar → abrir especie → descargar Excel.

## Integración continua y dependencias

| Pieza | Qué hace |
|---|---|
| [.github/workflows/ci.yml](../.github/workflows/ci.yml) | Con Node 20 ejecuta `npm ci`, `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check`, y después, con Node 22 (el glob de `node --test` exige Node 21 o posterior), `npm run agentes:test`. Se lanza en cada PR, en cada push a `master` y `feature/testing`, cada lunes (porque `npm audit` puede dar un aviso nuevo sin que cambie el código) y a mano |
| [.github/pull_request_template.md](../.github/pull_request_template.md) | Plantilla de la PR con la definición de terminado, las guías que aplican y si afecta al backend o a la infraestructura |
| [.github/dependabot.yml](../.github/dependabot.yml) | Propone cada lunes las actualizaciones de `npm` y de las acciones de GitHub, agrupando las menores. Ignora las versiones mayores de `jsdom` (exige Node 22) y `eslint` (los plugins aún no lo admiten) |
| [.gitattributes](../.gitattributes) | Fija los finales de línea en LF en todos los sistemas |

**Ajustes de GitHub que no están en el código** (los hace quien administre el repositorio):

1. Proteger `master` y `feature/testing`: exigir que el trabajo **CI** esté en verde y una revisión antes de fusionar. Sin esto, la CI avisa pero no bloquea.
2. Activar *Dependabot security updates* en Settings > Code security.

**Amplify no ejecuta estos controles:** solo compila. Conviene añadir `npm test` en el `preBuild` del módulo `amplify` de `sigmetum-infra` para no desplegar una versión rota (ver [para-infra.md](integracion/para-infra.md)).

## Herramientas de Claude Code del proyecto

El repositorio incluye `.claude/settings.json` con plugins compartidos, que se activan al confiar en la carpeta:

| Plugin / skill | Para qué |
|---|---|
| `superpowers` (de `superpowers-marketplace`) | Flujo de trabajo: planificación, TDD, depuración sistemática y verificación |
| `i-have-adhd` | Estilo de salida del ciclo agéntico (`estilo` de `.claude/flujo.json`) |
| `frontend-design`, `ui-ux-pro-max` | Diseño de interfaz, accesibilidad y paletas |
| `playwright` | Probar la app en un navegador real |
| `understand-anything` | Mapa del código y guía de incorporación al proyecto |
| `humanizer` | Revisar textos institucionales para que suenen naturales (no usar sobre contenido científico) |
| `design-taste-frontend` (skill del plugin local `dominio-frontend`, ver [plugins/README.md](../plugins/README.md)) | Guía de diseño para landing pages. Útil solo para la portada. Ya no hay skills sueltas en `.claude/skills/` |

### Ciclo agéntico (`/ciclo`)

Toda feature o fix puede pasar por `/ciclo <tarea>`, del plugin [ciclo-agentico](../plugins/ciclo-agentico/README.md): requisitos, arquitectura, desarrollo y verificación con documentación, con puerta humana entre fases y sin commits del agente. La configuración está en `.claude/flujo.json`; los traspasos entre roles (specs, planes y avisos para PR) se guardan en `docs/specs/`. Cómo se instala y se activa el marketplace local: [plugins/README.md](../plugins/README.md#cómo-se-activan). En un equipo nuevo: `npm install`, `npm run agentes:bootstrap`, reiniciar la sesión de Claude Code y lanzar `/ciclo-init` (puede que haga falta el prefijo `/ciclo-agentico:ciclo-init` **(por confirmar)**).

El archivo [CLAUDE.md](../CLAUDE.md) de la raíz resume las reglas del proyecto para Claude Code y le indica qué [guía](README.md#guías-de-trabajo) leer según la tarea: buenas prácticas, seguridad, accesibilidad y [mantenimiento](guias/mantenimiento.md) tras cada feature o fix.
