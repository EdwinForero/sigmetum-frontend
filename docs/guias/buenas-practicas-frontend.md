# Buenas prácticas del frontend

Normas de trabajo para escribir código en este repositorio. No son teoría general: cada regla sale del código actual o de un fallo que ya hemos corregido, e indica **cómo se comprueba**.

- Seguridad: [seguridad.md](seguridad.md). Accesibilidad: [accesibilidad.md](accesibilidad.md). Qué documentar después de cada cambio: [mantenimiento.md](mantenimiento.md).
- Si una regla choca con lo que te piden, **avisa y pregunta** antes de saltártela.
- Los hallazgos con id (A, M, B, D, I) están en [09](../09-estado-actual-y-deuda-tecnica.md).

## 1. Definición de terminado

Un cambio está terminado cuando pasan los cinco comandos y la documentación está al día:

| Comando | Comprueba |
|---|---|
| `npm test` | Tests (Vitest) |
| `npm run build` | Que compila para producción |
| `npm run lint` | ESLint: sin errores y sin superar el tope de avisos |
| `npm run quality` | Patrones prohibidos, secretos, `npm audit` de producción y ESLint |
| `npm run docs:check` | Que la documentación sigue al código |

## 2. Estructura y nombres

| Regla | Por qué | Se comprueba |
|---|---|---|
| Una página por ruta en `src/pages`; componentes reutilizables en `src/components`; un componente por archivo con exportación por defecto | Es la estructura actual y `docs:check` espera una sección por página y componente | `npm run docs:check` |
| Lógica sin interfaz (formato, ordenación, conversión) en `src/utilities` como **funciones puras** | Se prueban sin montar nada. Ejemplo: `highlightTerms` | Revisión y tests |
| Componentes en `PascalCase`; hooks como `useXxx`; utilidades en `camelCase` (`highlightTerms.js`). No imitar `CSVfunctions.js` ni `UseAtBottom.js`, que rompen la convención | Coherencia y búsqueda | Revisión |
| Código y commits en inglés; rutas y textos de usuario en español | Convención del proyecto | Revisión |
| El test va junto al archivo: `Componente.test.js` | Se encuentra y se mantiene | `docs:check` exige que figure en la tabla de cobertura |

## 3. Componentes y estado

| Regla | Por qué | Se comprueba |
|---|---|---|
| El estado vive lo más cerca posible de quien lo usa. Solo sube a `App` si varias páginas lo necesitan | `App` ya concentra demasiado estado y lo pasa por props | Revisión |
| Los campos de formulario son **siempre controlados** (`value` + `onChange`) | `TextInput` y `FilterSearchBar` recibían `term` y `searchText`, el campo no se vaciaba al guardar (A4) | Test del componente |
| No calcules en un efecto lo que puedes calcular al renderizar (`useMemo` si es caro) | Un efecto que copia datos a un estado provoca un render de más. Ejemplo a evitar: `uniqueSpecies` en `Explore` | Revisión |
| No compares objetos con `JSON.stringify` para decidir si actualizar | Es caro con muchas filas (M7) | Revisión |
| `key` estable (un id o el propio valor), no el índice | Con listas que cambian, el índice mezcla estados. `Explore` y `Table` lo usan hoy | Revisión |
| **No mutes** props ni estado: copia antes de ordenar o transformar (`[...items].sort(...)`) | `downloadXLSX` mutaba los datos de la pantalla y rompía los filtros (A2). `SortItemsList` ordena en el propio array | Test de no mutación |
| Reutiliza `ButtonPrincipal`, `ButtonAlternative`, `DialogAdvice` y `useDialog` | Aspecto y comportamiento coherentes | Revisión |
| Borra el código que no se usa; no lo dejes comentado | Hay componentes sin uso (`UploadButton`, `ImageCarrousel`) y bloques comentados en `Explore` | `git grep` y revisión |

## 4. Datos y llamadas HTTP

| Regla | Por qué | Se comprueba |
|---|---|---|
| Toda llamada a la API pasa por `src/services/api.js`. Nada de `fetch` directo | `FileUpload` duplica cabeceras y la gestión del envoltorio (M2) | Revisión |
| Un endpoint nuevo añade su método en `api.js` si hace falta, y se documenta en [03](../03-api.md) y en [integracion/para-backend.md](../integracion/para-backend.md) | El backend necesita saber qué campos lee el frontend | `docs:check` (endpoints en 03) |
| Muestra mensajes **propios y traducidos**, no el texto `error` del servidor | El texto del servidor está en inglés y puede revelar detalles internos | Revisión |
| Las respuestas de la API no se guardan en `localStorage` ni `sessionStorage` | Es almacenamiento accesible por cualquier script de la página | `npm run quality` |
| En un efecto nuevo que pide datos, cancela o ignora la respuesta si el componente se desmonta (`AbortController` o una bandera) | Evita actualizar estado de un componente que ya no existe | Revisión |
| Cada pantalla con datos cubre **cargando, error, vacío y éxito** | `Explore` y `VegetationGallery` ya lo hacen | Test de cada estado |

## 5. Efectos y limpieza

- Quita siempre lo que registres (`addEventListener`, temporizadores): los efectos actuales ya lo hacen.
- Declara todas las dependencias del efecto. `react-hooks/exhaustive-deps` avisa; no lo silencies sin un comentario que explique el motivo.
- Los hooks solo se llaman al nivel superior del componente (`react-hooks/rules-of-hooks` es un **error**).
- No hagas peticiones ni cambies estado durante el render: hazlo en efectos o en manejadores.

## 6. Expresiones regulares y entradas del administrador

Todo texto que venga de una persona o de la API y vaya a una expresión regular se **escapa** antes. Un término como `(` tumbó la aplicación entera (A3). Usa `highlightTerms` como ejemplo y añade un test con caracteres especiales.

## 7. Internacionalización

| Regla | Se comprueba |
|---|---|
| Todo texto visible usa `t('clave')` | Revisión |
| Cada clave nueva existe en `es` y en `en`, con los mismos marcadores `{{x}}` y sin traducciones vacías | `npm test` (`translations.test.js`) |
| No concatenes frases traducidas: el orden cambia según el idioma. Usa marcadores de interpolación | Revisión |
| Texto con enlaces o negritas: `<Trans>` con `components` | Revisión |
| Los nombres de columna de los datos se traducen con `attributes.<columna>` | Revisión |

## 8. Estilos

| Regla | Por qué |
|---|---|
| Tailwind con clases utilitarias y **primero móvil** (`sm:`, `md:`, `lg:` para ampliar) | Es la base actual |
| No añadas colores hexadecimales nuevos: reutiliza los existentes (`#15B659`, `#F9FBFA`, `#0C1811`, `#99BBA8`, `#14281D`, `#4B644A`). Cuando se definan en `tailwind.config.js` (B13), usa esos nombres | La paleta está repetida en cientos de clases |
| Sin anchos ni márgenes fijos en píxeles que rompan en 320 px (`px-40` en `FilesUpload`) | Adaptabilidad y zoom: ver [accesibilidad.md](accesibilidad.md) |
| Antes de elegir un color, comprueba el contraste | La paleta actual incumple WCAG AA: ver [accesibilidad.md](accesibilidad.md) |

## 9. Animación

- Importa desde `motion/react`, no desde `framer-motion`.
- Envuelve en `<AnimatePresence>` lo que se desmonta con animación.
- Anima `transform` y `opacity`; evita animar dimensiones.
- Una animación nueva **respeta `prefers-reduced-motion`** (`useReducedMotion` o `<MotionConfig reducedMotion="user">`). Hoy no se respeta en ningún sitio (B19).
- Nada de animaciones infinitas salvo indicadores de carga.

## 10. Rendimiento

| Regla | Estado |
|---|---|
| Carga las rutas bajo demanda (`React.lazy` y `Suspense`) y `xlsx` con `import()` al descargar | Hoy todo va en un solo paquete que supera el aviso de Vite (M16) |
| Las listas largas se paginan | `Explore` y `Table` ya lo hacen |
| Las imágenes llevan `width`/`height` (o proporción) para no mover la página, y `loading="lazy"` si están fuera de pantalla | Revisión |
| No hagas en el render cálculos pesados sobre todos los registros: memoriza o mueve la lógica a una utilidad | `Filter` recalcula las facetas en un efecto |

## 11. Pruebas (TDD)

1. **Primero el test**: escribe uno que falle **por el motivo correcto** (no por un error de sintaxis ni de importación) y compruébalo.
2. **Después el cambio mínimo** que lo hace pasar.
3. **Por último**, toda la suite.

| Regla | Por qué |
|---|---|
| Un fallo corregido lleva un test que fallaba antes del arreglo | Es la prueba de que el arreglo sirve. Ejemplos: A1 a A4 |
| Prueba comportamiento, no implementación: busca por texto o rol y usa `userEvent` | Sobrevive a refactors |
| La red se simula con `vi.stubGlobal('fetch', ...)` y `vi.unstubAllGlobals()` | Los tests no dependen de la red |
| `react-i18next` está simulado en `setupTests.js`: `t('clave')` devuelve la clave | No dependen del idioma |
| No simules código propio si puedes usar el real | Un mock que repite la implementación no prueba nada |
| Cuando el test pasa a la primera, sospecha: puede probar lo que ya funcionaba | El test de `highlightTerms` para el punto literal pasaba por el motivo equivocado |
| Cobertura mínima: utilidades, lógica de filtros y flujos críticos (login y subida de datos) | Es donde están los fallos más caros |

## 12. Dependencias

| Regla | Por qué |
|---|---|
| No añadas una librería para algo que se resuelve en unas pocas líneas | Cada dependencia añade superficie de ataque y peso |
| Antes de añadir una: mantenimiento, licencia, tamaño, y que funcione con **Node 20** | `jsdom` 27 y posteriores exigen Node 22 y habrían roto los tests en Amplify |
| `npm install` actualiza `package-lock.json`: se confirma siempre. En integración continua, `npm ci` | Instalaciones reproducibles |
| Nunca `npm audit fix --force` | Puede subir versiones mayores sin avisar |
| Toda dependencia nueva se documenta en [02](../02-tecnologias.md) | `docs:check` lo exige |

## 13. Git y commits

- Mensajes en inglés, en imperativo, que expliquen el **porqué** (`Fix upload hanging when cancelling a draft...`).
- Un fallo o una funcionalidad por commit, con su test y su documentación.
- No mezcles un refactor con una corrección.
- Nunca se versionan `.env` ni secretos: `npm run quality` lo comprueba.
- No se hace push ni se fusiona sin revisión.

## 14. ESLint y el tope de avisos

`npm run lint` falla si hay **errores** o si los **avisos superan el tope** de `--max-warnings` en `package.json`.

- Los avisos (accesibilidad, variables sin usar, `console.log`) son deuda visible: no bloquean, pero **no pueden crecer**.
- **Cuando corrijas avisos, baja el tope** al nuevo número. `npm run quality` falla si el tope es mayor que los avisos reales, para que la mejora no se pierda.
- No uses `// eslint-disable` sin un comentario que explique el motivo.
- Una regla de ESLint nueva o relajada se anota en [02](../02-tecnologias.md) y en este documento.

## 15. Anti-patrones que ya están en el código

No los repitas al escribir código nuevo:

| Patrón | Dónde | Hallazgo |
|---|---|---|
| Comparar con `JSON.stringify` | `App.js` | M7 |
| Índice como `key` | `Explore`, `Table` | |
| `fetch` directo y token leído en el componente | `FileUpload` | M2 |
| Regex construida con texto sin escapar | Corregido en `highlightTerms` | A3 |
| Campo no controlado | Corregido en `TextInput` | A4 |
| `console.log` con datos | `Filter.js` | M9 |
| Código muerto y bloques comentados | `UploadButton`, `ImageCarrousel`, `Explore` | M8 |
| `import { React, useState } from 'react'` (`React` no es una exportación con nombre) | Varias páginas | B6 |
| Nombre de archivo que no sigue la convención | `CSVfunctions.js`, `UseAtBottom.js` | |

## 16. Mantener esta guía

Se actualiza cuando aparece un patrón nuevo que conviene prohibir o fomentar, sobre todo si sale de un fallo: anota la regla, el motivo, cómo se comprueba y, si se puede, añade la comprobación automática a ESLint o a `scripts/quality-check.mjs`.
