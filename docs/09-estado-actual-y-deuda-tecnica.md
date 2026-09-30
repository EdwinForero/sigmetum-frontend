# 09. Estado actual y deuda técnica

Análisis realizado el 30/09/2026 sobre la rama `feature/sigmetum_front_v2`.

## Estado de git

| Aspecto | Valor |
|---|---|
| Rama actual | `feature/sigmetum_front_v2`, sincronizada con `origin` |
| Commits por delante de `master` | 5 |
| Otras ramas | `master`, `feature/testing` (local y remota) |
| Cambios sin confirmar | `.claude/` (configuración compartida de Claude Code), `docs/` y `README.md` (documentación) |
| `.env` | Existe en local y **no** está versionado (correcto). `.env.example` sí está versionado |

Los cinco commits de la rama forman una refactorización coherente:

1. `5321dfb`: centraliza las variables de entorno en `src/config/env.js` y saca `.env` del control de versiones.
2. `7df426a`: mejora de mantenibilidad (hook `useDialog`, `ErrorBoundary`, servicio `api`).
3. `b4867f2`: migra al prefijo `/api/v1` y al envoltorio `{ success, data }`.
4. `0c7c2ac`: añade `src/config/assets.js` y adapta las claves de S3 a la nueva estructura del bucket.
5. `375b6d7`: adapta el frontend a los cambios incompatibles de la API v2 (flujo de borrador en la subida con `draftKey`).

El contrato con el backend coincide: todas las rutas que llama el frontend existen en `sigmetum-backend/routes` (ver [03-api.md](03-api.md)).

## Métricas

| Métrica | Valor |
|---|---|
| Archivos JS en `src/` | 56 |
| Líneas de JS | ~4.200 |
| Páginas | 10 |
| Componentes | 34 (3 sin uso) |
| Claves de traducción | 198 en ES y 197 en EN |
| Tests | 0 (hay dependencias de Testing Library instaladas pero ningún archivo `*.test.js`) |
| Linter | Configuración por defecto de CRA (`react-app`) |
| Tipado | Ninguno (JavaScript sin PropTypes ni TypeScript) |

## Valoración general

La base funciona y la refactorización reciente la ha mejorado: hay un servicio HTTP único, un hook de diálogos y una configuración centralizada. Los puntos débiles son la ausencia total de tests, varios errores funcionales que no se ven en el camino feliz, una dependencia de build obsoleta (CRA) y bastante duplicación en estilos y lógica.

## Hallazgos priorizados

### Prioridad alta (errores funcionales)

**A1. Cancelar una subida con campos vacíos deja el proceso colgado y un borrador huérfano en S3.**
[src/components/FileUpload.js:73-83](../src/components/FileUpload.js#L73-L83). La promesa que espera la decisión del usuario solo se resuelve en `onConfirm`. El botón "Cancelar" y el clic fuera del diálogo llaman a `closeDialog`, que no la resuelve. Como consecuencia, nunca se envía `POST /upload/confirm` con `confirmed: false`, el Excel borrador se queda en S3 y el bucle `for` no continúa ni termina. La rama `else` de las líneas 99-110 es inalcanzable.
*Solución:* pasar al diálogo un `onClose` que resuelva `false`, por ejemplo `showDialog(..., { onConfirm: () => resolve(true), onCancel: () => resolve(false) })`.

**A2. Exportar a Excel modifica los datos en memoria.**
[src/utilities/CSVfunctions.js:12-19](../src/utilities/CSVfunctions.js#L12-L19). `downloadXLSX` convierte los arrays en cadenas **sobre los mismos objetos** que usan `Filter`, `Explore` y `Table`. Después de descargar, un campo como `Especies Características` pasa de `['A', 'B']` a `'A, B'`, y los filtros y el listado de especies dejan de funcionar hasta recargar.
*Solución:* copiar cada fila antes de transformarla: `filteredData.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])))`.

**A3. Un término no latino con caracteres especiales puede tumbar toda la aplicación.**
[src/components/SpeciesCard.js:27](../src/components/SpeciesCard.js#L27) y [src/components/DialogSpecies.js:40](../src/components/DialogSpecies.js#L40). Los términos se insertan en `new RegExp(...)` sin escapar. Un término como `subsp. (var.)` o `+` lanza `SyntaxError` durante el render, y el `ErrorBoundary` sustituye toda la app por la pantalla de error. Los términos los introduce un administrador desde "Administrar contenido".
*Solución:* escapar con `term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` y extraer `highlightTerms` a una utilidad compartida (ahora está duplicada).

**A4. Los campos de texto no son controlados y no se vacían tras guardar.**
[src/components/TextInput.js:5-8](../src/components/TextInput.js#L5-L8) recibe la prop `term`, pero `TermsManager` e `ImageGalleryManager` le pasan `value`. Pasa lo mismo en [src/components/FilterSearchBar.js:5](../src/components/FilterSearchBar.js#L5), que espera `searchText`. El `<input>` recibe `value={undefined}`: tras añadir un término, el estado se limpia pero el texto sigue visible en pantalla, y si se vuelve a pulsar "+" aparece el aviso de campo vacío.
*Solución:* renombrar la prop a `value` en ambos componentes.

**A5. La infraestructura de Terraform no sirve para desplegar este frontend tal como está.**
Revisado en `sigmetum-infra/modules/amplify/main.tf` (commit `19bdde3`):
- El `build_spec` de Amplify publica `dist/` y define `VITE_API_URL`, que son convenciones de **Vite**. Este proyecto es CRA: compila en `build/` y lee `REACT_APP_*`. El despliegue fallaría por no encontrar artefactos, y aunque se corrigiera la carpeta, la app apuntaría a `http://localhost:8000` porque no recibiría `REACT_APP_BASE_URL`.
- No hay regla de reescritura para la SPA (`/<*>` → `/index.html` con código 200). Recargar o abrir un enlace directo a `/explorar` devolvería 404.
- `modules/storage` bloquea el acceso público al bucket, pero el frontend carga logos, banner y glosario con URLs públicas de S3 (`assetUrl`). Sin una distribución CloudFront con OAC delante, esas peticiones darán 403.

*Solución:* o se migra el frontend a Vite (ver M5), que encaja con la infraestructura, o se ajusta el módulo (`baseDirectory: build` y variables `REACT_APP_*`). En los dos casos hay que añadir la regla de reescritura y definir de dónde se sirven los recursos estáticos.

### Prioridad media (seguridad, robustez y mantenibilidad)

| Id | Hallazgo | Ubicación |
|---|---|---|
| M1 | El JWT se guarda en `localStorage`, accesible ante cualquier XSS. Lo ideal es una cookie `HttpOnly` emitida por el backend. Tampoco hay botón de cerrar sesión | `LoginForm.js:18`, `services/api.js:4` |
| M2 | `FileUpload` hace `fetch` directo en tres sitios en lugar de usar `services/api.js`, así que duplica cabeceras y no trata el envoltorio `{ success }` igual que el resto | `FileUpload.js:55, 87, 100` |
| M3 | Se importa `framer-motion` en 15 archivos, pero en `package.json` solo está declarado `motion`. Funciona porque `motion` depende de `framer-motion`, pero es una dependencia implícita. Conviene migrar las importaciones a `motion/react` | todos los componentes animados |
| M4 | Dependencias que sobran: `install` y `npm` (añadidas por error con `npm install install npm`), `react-joyride` y `web-vitals` (no se importan en ningún sitio) | `package.json` |
| M5 | Create React App está abandonado. `react-scripts` 5 arrastra dependencias con vulnerabilidades conocidas y no admite versiones nuevas de React. La alternativa recomendada es Vite | `package.json` |
| M6 | No hay tests. La lógica con más riesgo (filtros de `Filter`, `FormatFileName`, `SortItemsList`, `downloadXLSX` y el flujo de subida) se puede cubrir con Jest y Testing Library, que ya están instalados | toda la base |
| M7 | Comparaciones `JSON.stringify(prev) !== JSON.stringify(filtered)` en cada cambio de filtro. Con miles de filas es costoso | `App.js:81-91` |
| M8 | Código muerto: `UploadButton.js` (usa `alert` y no sube nada), `ImageCarrousel.js` (comentado en `Explore`, con imágenes de `via.placeholder.com`) y `utilities/TokenExpiration.js` (duplica la lógica de `ProtectedRoute`) | `components/`, `utilities/` |
| M9 | `console.log(selectedFilters)` olvidado en producción | `Filter.js:70` |
| M10 | Favicon fijo en `index.html` apuntando al bucket antiguo `s3-sigmetumtest`. `Header` lo reescribe en tiempo de ejecución, pero hasta entonces se pide a un bucket que puede no existir | `public/index.html` |
| M11 | Las preferencias de cookies se guardan pero nada las lee. Si la web no usa cookies de publicidad ni de seguimiento, el banner y la política deberían reflejarlo | `CookieBanner.js` |

### Prioridad baja (accesibilidad, calidad y detalles)

| Id | Hallazgo | Ubicación |
|---|---|---|
| B1 | Botones de solo icono sin `aria-label` (menú, paginación, papelera, "+"). Un lector de pantalla lee el nombre de la ligadura ("delete", "Menu") | `ButtonPrincipal`, `FileUpload`, `TermsManager` |
| B2 | Los diálogos no tienen `role="dialog"`, `aria-modal`, foco atrapado ni cierre con Escape | `DialogAdvice`, `DialogSpecies` |
| B3 | Las etiquetas `<label>` no están asociadas a sus `<input>` (sin `htmlFor`/`id`) | `LoginForm`, `ContactForm` |
| B4 | En el login, el botón está fuera del `<form>`, por lo que Enter no envía | `LoginForm.js:70` |
| B5 | `alt="Imagen"` genérico en todas las imágenes, incluidos los logos institucionales | `ImageComponent.js` |
| B6 | `import { React, useState } from 'react'`: `React` no es una exportación con nombre y vale `undefined`. Funciona solo gracias al runtime JSX automático | `Home`, `DataManagement`, `FilesUpload`, `ContentManagement`, `VegetationGallery`, `TermsManager`, `ImageGalleryManager`, `ImageComponent` |
| B7 | Textos fijos sin traducir: pantalla del `ErrorBoundary`, nombres del menú lateral (`'Filtro'`, `'Administrar datos'`) y colaboradores de la portada | `ErrorBoundary.js`, `App.js`, `Home.js` |
| B8 | La clave `dataManagement.noDataFoundPlaceholder` solo existe en español | `languages/en/translation.json` |
| B9 | El botón "Actualizar datos" reutiliza el tooltip de "Descargar Excel" | `DataManagement.js:98` |
| B10 | `LanguageSwitcher` deduce el idioma comparando el texto de la etiqueta en lugar de usar `value` | `LanguageSwitcher.js:23` |
| B11 | La descarga del glosario usa `<a download>` hacia otro dominio (S3). El navegador ignora `download` y abre el PDF, y el `try/catch` nunca detecta errores | `Explore.js:103-112` |
| B13 | Colores hexadecimales repetidos en cientos de clases (`#15B659`, `#0C1811`...) en lugar de definirlos como colores del tema de Tailwind | todo `src/` |

## Hoja de ruta sugerida

1. **Corregir A1-A4** (una tarde de trabajo), con un test para cada uno.
2. **Decidir CRA o Vite y alinear la infraestructura (A5)**: sin esto no hay despliegue reproducible desde Terraform.
3. **Limpiar dependencias y código muerto** (M3, M4, M8, M9, M10).
4. **Añadir tests** de utilidades y de `Filter`, y un flujo E2E con Playwright para explorar, filtrar y descargar.
5. **Accesibilidad básica** (B1-B5 y el contraste de la paleta, ver [07](07-i18n-y-estilos.md#paleta)): es un sitio universitario público y le aplican las pautas WCAG 2.1 AA (RD 1112/2018 en España).
6. **Migrar a Vite** (si no se hizo en el paso 2) y definir la paleta en `tailwind.config.js`.
7. **Seguridad de sesión** (M1), coordinado con el backend.
