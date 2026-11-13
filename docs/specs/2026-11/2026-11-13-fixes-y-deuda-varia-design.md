# Fixes y deuda variada (ciclo 4): spec

Fecha: 2026-11-13 · Estado: cerrado

## Objetivo

Cerrar 10 puntos de comportamiento y deuda técnica anotados en `docs/09` (frontend) y `docs/07` (backend) tras el ciclo anterior, confirmados por el usuario:

- Frontend (7): B73, B77, B80, B48, B54, B76, B78.
- Backend (3): M30, M31, M32.

Quedan fuera B46 y B71 (siguen como deuda).

Contraste con el código actual (13/11/2026):

- B73: `CookieBanner.js` línea 110 usa `<a href="/cookies">` con `min-h-6 min-w-6`; recarga la página entera.
- B77: `App.js` líneas 43-45 y 92-94 comparan `path` con `'/explore'`, `'/manage-data'` y `PRIVATE_PATHS.includes(path)` distinguiendo mayúsculas; solo se quitan barras finales.
- B48: `Explore.js` líneas 205 y 217 usan `InfoButton` sin `topic`, así que ambos tienen el nombre accesible `iconButton.info`. `InfoButton` ya admite `topic` (`iconButton.infoAbout`) y `DataManagement` ya lo usa.
- B54: `BOTTOM_BAR_HEIGHT = 72` en `Sidebar.js` duplica `spacing.nav` de `tailwind.config.js` (no releído aquí; se toma de la fila de B54).
- B76: `docs/09` lo describe así: el diálogo de `DialogSpecies` se ve recortado o translúcido si se abre una tarjeta durante la transición de `Reveal` (hasta unos 630 ms). Afecta a `Reveal.js`, `SpeciesCard.js` y `DialogSpecies.js`.
- B78: `Sidebar.js` línea 9 usa `text-[11px]` bajo 360 px y `min-[360px]:text-xs` desde 360 px; `DESIGN.md` (línea 165) y `docs/guias/accesibilidad.md` (línea 136) mantienen la regla de 12 px.
- M30: `sanitizeRecipients` (`functions/contactRecipients.js`, línea 12) solo filtra entradas sin `email` de tipo cadena; una dirección no válida cuenta para el mínimo (1) y el máximo (5). Se usa vía `readRecipients` en `routes/content.js`.
- M31: `HEADER_FORBIDDEN = /[\p{Cc}  ]/u`; no cubre `\p{Cf}` (U+200B, U+202E).
- M32: `recipientsForContact` (línea 67) filtra por validez pero no deduplica.

## Criterios de aceptación

### De código

Frontend. Cada punto de código con test que falla antes del cambio por el motivo correcto (TDD).

1. **B73 (comportamiento).** Pulsar «aquí/here» en el banner de cookies navega a `/cookies` sin recarga completa. Test: el enlace sigue en el DOM y la navegación ocurre dentro del router (sin `window.location` ni recarga). Medición del orquestador con Playwright: al pulsarlo, el estado de la SPA (p. ej. una marca en `window`) se conserva. El enlace mantiene un objetivo táctil de al menos 24×24 px, el foco visible y el subrayado. Se conservan el texto traducido en `es` y `en` y el nombre accesible actual.
2. **B77 (comportamiento).** `/EXPLORE` y `/Explore` pintan lo mismo que `/explore` (datos y barra de gestión); `/MANAGE-DATA` se trata como ruta privada igual que `/manage-data` (con sesión: barra; sin sesión: el mismo comportamiento que la ruta en minúsculas). Test de `App` para ambos casos. Una ruta inexistente sigue mostrando NotFound. Medición de Playwright: `/EXPLORE` muestra tarjetas y barra a 1280 px y a 390 px.
3. **B48 (accesibilidad).** Los dos botones «i» de `/explore` tienen nombres accesibles distintos entre sí, y cada uno nombra qué ayuda explica (glosario y Excel), en `es` y `en`. Test: `getByRole('button', { name })` distingue ambos. Las claves nuevas existen en `es` y `en`. Los botones mantienen el objetivo táctil actual y el comportamiento del tooltip (`InfoButton.test.js` sigue en verde).
4. **B80 (accesibilidad).** En el formulario de destinatarios, un lector de pantalla anuncia el error de validación cada vez que Enter falla, incluso con el mismo error repetido, sin doble anuncio (el mismo fallo no se anuncia dos veces) y sin romper el comportamiento de B66 y B67. El mecanismo lo elige el architect; la spec exige solo este comportamiento. Test: tras dos Enter consecutivos con el mismo error, el mensaje se renueva y no queda duplicado en la región anunciada. La verificación con lector de pantalla real queda **(por confirmar)** y se anota en `docs/09` si no se hace.
5. **B54 (deuda).** La altura de la barra inferior de gestión tiene una única fuente de verdad (el token `spacing.nav`). Sin cambio visual: medición de Playwright a 320, 390 y 768 px de la altura de la barra y de los márgenes que dependen de ella, idéntica antes y después.
6. **B76 (comportamiento).** El diálogo de `DialogSpecies` se ve siempre completo y opaco, aunque se abra una tarjeta durante la transición de `Reveal`. Test: abrir el diálogo durante la transición no lo deja bajo un efecto de la animación (el diálogo no hereda opacidad ni transformación de la tarjeta animada). Medición de Playwright: abrir una tarjeta justo tras cargar `/explore` (en menos de 630 ms) a 390 y 1280 px; el diálogo tiene opacidad 1 y no queda recortado. Sin cambio en la animación de `Reveal` para el resto del uso (respeta `prefers-reduced-motion`).
7. **B78 (decisión documentada, sin cambio de código).** Se acepta la excepción de 11 px bajo 360 px en las etiquetas de la barra de gestión. Criterio: `Sidebar.js` no cambia, y la medición de Playwright del orquestador a 320, 340 y 359 px (`es` y `en`) no muestra desbordes en ninguno de los seis ítems.

Backend (commit propio en `sigmetum-backend`, rama `feature/sigmetum_v2`).

8. **M30.** El backend deja de contar las entradas no válidas del fichero de destinatarios para el mínimo y el máximo: se sanean al leer, de modo que solo las direcciones válidas cuentan. Test: con un fichero que mezcla válidas y no válidas, el mínimo y el máximo se calculan solo sobre las válidas (p. ej. una lista con 5 válidas y una no válida admite 0 altas más, una con 1 válida y 2 no válidas no deja borrar la válida). El comportamiento con un fichero que solo tiene entradas no válidas lo propone el architect, con la condición de que haya siempre al menos un destinatario o el respaldo (`EMAIL`); la spec no lo fija. Se decide también (architect) si el fichero se reescribe sin las no válidas al siguiente alta o baja; en cualquier caso no se pierden las válidas.
9. **M31.** `isValidEmailAddress` rechaza direcciones con caracteres Unicode de formato (`\p{Cf}`: al menos U+200B y U+202E), tanto en `/send-email` como en el alta de destinatarios, con respuesta `400`. Tests para U+200B y U+202E, para una dirección válida con letras Unicode normales (sin regresión) y para el texto de `maskEmail` y del aviso, que no reproduce esos caracteres.
10. **M32.** `recipientsForContact` no devuelve la misma dirección dos veces (sin distinguir mayúsculas ni espacios, conservando el orden y el primer formato original). Test con duplicados exactos y con distinta capitalización. El respaldo (`EMAIL`) se mantiene si no queda ninguna válida.

Global.

11. Pasan, en el frontend: `npm test` (en local, `npx vitest run --maxWorkers=2`), `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate`. En el backend: `node --test --test-concurrency=2 "tests/**/*.test.js"` y también con `npx -y node@22`. El tope de avisos de ESLint se baja si el cambio corrige avisos.
12. Mediciones de Playwright del orquestador (a 320, 390 y 1280 px) sin regresión en los contrastes, el foco ni el CLS respecto del ciclo anterior (`/gallery` a 390 px sigue en 0,029 o mejor; no se promete corregir B72).

### De documentación

Frontend (`docs/`):

1. `docs/09-estado-actual-y-deuda-tecnica.md`: «Última actualización» con la fecha de hoy (13/11/2026); B73, B77, B48, B54, B76, B78 y B80 pasan a resueltos con el motivo y el cambio observable (B78 como decisión aceptada, con la medición a 320, 340 y 359 px); B80, si no hay lector de pantalla, marcado **(por confirmar)**. B75 se actualiza: M30 a M32 resueltos, queda solo la medición con sesión real del `.xlsx` **(por confirmar)**. B46 y B71 siguen abiertos. Las cifras (tests, claves) solo en este documento.
2. `DESIGN.md` y `docs/guias/accesibilidad.md`: se documenta la excepción de 11 px bajo 360 px en la barra de gestión como decisión (con la medición sin desbordes a 320, 340 y 359 px en `es` y `en`), de forma coherente entre ambos y sin contradecir la regla de 12 px fuera de esa excepción. Estos dos archivos deben quedar de acuerdo entre sí.
3. `docs/04-paginas.md` y `docs/01-arquitectura.md` (por tocar `App.js`): la normalización de mayúsculas de las rutas.
4. `docs/05-componentes.md` (por tocar `CookieBanner`, `InfoButton` o su uso, `Sidebar`, `ContactRecipientsManager`, `Reveal` o `DialogSpecies`): comportamiento actualizado de cada uno.
5. `docs/07-i18n-y-estilos.md` si se añaden claves de i18n (B48) o se toca `tailwind.config.js` (B54).
6. `docs/08-guia-desarrollo.md` si se añaden o cambian tests.
7. `docs/integracion/para-backend.md` y `docs/integracion/para-frontend.md`: se revisan por M31 (formato de dirección admitido) y se actualizan si describen ese formato; si no cambian, aviso `docs/specs/*-aviso-pr.md` con `Integración: sin impacto — <motivo>` cuando se toque un área de `areasContrato`.

Backend (`docs/`):

8. `docs/07-estado-y-deuda-tecnica.md`: la fecha de análisis/actualización con la fecha de hoy; M30, M31 y M32 pasan a resueltos con el hash del commit.
9. `docs/05-modulos.md`: `sanitizeRecipients` (ahora filtra por validez) y `recipientsForContact` (ahora deduplica).
10. La guía de seguridad y el documento de endpoints del backend reflejan que `/send-email` y `/add-recipient` rechazan `\p{Cf}`, y el comportamiento de M30 con el mínimo y el máximo.

## Fuera de alcance

- B71 (sigue como deuda) y B46 (lint `label-has-for` en `DataManagement.js`; sigue como deuda).
- B79, B72, B81, B63, B74 (B79 es teórico; B72 necesita investigación; B81 es no reproducido; B74 es regla de infra).
- Cualquier cambio en `sigmetum-infra` (solo lectura).
- Cambios en los endpoints, en el formato de las respuestas o en el modelo de autorización (M28/C16, M29).
- Cambio de código en `Sidebar.js` por B78 (solo documentación).

## Impacto en contratos externos

- `docs/integracion/para-backend.md` y `docs/integracion/para-frontend.md` (frontend): el frontend no cambia sus llamadas. El backend endurece el formato admitido (M31): una dirección con caracteres `\p{Cf}` antes aceptada ahora da `400` con el mismo mensaje fijo. M30 cambia qué entradas del fichero cuentan para el mínimo y el máximo, por lo que `/add-recipient` y `/remove-recipient` pueden responder distinto con ficheros que contengan entradas no válidas. Hay que revisar si esos documentos describen el formato admitido o los límites y actualizarlos si es así. M32 no cambia el contrato.
- `docs/integracion/para-infra.md`: no lo afecta.

## Preguntas abiertas

Ninguna. Queda delegado al architect, con el comportamiento ya exigido en los criterios: el mecanismo del reanuncio de B80 (criterio 4) y el comportamiento de M30 con un fichero que solo tenga entradas no válidas (criterio 8).

---

## Decisiones de la puerta 2 (13/11/2026): mandan sobre el texto anterior

- La regla `\p{Cf}` también en el cliente: panel (`validateRecipientEmail.js`) y formulario público (`validateContact.js`), con error de formato en el campo.
- `maskEmail` sustituye cada `\p{Cf}` por `?` (no lo borra).
- `sanitizeRecipients` deduplica también al leer (primera aparición por `normalizeEmail`), además de `recipientsForContact`.
- B76: sin `text-center` (la hoja `App.css` no se importa); la medición compara el `text-align` con la línea base.
- B77: ayudante `normalizePath` compartido por `App` y `Sidebar`; no redirige.
- B73: `--max-warnings` baja a 16 (dos avisos de ESLint).
