# Login accesible: plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-loginform-error-accesible-design.md`

## Notas de la segunda opinión (aprobadas, obligatorias)

1. La `ñ` del test del JSON va en UTF-8 precomposida (no NFD); no pegarla desde una fuente con NFD.
2. `docs:check` exige que `es-typos.test.js` aparezca en `docs/08`, y rechaza cifras repetidas ("N tests") fuera de `docs/09`: no escribir recuentos en `docs/05`, `docs/08` ni `accesibilidad.md`. La fila de `docs/08` que agrupa `LoginForm.test.js` y `ContactForm.test.js` es donde añadir el anuncio como alerta.
3. Fines de línea: el árbol está en LF (`.gitattributes` `eol=lf`, 0 `\r` en los archivos a tocar). Edita en sitio; si creas el archivo nuevo, comprueba que no lleva `\r`.
4. Límite conocido (aviso de PR y `docs/09`): un segundo login fallido con el mismo error no se vuelve a anunciar (misma clave, sin re-render); cambiar de 401 a 429 sí. Es aceptado por el criterio 3 de la spec (no hay `role="alert"` permanente).
5. `LoginForm.js` está en `areasContrato`: sin el aviso de PR, `docs:gate` falla.

Crítico: sí (sesión y token: toca `LoginForm`; accesibilidad). No cambia `handleLogin` ni el token.

## Supuestos y decisiones

- Fines de línea: no se ha podido confirmar si el árbol de trabajo está en LF o CRLF **(por confirmar)**. Regla para el developer: edita en sitio, sin reescribir archivos enteros, y conserva el fin de línea de cada archivo; en el archivo nuevo, el mismo que el resto de `src/languages/*.test.js`.
- `role="alert"` va en el `<span>` actual, dentro del `{loginErrorKey && ...}` existente: el rol solo existe cuando hay error (criterio 3) y el cambio es de un atributo. Se descarta un contenedor `role="alert"` siempre presente (lo prohíbe el criterio 3) y moverlo al `div`. Es una propuesta, no una norma de las guías.
- Test del JSON: `src/languages/translations.test.js` ya importa `./es/translation.json` sin mock y `vite.config.js` incluye `src/**/*.test.js`. Archivo propio nuevo: `src/languages/es-typos.test.js`. `docsPorArea` ya mapea `src/languages/*.test.js` a `docs/08`.

## Fase 1

1. **Test rojo de LoginForm (anuncio del error)**
   - Archivo: `src/components/LoginForm.test.js` (solo añadir tests; no tocar los tres existentes).
   - Añadir en el `describe` existente un test de 401 y uno de 429. Antes de pulsar, `screen.queryByRole('alert')` es `null`. Tras `click` y `await screen.findByRole('alert')`, el alert tiene el texto `login.unauthorizedLabel` (401) o `login.tooManyAttemptsLabel` (429). Mismo `renderLogin`, `httpError` y `api.post.mockRejectedValue`.
   - Comprobación: `npx vitest run src/components/LoginForm.test.js`. Fallan solo los 2 nuevos (`findByRole('alert')` no encuentra nada); los 3 existentes siguen en verde.
   - Norma: `docs/guias/accesibilidad.md` formularios (línea 55); criterios de código 2, 3 y 6; CLAUDE.md (TDD).

2. **Verde: `role="alert"` en el error de LoginForm**
   - Archivo: `src/components/LoginForm.js` (línea ~66): `<span className="text-[#15B659] px-2">` pasa a `<span role="alert" className="text-[#15B659] px-2">`. Sin cambios en `handleLogin`, el estado, el token ni `navigate`; sin `aria-describedby`, `htmlFor` ni cambios de `<form>` (B3 y B4 fuera de alcance).
   - Comprobación: todos los tests de `LoginForm.test.js` en verde.
   - Norma: `docs/guias/accesibilidad.md`; `docs/guias/seguridad.md` y la regla de CLAUDE.md sobre el token.

3. **Test rojo y verde del typo en `es`**
   - Archivos: crear `src/languages/es-typos.test.js` (importa `es from './es/translation.json'`; un test: `es.login.unauthorizedLabel` es exactamente `'Verifica el usuario y/o contraseña'` con `toBe` y no contiene `contraeña` con `not.toContain`). Modificar `src/languages/es/translation.json` línea ~124: `contraeña` pasa a `contraseña`; solo ese valor.
   - Comprobación: crear el test y ver `npx vitest run src/languages/es-typos.test.js` fallar por el typo; corregir el JSON y repetirlo en verde; luego `npx vitest run src/languages` (`translations.test.js` sigue en verde).
   - Norma: criterios de código 4 y 5; `docs/07-i18n-y-estilos.md`.

## A cargo del tester-documentador

- `docs/09-estado-actual-y-deuda-tecnica.md`: "Última actualización" 30/10/2026; cifras de tests y archivos de test al día. Sin deuda nueva (B3 y B4 siguen abiertos).
- `docs/05-componentes.md` (`LoginForm`): el error se anuncia como alerta.
- `docs/guias/accesibilidad.md` línea ~56: el anuncio del error del login pasa a cumplirse; siguen pendientes B3 y `aria-describedby`. No cambiar el estado de `ContactForm` ni de otros campos.
- `docs/08-guia-desarrollo.md`: `LoginForm.test.js` cubre también el anuncio del error; mencionar `src/languages/es-typos.test.js`.
- `docs/07-i18n-y-estilos.md`: solo si hace falta (no hay claves nuevas).
- Crear `docs/specs/2026-10-30-loginform-error-accesible-aviso-pr.md` con la línea `Integración: sin impacto — solo accesibilidad y un texto del login; el contrato con el backend (POST /log, 429) y la infraestructura no cambian.` No tocar `docs/integracion/`.
- Cierre: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check`, `npm run docs:gate`; mensaje de commit; si bajan los avisos de ESLint, ajustar `--max-warnings`; comprobar que el diff no reescribe líneas por fin de línea.

## Pruebas

- Nuevas: dos en `src/components/LoginForm.test.js` (401 y 429 con `role="alert"`) y una en `src/languages/es-typos.test.js`.
- Ciclo rojo/verde con `npx vitest run <archivo>`; al final `npm test`.
