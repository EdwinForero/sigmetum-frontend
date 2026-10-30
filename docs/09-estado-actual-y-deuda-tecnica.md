# 09. Estado actual y deuda técnica

Análisis realizado el 30/09/2026 sobre la rama `feature/sigmetum_front_v2`, actualizado tras la migración a Vite y la corrección de los hallazgos A1 a A4.

Última actualización: 30/10/2026

## Estado de git

| Aspecto | Valor |
|---|---|
| Rama actual | `feature/sigmetum_front_v2`, sincronizada con `origin` |
| Commits por delante de `master` | 12 (5 de la refactorización a la API v2, 2 de documentación y herramientas, y la migración a Vite con los 4 arreglos) |
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
| Archivos de código (sin tests) | 57 |
| Páginas | 10 |
| Componentes | 34 |
| Archivos de test | 14 |
| Claves de traducción (por idioma) | 202 |
| Tests | 60 en 14 archivos (Vitest): utilidades, campos de texto, flujo de subida, cliente API, formularios de acceso y contacto, galería, tabla, imágenes y traducciones. Además, 151 del plugin `ciclo-agentico` (`node:test`, `npm run agentes:test`) |
| Linter | ESLint 9 (`npm run lint`): 0 errores y un tope de avisos que no puede crecer. `npm run quality` añade seguridad |
| Tipado | Ninguno (JavaScript sin PropTypes ni TypeScript) |

Estas son las **únicas** cifras del repositorio de documentación: el resto de documentos no deben repetirlas. `npm run docs:check` verifica las cuatro primeras filas con el código, y `npm run docs:check -- --metrics` las imprime para actualizarlas. El número de tests sale de `npm test`. De los 34 componentes, 2 no se usan (`UploadButton`, `ImageCarrousel`).

## Historial de iteraciones

| Fecha | Cambio |
|---|---|
| 30/10/2026 | Integración con el backend, lotes A, B y C (spec `docs/specs/2026-10-30-integracion-backend-lotes-abc-design.md`). Resueltas en el frontend **D2** (`FormatFileName` con `AAAA-MM-DD_vN.xlsx`), **D3** (`FileUpload` solo `.xlsx`), **D4** (`Table` con la unión de claves), **D6** (un `401` en los métodos `*Auth` de `api.js` borra el token y redirige a `/login`) y **D7** (`429` propio en login; también en contacto, con `400`). **D5** y **D8** quedan resueltas en el backend (`F3` y `F2`, 29/10/2026) y no exigen cambios aquí. Además: `maxLength` en `ContactForm`, validación del título en `ImageGalleryManager` (el backend rechaza `/ \ .. , ' : & # ? %` y comillas), `encodeURIComponent` de `imageKey`, y `FileUpload` interpreta el `404` de `/upload/confirm` (`Draft not found`) y comprueba la cancelación. 5 claves nuevas de i18n. D1 y M12 siguen abiertas. Limitaciones conocidas en M18. Los tests simulan la API: no se ha probado contra el backend real **(por confirmar)** |
| 30/10/2026 | Se lleva al frontend el flujo agéntico `ciclo-agentico` desde `sigmetum-backend` (solo el núcleo, perfil `base`): `plugins/ciclo-agentico/` sin cambios, marketplace local `locales-front`, `.claude/flujo.json`, scripts `docs:gate`, `agentes:test` y `agentes:bootstrap`, permisos `ask` de git y `docs/specs/`. Ajustes de configuración que exige: `test.include` en `vite.config.js` (Vitest no debe recoger los tests de `node:test` del plugin) y un bloque de ESLint para `plugins/**/*.mjs` (el tope de avisos no cambia). Después se configuran los plugins del repositorio: `superpowers` (de `superpowers-marketplace`), `i-have-adhd` (`estilo` de `flujo.json`) y `ui-ux-pro-max` en `.claude/settings.json`, y la taste skill pasa de `.claude/skills/` al plugin local `dominio-frontend` (perfil `frontend`), sin dejar skills sueltas. `awesome-design-md` no es un plugin: se adapta el `DESIGN.md` de Mintlify como estructura en [DESIGN.md](../DESIGN.md) con los valores del repositorio (colores, fuentes y radios medidos en el código y contraste recalculado; no se ha comprobado visualmente con la web en ejecución). Pendiente de comprobar en un equipo: la instalación del plugin y el prefijo de sus comandos **(por confirmar)**. La CI ejecuta `agentes:test` (en un paso con Node 22, por el glob de `node --test`; no verificado en GitHub hasta la primera PR **(por confirmar)**) y no ejecuta `docs:gate`, que depende de `git status` y de la fecha de hoy |

## Valoración general

La base funciona y la refactorización reciente la ha mejorado: hay un servicio HTTP único, un hook de diálogos y una configuración centralizada. Los cuatro errores funcionales graves están corregidos con tests, y el proyecto compila con Vite. Los puntos débiles que quedan son la cobertura de tests (solo lo corregido), la infraestructura de despliegue sin ajustar, la seguridad de la sesión, la accesibilidad y bastante duplicación en estilos.

## Hallazgos priorizados

### Resueltos

| Id | Hallazgo | Corrección | Commit |
|---|---|---|---|
| A1 | Cancelar una subida con campos vacíos dejaba el proceso colgado y un borrador huérfano en S3 | `useDialog` admite `onCancel`; `FileUpload` lo resuelve como "no confirmado", envía `confirmed: false` y detiene la cola. Además, `value = ''` en lugar de `null` al vaciar el campo de archivos | `31adda3` |
| A2 | Exportar a Excel modificaba los datos en memoria y rompía los filtros | `downloadXLSX` trabaja sobre copias de las filas | `9f777d3` |
| A3 | Un término no latino con caracteres especiales (`(`, `+`) tumbaba toda la aplicación | `highlightTerms` extraída a `utilities/` (estaba duplicada) y con escape de caracteres especiales | `0e09c9a` |
| A4 | Los campos de texto no se vaciaban tras guardar | `TextInput` y `FilterSearchBar` pasan a usar la prop `value`, que es la que reciben de sus padres | `1df1308` |
| M3 | `framer-motion` importado sin estar declarado | Todas las importaciones pasan a `motion/react` | `eed9c39` |
| M4 | Dependencias sobrantes (`install`, `npm`, `react-joyride`, `web-vitals`) | Eliminadas | `eed9c39` |
| M5 | Create React App abandonado | Migración a Vite 6 y Vitest 3 | `eed9c39` |
| Audit | `npm audit` de producción: 7 vulnerabilidades, 5 de ellas altas (`react-router-dom`, `postcss` y `styled-components`, con arreglo compatible) | `npm audit fix` sin `--force`: quedan 3, las aceptadas en M14 | `31c4e64` |
| ESLint | 4 errores al introducir ESLint: comillas sin escapar, `forwardRef` anónimo y un bloque vacío | Corregidos sin cambiar el comportamiento. El resto queda como avisos con un tope que no puede crecer | `f632364` |
| B8 | La clave `dataManagement.noDataFoundPlaceholder` solo existía en español | Era una clave huérfana que ningún código usaba: se eliminó y un test comprueba la paridad de traducciones | `19351ae` |

Cada corrección de A1 a A4 tiene su test, que se comprobó que fallaba antes del arreglo.

### Prioridad alta (pendiente)

#### A5. La infraestructura de Terraform no despliega el frontend todavía

El frontend ya encaja con el `build_spec` de `sigmetum-infra/modules/amplify/main.tf` (commit `19bdde3`): compila en `dist/` y usa variables `VITE_*`. Quedan tres diferencias que se arreglan en el repositorio de infraestructura:

- **Variables de entorno.** El módulo define `VITE_API_URL`, que el código no lee. Hay que definir `VITE_BASE_URL` (con el valor de `var.backend_url`), `VITE_API_PREFIX` y `VITE_S3_URL`. Sin ellas la app apuntaría a `http://localhost:8000`.
- **Reescritura de la SPA.** No hay regla de `/<*>` a `/index.html` con código 200. Recargar o abrir un enlace directo a `/explorar` devolvería 404.
- **Recursos estáticos.** `modules/storage` bloquea el acceso público al bucket, pero el frontend carga logos, banner y glosario con URLs públicas de S3 (`assetUrl`). Sin una distribución CloudFront con OAC delante, esas peticiones darán 403.

Ver la lista completa de comprobaciones en [08](08-guia-desarrollo.md#despliegue).

#### Integración con el backend y la infraestructura

Al escribir los documentos de [integración](integracion/para-backend.md) se comprobó el código del backend y de `sigmetum-infra`. Los hallazgos nuevos, con su detalle y responsable, están allí:

| Origen | Hallazgos | Documento |
|---|---|---|
| Frontend frente a backend | **D1** abrir una versión en "Administrar datos" falla: pide un Excel a un endpoint que parsea JSON (por confirmar). D9 caducidad de las URLs prefirmadas (informativo) | [para-backend.md](integracion/para-backend.md#6-discrepancias-verificadas-hoy) |
| Frontend frente a infraestructura | **I1** variables `VITE_*` no definidas. **I2** recursos estáticos sin acceso público ni CloudFront. **I3** sin regla de reescritura de la SPA. **I4** backend de dev en HTTP. **I5** faltan `ALLOWED_ORIGIN` y `ADMIN_*` en el backend desplegado. I6, I7 | [para-infra.md](integracion/para-infra.md#1-resumen-qué-falta-para-que-el-frontend-funcione) |

D1 sigue abierta (necesita un endpoint nuevo del backend); D2, D3, D4, D5, D6, D7 y D8 están resueltas (ver el historial); I1 a I7 en `sigmetum-infra`. Esto **sustituye y amplía A5**.

### Prioridad media (seguridad, robustez y mantenibilidad)

| Id | Hallazgo | Ubicación |
|---|---|---|
| M1 | El JWT se guarda en `localStorage`, accesible ante cualquier XSS. Lo ideal es una cookie `HttpOnly` emitida por el backend. Tampoco hay botón de cerrar sesión | `LoginForm.js:18`, `services/api.js:4` |
| M2 | `FileUpload` hace `fetch` directo en tres sitios en lugar de usar `services/api.js`, así que duplica cabeceras y no trata el envoltorio `{ success }` igual que el resto | `FileUpload.js:55, 87, 100` |
| M18 | `FileUpload.js` lee `localStorage['token']` en tres sitios, fuera de las excepciones de CLAUDE.md (`services/api.js`, `LoginForm`, `ProtectedRoute`). Por eso **no redirige a `/login` ante un `401`** (a diferencia de `api.js`) y muestra el error de subida. Su `404` de `/upload/confirm` se interpreta solo por el estado, sin leer el texto `Draft not found`: un `404` con otro significado se mostraría como "el borrador ya no existe". Se resuelve migrando `FileUpload` a `api.js` (M2) | `FileUpload.js:58, 92, 110` |
| M6 | La cobertura de tests es parcial: faltan `Filter` (lógica Y/O y facetas dependientes) y `SortItemsList`, y no hay pruebas E2E | toda la base |
| M7 | Comparaciones `JSON.stringify(prev) !== JSON.stringify(filtered)` en cada cambio de filtro. Con miles de filas es costoso | `App.js:81-91` |
| M8 | Código muerto: `UploadButton.js` (usa `alert` y no sube nada), `ImageCarrousel.js` (comentado en `Explore`, con imágenes de `via.placeholder.com`) y `utilities/TokenExpiration.js` (duplica la lógica de `ProtectedRoute`) | `components/`, `utilities/` |
| M9 | `console.log(selectedFilters)` olvidado en producción | `Filter.js:70` |
| M10 | Favicon fijo en `index.html` apuntando al bucket antiguo `s3-sigmetumtest`. `Header` lo reescribe en tiempo de ejecución, pero hasta entonces se pide a un bucket que puede no existir | `public/index.html` |
| M12 | `DialogSpecies` busca las filas de una especie con `item["Especies Características"]?.includes(nombre)`. Si el valor es una cadena (una sola especie en la fila), `includes` busca **subcadenas**: abrir "Quercus ilex" mezcla atributos de filas cuyo texto solo contiene ese nombre. Con arrays la comparación es exacta | `DialogSpecies.js:25` |
| M13 | Las tipografías e iconos se cargan desde Google Fonts (terceros): hay una petición a Google antes de que el usuario acepte cookies (implicación de privacidad), añade una dependencia externa y el atributo `onload` inline de los `<link>` impide una Content-Security-Policy estricta. Solución: alojar las fuentes (Amaranth, Sen, Material Symbols) en el propio sitio | `index.html:18-19` |
| M14 | Dependencias de producción con avisos sin arreglo compatible: `xlsx` (alto; solo se usa para **escribir**, los avisos afectan a la lectura) y `react-router` (moderado; la corrección está solo en la v7 y ningún dato del usuario llega a `Link`/`navigate`). Están aceptadas con su justificación en `scripts/quality-check.mjs`; revisarlas al actualizar | `package.json` |
| M15 | Las cookies propias (`cookieConsent`, `cookiePreferences`) se crean sin `SameSite` ni `Secure` | `CookieBanner.js:29-45` |
| M16 | Un único paquete JavaScript supera el aviso de 500 kB de Vite: todas las rutas y `xlsx` se descargan al entrar. Cargar las rutas con `React.lazy` y `xlsx` con `import()` al descargar | `vite build` |
| M17 | No hay política de privacidad ni aviso de tratamiento de datos en el formulario de contacto, que recoge nombre y correo. Solo existe la política de cookies, cuyo texto del banner menciona publicidad y personalización que la web no usa (ver M11). Determinar con el servicio jurídico qué es obligatorio | `ContactForm.js`, `Cookies.js` |
| M11 | Las preferencias de cookies se guardan pero nada las lee. Si la web no usa cookies de publicidad ni de seguimiento, el banner y la política deberían reflejarlo | `CookieBanner.js` |

### Prioridad baja (accesibilidad, calidad y detalles)

| Id | Hallazgo | Ubicación |
|---|---|---|
| B1 | Botones de solo icono sin `aria-label` (menú, paginación, papelera, "+"). Un lector de pantalla lee el nombre de la ligadura ("delete", "Menu") | `ButtonPrincipal`, `FileUpload`, `TermsManager`, `ImageGalleryManager.js:97` (papelera de la galería) |
| B2 | Los diálogos no tienen `role="dialog"`, `aria-modal`, foco atrapado ni cierre con Escape | `DialogAdvice`, `DialogSpecies` |
| B3 | Las etiquetas `<label>` no están asociadas a sus `<input>` (sin `htmlFor`/`id`) | `LoginForm`, `ContactForm` |
| B4 | En el login, el botón está fuera del `<form>`, por lo que Enter no envía | `LoginForm.js:70` |
| B5 | `alt="Imagen"` genérico en todas las imágenes, incluidos los logos institucionales | `ImageComponent.js` |
| B6 | `import { React, useState } from 'react'`: `React` no es una exportación con nombre y vale `undefined`. Funciona solo gracias al runtime JSX automático | `Home`, `DataManagement`, `FilesUpload`, `ContentManagement`, `VegetationGallery`, `TermsManager`, `ImageGalleryManager`, `ImageComponent` |
| B7 | Textos fijos sin traducir: pantalla del `ErrorBoundary`, nombres del menú lateral (`'Filtro'`, `'Administrar datos'`) y colaboradores de la portada | `ErrorBoundary.js`, `App.js`, `Home.js` |
| B9 | El botón "Actualizar datos" reutiliza el tooltip de "Descargar Excel" | `DataManagement.js:98` |
| B10 | `LanguageSwitcher` deduce el idioma comparando el texto de la etiqueta en lugar de usar `value` | `LanguageSwitcher.js:23` |
| B11 | La descarga del glosario usa `<a download>` hacia otro dominio (S3). El navegador ignora `download` y abre el PDF, y el `try/catch` nunca detecta errores | `Explore.js:103-112` |
| B13 | Colores hexadecimales repetidos en cientos de clases (`#15B659`, `#0C1811`...) en lugar de definirlos como colores del tema de Tailwind | todo `src/` |
| B14 | Enlace `http://` a una entidad colaboradora (por confirmar si admite https) | `Home.js:39` |
| B15 | El `<html lang>` es fijo (`es-ES`) aunque la interfaz cambie a inglés: los lectores de pantalla pronuncian mal el texto | `index.html`, `LanguageSwitcher` |
| B16 | No hay ningún atributo `aria-*` ni `role` en el código: los iconos (texto de Material Symbols) se leen como palabras, los diálogos no son modales para un lector, el spinner no se anuncia y los tooltips no se asocian a su botón | toda la interfaz |
| B17 | `outline-none` en 12 sitios sin una alternativa de foco visible | 6 archivos |
| B18 | Solo `Home`, `Cookies` y `NotFound` tienen `<h1>`; el resto de páginas abre con `<h2>` | páginas |
| B19 | No se respeta `prefers-reduced-motion`: fondo con parallax (`background-attachment: fixed`), flecha con rebote infinito y transiciones de página | `ImageComponent`, `ScrollIndicator`, `Explore` |

## Hoja de ruta sugerida

1. **Ajustar `sigmetum-infra` (A5, I1 a I7):** variables `VITE_*`, regla de reescritura de la SPA, CloudFront para los recursos estáticos, backend de dev en HTTPS y variables del backend (`ALLOWED_ORIGIN`, `ADMIN_*`). Es lo que bloquea publicar.
2. **Resolver D1 con el backend:** sin un endpoint que entregue una versión como registros, "Administrar datos" no puede abrirla. No cerrar `/get-data` antes.
3. **Correcciones propias del frontend:** M12 (D2, D3, D4, D6 y D7 ya están hechas), con su test.
4. **Tests de caracterización** de `Filter` y `SortItemsList` (M6).
5. **Limpiar código muerto** (M8, M9, M10): `UploadButton`, `ImageCarrousel`, `TokenExpiration`, el `console.log` de `Filter` y el favicon del bucket antiguo.
6. **Añadir ESLint** con las reglas de React y de hooks, ya que Vite no lo incluye.
7. **Usar `services/api.js` en `FileUpload`** (M2). Requiere que el error del servicio conserve `data` para leer `emptyFields` y `draftKey`.
8. **Accesibilidad básica** (B1-B5 y el contraste de la paleta, ver [07](07-i18n-y-estilos.md#paleta)): es un sitio universitario público y le aplican las pautas WCAG 2.1 AA (RD 1112/2018 en España).
9. **Paleta en `tailwind.config.js`** (B13) y E2E con Playwright.
10. **Seguridad de sesión** (M1), coordinado con el backend.
11. **Proteger las ramas** `master` y `feature/testing` exigiendo la CI en verde, y activar *Dependabot security updates* (ajustes de GitHub, ver [08](08-guia-desarrollo.md#integración-continua-y-dependencias)).
12. **Ejecutar `npm test` en el `preBuild` de Amplify** (en `sigmetum-infra`).
13. **Revisión humana de las guías** (sobre todo lo legal: RD 1112/2018 y privacidad) y decisión sobre la paleta.
