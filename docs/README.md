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

## Por dónde empezar

- **Si te incorporas al proyecto:** 08 (guía) → 01 (arquitectura) → 04 (páginas).
- **Si vas a tocar la integración con el backend:** 03 (API) y el flujo de subida de datos en 01.
- **Si vas a planificar trabajo:** 09 (estado actual y deuda técnica).

## Resumen técnico

| Aspecto | Detalle |
|---|---|
| Stack | React 18, Create React App (`react-scripts` 5), React Router 6, Tailwind CSS 3, Framer Motion 11, i18next (ES/EN), SheetJS (`xlsx`) |
| Backend | API Express (`sigmetum-backend`) bajo `/api/v1`, con respuestas `{ success, data \| error }` |
| Almacenamiento | S3 en `eu-west-3`: datos por provincia, Excel versionados, imágenes de la galería y recursos estáticos |
| Despliegue | AWS Amplify, definido en `sigmetum-infra` (Terraform) |
| Tamaño | 63 archivos fuente (56 de JavaScript), unas 4.200 líneas, 10 páginas, 34 componentes y 0 tests |
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

## Riesgos principales

Detallados en [09-estado-actual-y-deuda-tecnica.md](09-estado-actual-y-deuda-tecnica.md#hallazgos-priorizados):

1. Cancelar una subida con campos vacíos deja el proceso colgado y un borrador huérfano en S3.
2. Exportar a Excel modifica los datos en memoria y rompe los filtros.
3. Un término no latino con caracteres especiales puede tumbar toda la aplicación.
4. Los campos de texto no son controlados y no se vacían tras guardar.
5. La configuración de Amplify en Terraform está pensada para Vite y no despliega este proyecto CRA.
