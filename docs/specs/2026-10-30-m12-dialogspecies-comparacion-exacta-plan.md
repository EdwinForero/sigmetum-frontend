# M12 DialogSpecies, comparación exacta: plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-m12-dialogspecies-comparacion-exacta-design.md`

Crítico: no. Es una comparación interna de un componente de presentación y no coincide con ninguna entrada de `criticidad` (sesión y token, contrato con el backend, dependencias, CI, accesibilidad, variables de entorno).

## Decisiones

- **Dónde vive el helper:** función local, no exportada, a nivel de módulo en `src/components/DialogSpecies.js`. Se descarta un archivo nuevo en `src/utilities/`: solo hay un consumidor (`Explore` y `Filter` tienen su propia lógica con `Set`) y añadiría una entrada a `docs/06` sin motivo.
- **Forma del helper:** `const contieneEspecie = (valor, nombre) => Array.isArray(valor) ? valor.includes(nombre) : valor === nombre;`. `undefined`, `null` y `""` dan `false` sin lanzar error. No muta nada. El `?.` ya no hace falta. Comparación literal, sin normalizar (decidido por el usuario).
- **Cómo se renderiza en el test:** `DialogSpecies` directamente, sin `SpeciesCard` ni `Explore`. No se mockea `motion/react` (otros tests renderizan `motion` en jsdom sin mock; si el montaje fallara, es un error de montaje y no el fallo del criterio 1: el developer lo comunica y no improvisa). `i18n` ya está mockeado en `src/setupTests.js` (`t` devuelve la clave). `highlightTerms` no se mockea. Props: `isOpen`, `onClose={vi.fn()}`, `data`, `species={{ "Especies Características": "Quercus ilex" }}`, `noItalicTerms={[]}`.
- **Qué se comprueba:** el texto de los atributos pintados por `SpeciesAttribute` (`getByText`/`queryByText` sobre valores de `Provincia`). Cada fila de prueba lleva una `Provincia` distinta y reconocible.
- **Riesgo conocido (no tocar):** `SortItemsList` lanza error si hay dos o más valores y alguno es `undefined` (`a.localeCompare`). En los datos del test, las filas que cuentan traen todos los atributos como cadenas; las que no cuentan pueden ir incompletas. No se modifica `SortItemsList` (fuera de alcance).
- **Normas:** `docs/guias/buenas-practicas-frontend.md` (no mutar props ni estado: `filter` crea un array nuevo y el helper solo lee); `docs/guias/seguridad.md` (sin HTML dinámico ni enlaces nuevos; el enlace a IPNI no cambia).

## Fase 1

1. **Test que falla por el motivo correcto (TDD)**
   - Archivo: `src/components/DialogSpecies.test.js` (crear). Imports: `describe, it, expect, vi` de `vitest`; `render, screen` de `@testing-library/react`; `DialogSpecies` de `./DialogSpecies`. Estilo de `Table.test.js`.
   - Casos (cada uno con `Provincia` distinta en la fila):
     - cadena idéntica a la especie: la fila cuenta;
     - cadena `"Quercus ilex subsp. ballota"` al abrir `"Quercus ilex"`: NO cuenta (este es el que falla hoy);
     - array que contiene la especie junto con otras: cuenta;
     - array que solo contiene un nombre más largo: NO cuenta;
     - `undefined`, `null` y `""`: NO cuentan y no lanzan error;
     - mayúsculas y espacios distintos (`"quercus ilex"`, `"Quercus ilex "`): NO cuentan;
     - no muta: `data` y `species` iguales a una copia `JSON.parse(JSON.stringify(...))` tras renderizar;
     - el resto no cambia: el enlace a IPNI tiene `rel="noopener noreferrer"` y la clave `explore.dialogSpecies.closeButton` está presente.
   - Comprobación: `npx vitest run src/components/DialogSpecies.test.js` **antes** del paso 2. Debe fallar solo por el caso de la subcadena (la `Provincia` de la fila ajena aparece en pantalla) y no por importación o montaje. El developer deja constancia del mensaje de fallo.
   - Norma: `docs/guias/mantenimiento.md`, "Corrección de un fallo".

2. **Comparación exacta en `DialogSpecies`**
   - Archivo: `src/components/DialogSpecies.js` (modificar).
   - Se añade el helper `contieneEspecie(valor, nombre)` a nivel de módulo, y `filteredSpecies` (líneas ~23-26) pasa a `data.filter((item) => contieneEspecie(item["Especies Características"], species["Especies Características"]))`. No cambia nada más.
   - Comprobación: el archivo de test en verde; después `npm test`, `npm run build`, `npm run lint` (sin subir de avisos) y `npm run quality`.
   - Norma: `docs/guias/buenas-practicas-frontend.md` y `docs/guias/seguridad.md`.

## A cargo del tester-documentador

- `docs/09-estado-actual-y-deuda-tecnica.md`: M12 pasa de "Prioridad media (pendiente)" a "Resueltos" con su corrección (hash **(por confirmar)** hasta el commit); quitar M12 de la hoja de ruta (punto 3); revisar la mención de la línea ~46; "Última actualización" con la fecha de cierre; cifras (archivos de test, tests) recalculadas con `npm run docs:check -- --metrics` y `npm test`.
- `docs/05-componentes.md`, tabla de `DialogSpecies`: `filteredSpecies` describe registros cuyo `Especies Características` coincide exactamente con esta especie (cadena o elemento del array).
- `docs/08-guia-desarrollo.md`: añadir `DialogSpecies.test.js` a la tabla de cobertura.
- `docs/integracion/para-backend.md`: sin cambios. Sin aviso de PR (`DialogSpecies.js` no está en `areasContrato`).
- No escribir recuentos tipo "N tests" ni "N casos" fuera de `docs/09` (`docs:check` los rechaza).
- Ejecutar `npm run docs:check` y `npm run docs:gate`, y proponer el mensaje de commit.

## Pruebas

- Nueva: `src/components/DialogSpecies.test.js`. Comando: `npx vitest run src/components/DialogSpecies.test.js` y luego `npm test`.
- Batería final: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate`.
