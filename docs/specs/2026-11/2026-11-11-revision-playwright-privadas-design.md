# Revisión Playwright de las páginas privadas de gestión: spec

Fecha: 2026-11-11 · Estado: cerrado

## Objetivo

Corregir los 15 hallazgos de la revisión con Playwright (feature-testing, 2026-11-11, inglés, 1440/768/390 px) de `/administrar-datos`, `/administrar-contenido` y `/cargar-archivos`, y quitar el botón "Filters" de `/administrar-datos` (decisión del usuario: no tiene sentido ahí). El panel de filtros sigue en la página pública `/explorar` (mismo componente `Sidebar`), donde aplican los hallazgos 8 y 9. Además, revisar en responsive los botones de información ("i" junto a los títulos), que no quedan bien y cuyo contenido no se ajusta; el diseño pasa por una skill de diseño (impeccable / ui-ux-pro-max / design-taste-frontend) y por `DESIGN.md` y `docs/guias/accesibilidad.md` (si chocan, manda la guía).

Decisiones del usuario (11-11):
- Hallazgo 2: si se puede corregir, se corrige; si no, se documenta en `docs/integracion/` como fix pendiente con el diagnóstico. Se corrige solo si el cambio es pequeño y no cambia el contrato con el backend.
- Hallazgos 1 y 2: mientras se valida la sesión no se ve nada privado: solo cabecera y pie públicos, sin barra de gestión ni contenido privado.
- Hallazgos 9 y 15: se mantiene Google Fonts con subset y `preconnect`, sin dependencias nuevas; solo los iconos usados y solo los pesos de Mukta Malar usados.
- Hallazgos 12 y 14: ambas mejoras (miniatura en la Galería y zona de arrastre).
- Filtro de datos: se elimina lo que quede huérfano al quitar el botón; no se toca lo que `/explorar` use.

Supuestos: los hallazgos se toman tal cual vienen de la revisión; el botón "Filters" solo se quita en `/administrar-datos` (en `/cargar-archivos` y `/administrar-contenido` ya no aparece según el estado actual de `Sidebar.js`; comprobado el 11/11/2026 en local con API simulada: sin botón «Filters» en `/administrar-datos` a 1440, 768 y 390 px).

## Criterios de aceptación

### De código

Alto
1. Sin sesión, al entrar en cualquiera de las tres rutas solo se ven cabecera y pie públicos (sin barra de gestión, sin contenido privado ni "Loading…") mientras se valida la sesión y hasta redirigir a `/login`. Observación: captura/trace con Playwright sin sesión; con sesión, tampoco aparece contenido privado antes de confirmarla. **Excepción aceptada por el usuario (11/11/2026):** al pasar de una página privada a otra, la barra de gestión se queda visible durante la revalidación (`GET /auth`) porque la sesión ya se confirmó en esa visita; el contenido nuevo no se pinta hasta el estado `ok`. Consecuencia anotada como B47.
2. Con sesión, la carga de las tres rutas no produce en consola 401 en `/api/v1/auth` ni 400 de `cognito-idp.eu-west-3`. Si no puede corregirse con un cambio pequeño que no altere el contrato con el backend (ni la llamada a `/api/v1/auth` ni el flujo de token), el hallazgo queda en `docs/integracion/para-backend.md` (401) o `para-infra.md` (400 de Cognito, si el origen es de configuración) como fix pendiente, con diagnóstico: origen (primer intento o refresh de token), petición, respuesta y propuesta de arreglo. En ambos casos el diagnóstico queda escrito. Cualquier cambio en token se limita a `services/api.js`, `LoginForm` y `ProtectedRoute`.

Medio
3. Con datos vacíos la interfaz distingue "no hay archivos" de "falló la llamada" (mensajes distintos, ambos con `t()` en `es` y `en`); el selector no queda deshabilitado con "There are no versions" / "No data available" sin explicar la causa.
4. Los botones de información tienen un nombre accesible distinto por contexto (datos, Non-Latinisms, Gallery); ningún par de botones en una misma página comparte `aria-label`.
5. En 768 y 1440 px, "About us" cabe en una sola línea en la cabecera.
6. En 1440 px no hay hueco blanco bajo la barra lateral: la barra y el footer no dejan zona vacía.
7. Las tres páginas usan el mismo ancho y alineación de contenido (título en la misma x en `/cargar-archivos`, `/administrar-datos` y `/administrar-contenido`) en 1440, 768 y 390 px.
8. En el panel de filtros de `/explorar` (role=dialog): sin contenido no aparece scroll propio (scrollHeight <= clientHeight en 900 y 844 px de alto); abierto, bloquea el scroll del body (sin segunda barra); tiene `aria-labelledby` apuntando a su título (más allá del `aria-label`).
9. Iconos: la URL de Google Fonts de Material Symbols pide solo los iconos usados (`icon_names`, comprobados en el código: hoy filter_alt, database, settings, upload, logout y los que se encuentren), con `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com`; sin dependencias nuevas. Los iconos no muestran el texto de la ligadura mientras carga ni si la fuente falla. Observación: throttling de red y bloqueo de `fonts.googleapis.com` en Playwright. Si la CSP o la carga exigen cambios de infraestructura, se documenta en `para-infra.md`.

Bajo
10. El selector deshabilitado "Choose a dataset" cumple contraste mínimo (WCAG AA, 4.5:1 para texto) o está justificado según la guía.
11. La lista de términos usa la misma tipografía (tamaño y peso) que la lista de imágenes.
12. Galería de `/administrar-contenido`: cada imagen muestra una miniatura con `alt` adecuado, dimensiones reservadas (sin saltos de layout) y comportamiento correcto en 390/768/1440 px. Primero se comprueba si la respuesta del backend ya entrega la URL de la imagen: si sí, se usa (recursos de S3 declarados según `src/config/assets.js` si procede); si no, el criterio queda definido, la miniatura no se implementa y se señala el impacto en `docs/integracion/para-backend.md` como petición pendiente (qué campo/endpoint hace falta).
13. En 390 px, margen lateral de `main` >= el que fije el sistema de diseño (hoy 8 px); en `/cargar-archivos` el texto no toca el borde y la caja no se recorta (sin scroll horizontal).
14. `/cargar-archivos` tiene una zona de arrastre accesible: el botón actual sigue siendo la alternativa por teclado (misma acción, orden de tabulación lógico); estado de arrastre visible y no solo por color; foco visible; todos los textos por `t()` con claves en `es` y `en`; contraste según `accesibilidad.md`; el anuncio del estado/resultado es perceptible para lectores de pantalla. Sin subida real (fuera de alcance): arrastrar solo selecciona el archivo igual que el botón.
15. Mukta Malar se carga solo con los pesos que usa el código, con `preconnect`; verificable listando los pesos usados (búsqueda de `font-weight` y clases en CSS/componentes) frente a los de la URL de fuentes. Un peso que no pueda comprobarse en el código se marca **(por confirmar)** y se mantiene hasta confirmarlo.

Botón "Filters", filtro huérfano y botones de información
16. `/administrar-datos` no muestra el botón "Filters" (`dataManagementFilter`) en 1440, 768 y 390 px; `/explorar` lo sigue mostrando y funcionando.
17. Tras quitar el botón, se eliminan el panel `Filter`, `selectedData` y `handleFilterDataChange` (`src/App.js`) y cualquier prop, importación, clave i18n o estilo que quede huérfano por este cambio; lo que `/explorar` siga usando no se toca. Se comprueba con búsqueda de referencias antes y después, y con tests que cubren que `/administrar-datos` funciona sin ellos y que `/explorar` conserva su filtro. Lo huérfano que ya existía antes se señala, no se borra.
18. Los botones "i" a 390, 768 y 1440 px: tamaño táctil adecuado, alineados con el título, y su contenido (popover/diálogo) cabe en el viewport sin desbordar ni recortarse, con foco y cierre por teclado según `accesibilidad.md`. El diseño sale de una skill de diseño y de `DESIGN.md`.
19. Se añaden pruebas (Vitest) para lo que sea comprobable en jsdom (nombres accesibles, ausencia del botón, mensajes vacío/error, `aria-labelledby`, zona de arrastre y alternativa por teclado, limpieza del filtro huérfano, estado de sesión sin chrome privado); `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check` pasan; si se toca `plugins/`, `npm run agentes:test`.

### De documentación

1. `docs/04-paginas.md` y `docs/05-componentes.md` reflejan: ausencia del botón "Filters" en datos, eliminación del filtro huérfano, cambios en `Sidebar`, botones de información, zona de arrastre, miniatura de Galería y estados vacío/error.
2. `docs/07-i18n-y-estilos.md` refleja las claves nuevas y los cambios de fuentes/iconos/márgenes; `docs/02-tecnologias.md` y `docs/guias/seguridad.md` (si aplican) reflejan cualquier cambio en la carga de fuentes.
3. `docs/integracion/` recoge, según el resultado de la investigación: diagnóstico y fix pendiente del 401/400 (criterio 2), petición de URL de imagen si falta (criterio 12) y cambios de CSP o carga de fuentes si los hay (criterio 9).
4. `docs/09-estado-actual-y-deuda-tecnica.md`: cifras al día y fecha de hoy en "Última actualización"; hallazgos no cerrados quedan como deuda.
5. `npm run docs:gate` en verde; si se toca un área de contrato (p. ej. `package.json`, `src/services/api.js`), aviso `docs/specs/*-aviso-pr.md` con `docs/integracion/` actualizado o `Integración: sin impacto — <motivo>`.

## Fuera de alcance

- Tabla de datos y filtros poblados.
- Añadir o borrar términos o imágenes.
- Subida real de archivos.
- Flujo de error del selector (más allá de distinguir vacío de fallo, hallazgo 3).
- Cambios en el backend o la infraestructura (solo se documentan como fix pendiente en `docs/integracion/`).
- Autoalojar fuentes o iconos, o sustituirlos por SVG.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: probable. Fix pendiente del 401 en `/api/v1/auth` si no es corregible en el frontend (criterio 2) y petición de URL de imagen para la miniatura si la respuesta actual no la trae (criterio 12) (por confirmar al investigar).
- `docs/integracion/para-infra.md`: posible. Fix pendiente del 400 de Cognito si su origen es de configuración (criterio 2); cambio de CSP si el subset/precarga de fuentes lo exigiera (criterio 9) (por confirmar).

## Preguntas abiertas

Ninguna.
