# 08. Guía de desarrollo

## Requisitos

- Node.js 20.19 o superior (Vite 6 lo exige; el backend usa Node 20 en Elastic Beanstalk) y npm.
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
| `VITE_S3_URL` | Sí | `https://<bucket>.s3.eu-west-3.amazonaws.com` o la URL de CloudFront | Base pública de los recursos estáticos |
| `VITE_CAROUSEL_IMAGE_KEYS` | No | `gallery/a.jpg,gallery/b.jpg` | Solo para el carrusel, que no se usa |

- `.env` está en `.gitignore`: nunca lo subas al repositorio.
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

## Despliegue

Según `sigmetum-infra`, el frontend se despliega con **AWS Amplify** (región `eu-west-3`, dominio `sigmetum-a.org`), con compilación automática en cada push a la rama configurada. El frontend ya es un proyecto Vite, como espera el `build_spec` de Terraform, pero el módulo de Amplify sigue pendiente de ajustes: ver el hallazgo [A5](09-estado-actual-y-deuda-tecnica.md#prioridad-alta-pendiente).

Checklist para que un despliegue funcione:

1. Directorio de artefactos: `dist` (coincide con el `build_spec` de `sigmetum-infra`).
2. Variables de entorno de Amplify con los nombres que lee el código: `VITE_BASE_URL`, `VITE_API_PREFIX` y `VITE_S3_URL`. **`sigmetum-infra` solo define `VITE_API_URL`**, que este código no lee: hay que ajustar el módulo de Amplify.
3. Regla de reescritura de la SPA: origen `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|pdf)$)([^.]+$)/>`, destino `/index.html`, tipo `200`.
4. Recursos estáticos accesibles: CloudFront con OAC delante del bucket y `VITE_S3_URL` apuntando a esa distribución.
5. `ALLOWED_ORIGIN` del backend igual al dominio final.

## Convenciones del código

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
| `components/FileUpload.test.js` | Con campos vacíos, confirmar activa el borrador y cancelar envía `confirmed: false` |

### Pendiente

1. `Filter`: combinación Y/O de filtros y facetas dependientes.
2. `FormatFileName` y `SortItemsList`.
3. E2E con Playwright: portada → explorar → filtrar → abrir especie → descargar Excel.

## Herramientas de Claude Code del proyecto

El repositorio incluye `.claude/settings.json` con plugins compartidos, que se activan al confiar en la carpeta:

| Plugin / skill | Para qué |
|---|---|
| `superpowers` | Flujo de trabajo: planificación, TDD, depuración sistemática y verificación |
| `frontend-design`, `ui-ux-pro-max` | Diseño de interfaz, accesibilidad y paletas |
| `playwright` | Probar la app en un navegador real |
| `understand-anything` | Mapa del código y guía de incorporación al proyecto |
| `humanizer` | Revisar textos institucionales para que suenen naturales (no usar sobre contenido científico) |
| `design-taste-frontend` (skill local en `.claude/skills/`) | Guía de diseño para landing pages. Útil solo para la portada |
