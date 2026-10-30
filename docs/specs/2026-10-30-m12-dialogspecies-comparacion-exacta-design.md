# M12, DialogSpecies: comparación exacta de la especie: spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

Al abrir el detalle de una especie, `DialogSpecies` agrega los atributos de las filas que contienen esa especie. Hoy, si el campo `Especies Características` de una fila es una cadena, la comparación busca subcadenas y mezcla filas de otras especies cuyo nombre contiene el buscado (abrir "Quercus ilex" arrastra filas de otra especie cuyo texto lo contiene). Con arrays la comparación ya es exacta. La comparación debe ser exacta con cadena y con array (el backend entrega array solo si la celda tiene comas, ver `docs/integracion/para-backend.md`, sección 3).

## Comportamiento actual (verificado en el código)

- `DialogSpecies.js:23-26` filtra `data` con `item["Especies Características"]?.includes(species["Especies Características"])`.
- No existe test de `DialogSpecies` (hay tests de TextInput, FilterSearchBar, ContactForm, FileUpload, ImageGalleryManager, ImageComponent, ImageCarrousel, Table y LoginForm).
- El nombre de la especie que recibe el diálogo es una cadena (sale de `Explore.js` tras aplanar el campo).
- Revisión de los demás usos del campo (solo informativa, sin cambios):
  - `Explore.js:34-36, 43-45`: aplana cadenas y arrays y compara con `Set.has`: exacta.
  - `Filter.js:82-85, 103-105`: `itemValue.some(value => selectedItems.has(value))` o `selectedItems.has(itemValue)`: exacta, sensible a mayúsculas.
  - `SpeciesCard.js:15`: solo pinta el nombre, no compara.
  - Conclusión: ninguno tiene el mismo problema; el único punto con subcadenas es `DialogSpecies.js:25`.

## Criterios de aceptación

### De código

1. Existe un test de `DialogSpecies` que, con el cambio revertido, falla porque el diálogo incluye atributos de una fila cuyo valor es una cadena que solo contiene el nombre como subcadena (por ejemplo "Quercus ilex subsp. ballota" al abrir "Quercus ilex"), y no por un error de montaje o de importación.
2. Casos que el test fija (el valor de la fila es el de `Especies Características`):
   - Cadena idéntica a la especie: la fila cuenta.
   - Cadena que contiene la especie como subcadena de otro nombre: la fila NO cuenta.
   - Array que contiene la especie: la fila cuenta.
   - Array que solo contiene un nombre más largo que la especie: la fila NO cuenta.
   - Valor ausente (`undefined`), `null` o cadena vacía: la fila NO cuenta y no lanza error.
   - Comparación sensible a mayúsculas y espacios, igual que `Filter` y `Explore` (no se normaliza; decidido por el usuario).
3. Una fila con array que contiene la especie junto con otras sigue contando para los atributos de esa especie (comportamiento actual con arrays, sin cambio).
4. El filtrado no muta `data`, `species` ni ningún estado ni prop (sin `sort()` ni asignaciones sobre ellos).
5. El resto del diálogo no cambia: título con cursivas, atributos únicos ordenados, enlace a IPNI con `rel="noopener noreferrer"`.
6. Pasan `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check`; `npm run docs:gate` en verde antes del commit.

### De documentación

1. `docs/09-estado-actual-y-deuda-tecnica.md`: M12 sale de "Prioridad media (pendiente)" y pasa a "Resueltos" con su corrección y el hash del commit (el hash solo se conoce tras el commit: **(por confirmar)** hasta entonces); la línea de la hoja de ruta 3 deja de mencionar M12; se revisa la mención de M12 de la línea 46 (tabla de cifras o estado); "Última actualización" con la fecha de cierre; cifras (archivos de test, tests) recalculadas con `npm run docs:check -- --metrics` y `npm test`.
2. `docs/05-componentes.md`, tabla de `DialogSpecies`: `filteredSpecies` describe "registros cuyo `Especies Características` coincide exactamente con esta especie (cadena o elemento del array)" en lugar de "incluye".
3. `docs/08-guia-desarrollo.md`: el test nuevo figura en la tabla de cobertura.
4. `docs/guias/mantenimiento.md` (lista "Corrección de un fallo"): el test falla antes del arreglo y pasa después; se cumple como criterio 1 de código.
5. `docs/integracion/para-backend.md` no necesita cambios (el contrato no cambia; la sección 3 ya dice que el campo puede ser cadena o array).

## Fuera de alcance

- M2 y M18 (`FileUpload` a `api.js`), infraestructura y D1.
- Cualquier otra comparación del campo (`Explore`, `Filter`, `SpeciesCard`): ya son exactas o no comparan.
- Normalizar mayúsculas, espacios o acentos de los nombres.
- B2 (`role="dialog"`, foco, Escape) y otros hallazgos del diálogo.
- Cambiar el formato que entrega el backend.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta. El cambio solo lee el campo tal como ya se documenta (cadena o array).
- `docs/integracion/para-infra.md`: no lo afecta.
- Aviso de PR: `src/components/DialogSpecies.js` no está en `areasContrato` de `.claude/flujo.json` y ningún otro archivo de contrato se toca, así que `docs:gate` no exige `docs/specs/*-aviso-pr.md`. (Si se toca algún archivo de `areasContrato`, la exigencia cambia.)

## Preguntas abiertas

Ninguna. Resuelta por el usuario: la comparación es exacta sin normalizar (sensible a mayúsculas y espacios, igual que `Filter` y `Explore`).
