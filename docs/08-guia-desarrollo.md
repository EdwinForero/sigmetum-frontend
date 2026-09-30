# 08. Guía de desarrollo

## Requisitos

- Node.js 20 LTS (la misma versión que el backend en Elastic Beanstalk) y npm.
- El backend `sigmetum-backend` arrancado en local o una URL de un entorno desplegado.
- Acceso de lectura al bucket de S3 o a su CloudFront para ver logos, banner y glosario.

## Puesta en marcha

```bash
git clone <repo> sigmetum-frontend
cd sigmetum-frontend
npm ci
cp .env.example .env        # y rellena los valores
npm start                   # http://localhost:3000
```

### Variables de entorno (`.env`)

| Variable | Obligatoria | Ejemplo | Descripción |
|---|---|---|---|
| `REACT_APP_BASE_URL` | Sí | `http://localhost:8000` | Origen del backend, sin barra final |
| `REACT_APP_API_PREFIX` | Sí | `/api/v1` | Debe coincidir con `API_PREFIX` del backend |
| `REACT_APP_S3_URL` | Sí | `https://<bucket>.s3.eu-west-3.amazonaws.com` o la URL de CloudFront | Base pública de los recursos estáticos |
| `REACT_APP_CAROUSEL_IMAGE_KEYS` | No | `gallery/a.jpg,gallery/b.jpg` | Solo para el carrusel, que no se usa |

- `.env` está en `.gitignore`: nunca lo subas al repositorio.
- CRA incrusta estas variables en el JavaScript al compilar. **Todo lo que pongas aquí es público**: no guardes secretos.
- El backend debe tener `ALLOWED_ORIGIN` apuntando al origen del frontend (por ejemplo `http://localhost:3000`) o el navegador bloqueará las peticiones por CORS.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con recarga en caliente en el puerto 3000 |
| `npm run build` | Build de producción optimizado en `build/` |
| `npm test` | Jest en modo observación (hoy no hay tests) |
| `npm run eject` | Expone la configuración de CRA. **No usar**: es irreversible |

## Despliegue

Según `sigmetum-infra`, el frontend se despliega con **AWS Amplify** (región `eu-west-3`, dominio `sigmetum-a.org`), con compilación automática en cada push a la rama configurada. La configuración actual de Terraform espera un proyecto Vite y no funciona con este repositorio: ver el hallazgo [A5](09-estado-actual-y-deuda-tecnica.md#prioridad-alta-errores-funcionales).

Checklist para que un despliegue funcione:

1. Directorio de artefactos: `build` (con CRA) o `dist` (si se migra a Vite).
2. Variables de entorno de Amplify con los nombres que lee el código (`REACT_APP_*` hoy).
3. Regla de reescritura de la SPA: origen `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|pdf)$)([^.]+$)/>`, destino `/index.html`, tipo `200`.
4. Recursos estáticos accesibles: CloudFront con OAC delante del bucket y `REACT_APP_S3_URL` apuntando a esa distribución.
5. `ALLOWED_ORIGIN` del backend igual al dominio final.

## Convenciones del código

- **Componentes:** funcionales, en PascalCase, uno por archivo y con exportación por defecto. Las props se desestructuran en la firma.
- **Llamadas HTTP:** siempre a través de `services/api.js`, nunca con `fetch` directo. Los errores se capturan en el componente y se muestran con `useDialog` y `DialogAdvice`.
- **Textos:** siempre con `t()`, añadiendo la clave en `es` y `en`.
- **Recursos de S3:** declara la clave en `config/assets.js` y usa `assetUrl()`.
- **Estilos:** Tailwind en línea. Reutiliza `ButtonPrincipal` y `ButtonAlternative` en lugar de crear botones nuevos.
- **Animaciones:** Framer Motion. Envuelve los elementos que se desmontan en `<AnimatePresence>`.
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

## Tests (pendiente)

Jest y Testing Library ya están instalados. Orden sugerido:

1. Unitarios de `FormatFileName`, `SortItemsList` y `downloadXLSX` (comprobando que no muta los datos).
2. `Filter`: combinación Y/O de filtros y facetas dependientes.
3. `FileUpload`: confirmar y cancelar con campos vacíos (con `fetch` simulado).
4. E2E con Playwright: portada → explorar → filtrar → abrir especie → descargar Excel.

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
