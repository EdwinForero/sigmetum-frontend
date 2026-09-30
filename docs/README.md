# Documentación técnica de SIGMETUM-A (frontend)

Estado de la documentación: 30/09/2026, rama `feature/sigmetum_front_v2` (commit `375b6d7`).

## Índice

| Documento | Contenido |
|---|---|
| [01-arquitectura.md](01-arquitectura.md) | Estructura de carpetas, arranque, layout, rutas, estado global, flujo de datos (con diagramas), autenticación y recursos estáticos |
| [02-tecnologias.md](02-tecnologias.md) | Cada dependencia: versión, para qué se usa, dónde y si sobra. Recursos y servicios externos |
| [03-api.md](03-api.md) | Cliente HTTP, envoltorio `{ success, data }`, errores y los 15 endpoints consumidos, verificados contra el backend |
| [04-paginas.md](04-paginas.md) | `App` y las 10 páginas: props, estado, funciones y llamadas a la API |
| [05-componentes.md](05-componentes.md) | Los 34 componentes agrupados por función: props, estado interno y métodos |
| [06-utilidades-hooks-config.md](06-utilidades-hooks-config.md) | `env`, `assets`, servicio API, `useDialog` y utilidades (`downloadXLSX`, `FormatFileName`, `SortItemsList`) con ejemplos |
| [07-i18n-y-estilos.md](07-i18n-y-estilos.md) | Traducciones y convenciones, tipografías, paleta con su contraste medido, animaciones y diseño adaptable |
| [08-guia-desarrollo.md](08-guia-desarrollo.md) | Instalación, variables de entorno, scripts, checklist de despliegue, convenciones, cómo añadir páginas, columnas o endpoints, tests y herramientas de Claude Code |
| [09-estado-actual-y-deuda-tecnica.md](09-estado-actual-y-deuda-tecnica.md) | Estado de git, métricas, errores y deuda técnica priorizados, y hoja de ruta |
| [integracion/para-backend.md](integracion/para-backend.md) | **Para quien mantiene el backend:** qué endpoints y campos consume el frontend, qué da por hecho, discrepancias verificadas y qué actualizar si se cambia la API |
| [integracion/para-infra.md](integracion/para-infra.md) | **Para quien mantiene la infraestructura:** build, variables `VITE_*`, recursos estáticos, reglas de Amplify, dominios, comprobación tras desplegar y reversión |

## Por dónde empezar

- **Si te incorporas al proyecto:** 08 (guía) → 01 (arquitectura) → 04 (páginas).
- **Si vas a tocar la integración con el backend:** 03 (API) y el flujo de subida de datos en 01.
- **Si vas a planificar trabajo:** 09 (estado actual y deuda técnica).
- **Si mantienes el backend o la infraestructura:** `integracion/` (un documento para cada uno).

## Resumen técnico

| Aspecto | Detalle |
|---|---|
| Stack | React 18, Vite 6, React Router 6, Tailwind CSS 3, Motion 11, i18next (ES/EN), SheetJS (`xlsx`) |
| Tests | Vitest 3 con Testing Library (jsdom): `npm test` |
| Backend | API Express (`sigmetum-backend`) bajo `/api/v1`, con respuestas `{ success, data \| error }` |
| Almacenamiento | S3 en `eu-west-1` (`sigmetum-infra`): datos por provincia, Excel versionados, imágenes de la galería y recursos estáticos |
| Despliegue | AWS Amplify, definido en `sigmetum-infra` (Terraform). Pendiente de ajustar, ver riesgos |
| Tamaño | 63 archivos fuente (56 de JavaScript), unas 4.200 líneas, 10 páginas, 34 componentes y 12 tests |
| Zona pública | Inicio, explorador de especies con filtros facetados, galería, "Sobre nosotros" y política de cookies |
| Zona privada (JWT) | Carga de Excel por provincia con control de campos vacíos, gestión de versiones y gestión de términos no latinos e imágenes |

## Conceptos del dominio

| Término | Significado en la aplicación |
|---|---|
| Registro | Una fila del Excel de una provincia convertida a JSON. Las claves son los nombres de columna en español |
| Especies Características | Columna con las especies (array) que definen una serie de vegetación. Es la base del explorador |
| Versión | Cada Excel subido para una provincia. Solo una versión por provincia está **activa** y es la que se publica |
| Borrador (`draftKey`) | Excel subido con filas incompletas, pendiente de que el administrador confirme o cancele |
| Términos no latinos | Palabras como `subsp.` o `var.` que no se escriben en cursiva dentro de un nombre científico |

## Estado de los riesgos

Detallado en [09-estado-actual-y-deuda-tecnica.md](09-estado-actual-y-deuda-tecnica.md#hallazgos-priorizados).

| Riesgo | Estado |
|---|---|
| Cancelar una subida con campos vacíos dejaba el proceso colgado y un borrador huérfano en S3 | Corregido y con test |
| Exportar a Excel modificaba los datos y rompía los filtros | Corregido y con test |
| Un término no latino con caracteres especiales tumbaba toda la aplicación | Corregido y con test |
| Los campos de texto no se vaciaban tras guardar | Corregido y con test |
| Create React App abandonado | Migrado a Vite y Vitest |
| Amplify en Terraform: variables `VITE_*`, regla de la SPA y CloudFront para los recursos estáticos | **Pendiente** en `sigmetum-infra` |
| Contraste de la paleta por debajo de WCAG AA, token de sesión en `localStorage`, cobertura de tests parcial | Pendiente |
