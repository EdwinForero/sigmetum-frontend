# Alineación con Node 22 (infra:C10), matriz Node 22 y 24: plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-node-22-alineacion-design.md`

## Notas de la segunda opinión y decisiones del usuario (aprobadas, obligatorias; prevalecen sobre el texto de abajo si lo contradicen)

1. **Lockfile: SE APLICA el cambio (decisión del usuario, contraria a la recomendación del architect y del revisor).** `package-lock.json` se actualiza para que la entrada raíz `packages[""]` refleje `engines`. Esto **modifica el criterio de la spec de no tocar el lock** (el usuario lo autoriza expresamente): el developer lo anota en su entrega y el tester lo refleja en `docs/09` y en el aviso de PR. Método seguro, sin ejecutar `npm install` sobre el repo: (a) copiar `package.json` (ya con `engines`) y `package-lock.json` a una carpeta nueva del scratchpad; (b) ejecutar allí `npm install --package-lock-only --ignore-scripts`; (c) comparar el resultado con el lock original del repo: el diff DEBE ser exactamente el bloque `"engines": { "node": ">=22" }` añadido en la entrada raíz y nada más; (d) solo si es así, copiar ese archivo sobre `package-lock.json` del repo con `cp`, conservando LF; si el diff contiene cualquier otra cosa (versiones, integridad, `resolved`, `lockfileVersion`), NO copiarlo, parar y devolverlo al orquestador con el diff. `npm ci` en otra copia limpia debe seguir saliendo con 0 y sin `EBADENGINE`. `package-lock.json` está mapeado a `docs/02-tecnologias.md` en `docsPorArea`: se toca ese documento de todos modos (el tester lo menciona si procede).
2. **Se corrigen las tres frases sobre `npm test` en el `preBuild` de Amplify** (decisión del usuario; fuera de la letra de la spec, se anota en el aviso): `docs/08` (sección de Despliegue), la hoja de ruta de `docs/09` (punto sobre Amplify) y la fila Tests de `docs/integracion/para-infra.md`; deben decir que ya está en `preBuild` (`modules/amplify/main.tf`).
3. Paso 3: el condicional "si los comentarios actuales difieren, conservar y comunicar" queda cerrado: el revisor confirmó con diff que no difieren; el `ci.yml` final es el del plan.
4. Riesgo residual a documentar (no bloquea): `@napi-rs/lzma-linux-x64-gnu` (dependencia opcional de rollup, solo Linux) exige `^22.20 || ^24.12 || >=25`; `setup-node` y `nvm install 22` resuelven al último 22.x, así que no debería afectar; su instalación en Linux no se ha podido comprobar desde este equipo (Windows) **(por confirmar)** hasta ver la CI.
5. Protección de rama: renombrar el job hace que cualquier regla que exija el nombre antiguo bloquee todas las PR hasta actualizarla a los dos nombres nuevos. Con la matriz ambos checks corren siempre, así que no se quedan en "Expected, waiting". `docs/08` y el aviso de PR lo dicen explícitamente.

Crítico: sí. Coincide con las entradas "CI" (`ci.yml`, `dependabot.yml`) y "dependencias" (`engines`) de `criticidad`.

## Hallazgos que condicionan el plan

- `scripts/docs-check.mjs` solo exige que `ci.yml` contenga como texto los cinco comandos (`npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check`). Las condiciones `if:` no lo rompen.
- `docs:check` rechaza recuentos "N tests/claves/archivos/líneas/componentes/páginas" fuera de `docs/09`, incluidas specs y avisos. No copiar la cifra de tests del build #7 de infra.
- `quality-check.mjs` no mira Node, `engines`, `.nvmrc` ni `ci.yml`.
- `docs/08` (sección de Despliegue) y el punto de la hoja de ruta de `docs/09` sobre Amplify dicen que "conviene añadir `npm test` al preBuild". El `build_spec` real (`modules/amplify/main.tf`) ya lo tiene. Fuera de la letra de la spec: ver decisión del usuario.
- Los ids M de `docs/09` llegan hasta M18; M19 está libre. La fecha de "Última actualización" ya es 30/10/2026.
- Tests y red (grep): `fetch` solo aparece en `FileUpload.test.js` (mockeado con `vi.stubGlobal('fetch', ...)` en `beforeEach`) y en `api.test.js` (mock en el `beforeEach` de sus `describe`). No hay `process.env`, `import.meta.env`, `stubEnv`, `XMLHttpRequest`, `axios` ni modo watch. El developer confirma que no hay un `describe` de `api.test.js` sin stub.
- Recursos de S3: todas las claves de `assets.js` empiezan por `assets/`; `assetUrl` solo se usa en `Header`, `Home` (también con claves de `ASSETS.LOGOS`), `About` y `Explore`.
- Hay `js-yaml` y `yaml` en `node_modules` (transitivos), así que el YAML puede validarse sin dependencias nuevas.

## Decisiones

**1. Matriz de `ci.yml`.** `strategy: { fail-fast: false, matrix: { node: [22, 24] } }` con números; `if: matrix.node == 22` (la comparación `==` coacciona tipos en Actions; se usa número en ambos sitios); `node-version: ${{ matrix.node }}` y `cache: npm`. Nombre del job: `Tests, compilación, calidad y documentación (Node ${{ matrix.node }})`; los dos checks resultantes son `... (Node 22)` y `... (Node 24)` (en la UI de la PR llevan el prefijo `CI / `; el contexto que se exige en la protección de rama es solo el nombre del job). Un paso omitido por `if` queda `skipped` y el check sale en verde. La clave de caché de npm no incluye la versión de Node; no se personaliza (puede salir un aviso no fatal de caché ya existente). No se tocan `permissions`, `concurrency`, triggers, cron, `timeout-minutes` ni `runs-on`. Corren en ambas versiones `npm ci`, `npm test`, `npm run build` y `npm run agentes:test`; solo en Node 22, ESLint, calidad (con `npm audit`) y `docs:check`. Se quitan el segundo `setup-node` y el comentario de Node 21. Alternativas descartadas: `include`/`exclude` (más complejo), dos jobs separados (duplica YAML y cambia `verify`), `node: ['22','24']` (equivalente), `if: ${{ ... }}` (equivalente).

**2. `engines`.** `"engines": { "node": ">=22" }` justo después de `"private": true,` (el diff son solo líneas añadidas). `npm ci` no compara `engines` raíz con el lock, así que debe pasar con el lock sin cambios. Recomendación: `package-lock.json` SIN CAMBIOS (criterio de la spec); si una copia temporal muestra que la única diferencia sería el bloque `engines` de la entrada raíz, se informa como deriva esperada y no se aplica.

**3. `.nvmrc`.** Contenido `22` más salto de línea final (LF; `.gitattributes` fuerza `eol=lf`). Se crea con el editor, no con `echo` ni `cat <<EOF`. Debe pesar 3 bytes.

**4. Verificación local (Node v24.16.0).** `npm ci` NO se ejecuta en el repo (borra `node_modules`): se ejecuta en una carpeta nueva del scratchpad con solo `package.json` (ya con `engines`) y `package-lock.json`, con `npm ci --prefix <carpeta>`, que debe salir con 0. En el repo corren `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run agentes:test` (ninguno borra `node_modules`). Tras `build`, `git status` no debe mostrar `dist/`. Validez del YAML con un script ad hoc del scratchpad (no se versiona; `validar-ci.mjs` recibe la ruta del repo, carga `js-yaml` con `createRequire` y, si falla, `yaml`): comprueba que parsea; `permissions`, `concurrency` y `timeout-minutes` sin cambios; `strategy` con la matriz numérica; que el `name` contiene `${{ matrix.node }}`; un único `actions/setup-node` con `node-version` = `${{ matrix.node }}` y `cache: npm`; el orden de los `run`; y que solo lint, quality y docs:check llevan el `if`. Valida sintaxis y estructura, no la semántica de GitHub (queda **(por confirmar)** hasta ver los dos checks en verde). Node 22 opcional, con OK por la descarga: en una copia completa del repo en el scratchpad, `npx -y -p node@22 npm test`; no instala nada global y aun así el check de GitHub sigue **(por confirmar)**.

**5. Sin test automatizado nuevo.** Un test en `src/` obliga a mencionarlo en `docs/08`, a subir la cifra de `docs/09` y viola el criterio de la spec de no tocar `src/`; uno en `scripts/` o `plugins/` no lo ejecuta ningún script; uno que lea `ci.yml` sería frágil. En su lugar, "rojo/verde" manual: **rojo** antes de cambiar (`grep -n '"engines"' package.json` sin salida; `.nvmrc` no existe; `validar-ci.mjs` falla sobre el `ci.yml` actual; el grep de `Node 20`, `Node.js 20` y `nvm use 20` en `README.md`, `docs/` salvo `docs/specs/`, y `.github/` da las líneas de la spec); **verde** después (engines presente, `.nvmrc` de 3 bytes, `validar-ci.mjs` pasa, el grep sin resultados fuera de `docs/specs/`). Los mensajes se anotan en la entrega.

**6. Áreas de contrato.** `package.json` y `.github/**` están en `areasContrato`: aviso `docs/specs/2026-10-30-node-22-alineacion-aviso-pr.md` con la línea `Integración: para-infra.md actualizado — Node 22 con nvm (como el build_spec real), intención de Node 24, cierre de dos (por confirmar) y orden de despliegue por master=CRA. Sin impacto en para-backend.md.`; debe incluir los nombres de los dos checks y la advertencia de protección de rama; sin cifras del tipo "N tests".

## Fase 1

1. **Rojo y `engines` en `package.json`.** Archivo: `package.json`. Añadir `"engines": {` / `"node": ">=22"` / `},` (indentación de 2 espacios, LF) entre `"private": true,` y `"dependencies"`. Nada más; el lock no se toca. Antes del cambio, los comandos "rojo" de la decisión 5. Comprobación: `grep -n '"engines"' package.json` da un resultado; `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"` pasa; el diff son solo líneas añadidas. Norma: `seguridad.md` y `buenas-practicas-frontend.md` (dependencias: no se añade ninguna).

2. **Crear `.nvmrc`.** Archivo nuevo en la raíz, `22` + LF, con el editor. Comprobación: 3 bytes; `git status` lo muestra como nuevo. Norma: `.gitattributes` (LF).

3. **Matriz en `ci.yml`.** Archivo: `.github/workflows/ci.yml`. Las líneas del encabezado (`name`, `on`) no cambian. Estado final del job `verify`:
   ```yaml
   jobs:
     verify:
       # El nombre incluye la versión de Node: son dos checks distintos, y esos son los que hay
       # que exigir en la protección de rama (ver docs/08-guia-desarrollo.md).
       name: Tests, compilación, calidad y documentación (Node ${{ matrix.node }})
       runs-on: ubuntu-latest
       timeout-minutes: 15
       strategy:
         fail-fast: false
         matrix:
           # 22 es la principal (la que fija el build de Amplify, ver docs/integracion/para-infra.md);
           # 24 anticipa la migración de infra. fail-fast desactivado para ver el resultado de cada una.
           node: [22, 24]
       steps:
         - uses: actions/checkout@v4

         - uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node }}
             cache: npm

         - name: Instalar dependencias
           run: npm ci

         - name: Tests
           run: npm test

         - name: Compilación
           run: npm run build

         # Solo en Node 22: lint, calidad (incluye npm audit) y docs:check no dependen de la
         # versión de Node; ejecutarlos dos veces duplicaría coste y ruido en el cron semanal.
         - name: ESLint
           if: matrix.node == 22
           run: npm run lint

         - name: Calidad y seguridad
           if: matrix.node == 22
           run: npm run quality

         - name: Documentación al día
           if: matrix.node == 22
           run: npm run docs:check

         # Tests del plugin ciclo-agentico (node:test), en ambas versiones. Su script usa un glob de
         # `node --test`, que exige Node 21 o posterior: valen las dos. No forma parte de la
         # definición de terminado: la comprobación de docs:check solo exige los cinco.
         - name: Tests del plugin ciclo-agentico
           run: npm run agentes:test
   ```
   Si los comentarios o pasos actuales del archivo difieren de este esquema en algo que no sea la versión de Node, el developer lo conserva tal cual (no se cambia la lógica de la CI) y lo comunica. Comprobación: `validar-ci.mjs` pasa (rojo previo: falla); `npm run docs:check` sigue encontrando los cinco comandos; `git diff` no muestra cambios en `permissions`, `concurrency`, `on` ni cron.

4. **Comentario de `dependabot.yml`.** Archivo: `.github/dependabot.yml`, solo la línea del comentario del `ignore` de jsdom. Texto: `# jsdom 27 o posterior: se mantiene el pin por cambio mínimo, no por Node 20. Con Node 22 como base podría valorarse subirlo (M19 en docs/09).` Comprobación: el diff es solo esa línea de comentario; la regla `ignore` queda idéntica.

5. **Verificación local en Node v24.16.0.** Sin archivos del repo (solo scratchpad): `npm ci --prefix <carpeta>` en la copia de dos archivos; la comprobación del lock con `npm install --package-lock-only --ignore-scripts --prefix <carpeta2>` en otra copia, comparando con el `package-lock.json` original; `validar-ci.mjs`; los seis comandos en el repo; grep de red y de `process.env` en los tests; opcional Node 22 con `npx`. Informa de la salida resumida de cada comando, el diff del lock, si hubo aviso `EBADENGINE` y el `git status` final, que solo debe mostrar los archivos esperados. Exigido: `npm ci` con 0; `npm test`, `build`, `lint`, `quality`, `docs:check` y `agentes:test` en verde; avisos de ESLint sin subir (tope 62). Todo lo de Node 22 en GitHub queda **(por confirmar)**.

## A cargo del tester-documentador

Archivos en LF, sin cifras fuera de `docs/09`, y lo que no se pueda comprobar con `(por confirmar)`.

1. `docs/08-guia-desarrollo.md`: Node 22 o superior (`engines.node` `>=22`, `.nvmrc` con `22` para `nvm use`; la versión del build de Amplify; la CI prueba también Node 24); quitar el motivo "jsdom exige Node 22"; la CI con matriz y `fail-fast: false`, con qué corre en cada versión y los dos nombres de check, y que el check antiguo sin versión ya no existe; dependabot sin atribuir jsdom a Node; proteger ramas exigiendo los dos checks, y actualizar cualquier regla previa que exigiera el nombre antiguo. Corregir también la frase que dice que "conviene añadir `npm test` al preBuild" (ya está en `main.tf`), si el usuario lo autoriza.
2. `docs/02-tecnologias.md`: jsdom ^26 "se mantiene por cambio mínimo; subirlo a 27+ se valora en M19 con Node 22 como base" (no afirmar los `engines` exactos de jsdom 27 sin comprobarlos: por confirmar); la tabla de configuración menciona `engines.node` y `.nvmrc`.
3. `README.md`: Node.js 22 (o superior, con `nvm use` y `.nvmrc`).
4. `docs/guias/buenas-practicas-frontend.md`, SOLO la fila de dependencias que cita Node 20 (autorizado por el usuario): "...y que funcione con **Node 22**", con el motivo actualizado (Amplify usa Node 22, la CI prueba también Node 24; jsdom 26 se mantiene por cambio mínimo, M19). Nada más de la guía.
5. `docs/integracion/para-infra.md`, sección 2: nota en la fila de `master` (sigue siendo Create React App, react-scripts 5.0.1, verificado con git el 30/10/2026; incompatible con el `build_spec` actual; antes del primer build de `prod`, fusionar `feature/testing` en `master`, o aplicar solo en `dev`; que `terraform apply` no lanza un build por sí solo es **(por confirmar)**); fila Node (Node 22 con `nvm install 22 && nvm use 22`, verificado contra `modules/amplify/main.tf` y el build #7 de infra en `dev`; `engines` y `.nvmrc`; intención de Node 24 con matriz en la CI e infra avisando al cambiar el `build_spec`); fila Tests (`vitest run`, termina solo y sin watch; sin red ni secretos, verificado con grep; sin la cifra de tests; "ya está en `preBuild`"); sección 5: C13 cerrado (todas las claves de `assets.js` bajo `assets/`; contrastar antes con el código lo de la galería y el carrusel, que no pasan por `assetUrl`).
6. `docs/09-estado-actual-y-deuda-tecnica.md`: fila nueva en el historial (infra:C10 atendida por el frontend con la matriz, `engines`, `.nvmrc`, textos y `para-infra.md`; evidencia de Node 22: solo el build #7 de infra; verificado en local con Node v24; el check de Node 22 en GitHub, la validez del YAML en GitHub y la protección de rama **(por confirmar)**; referencia al aviso). No reescribir la fila histórica del ciclo-agentico que habla del paso con Node 22 (la nueva indica que la sustituye). Fila **M19** en "Prioridad media" (valorar jsdom 27+ con Node 22 como base; exige justificación, `npm audit` y revisar el efecto en los tests; `package.json`, `.github/dependabot.yml`). Hoja de ruta: exigir los dos checks por nombre. Cifras: no tocar métricas (ningún archivo de test ni de código cambia).
7. Aviso de PR `docs/specs/2026-10-30-node-22-alineacion-aviso-pr.md` (decisión 6). Mensaje de commit propuesto (inglés, imperativo, sin prefijo): `Align the frontend with Node 22 and test Node 24 in the CI matrix (infra C10)`.
8. Comprobaciones finales: `npm run docs:check`, `npm run docs:gate`, y un grep de `Node 20`, `Node.js 20` y `nvm use 20` en `README.md`, `docs/` (sin `docs/specs/`) y `.github/` sin resultados.

## Pruebas

- Ningún test unitario nuevo ni modificado. Los pasos 1 a 4 se comprueban con grep (rojo antes, verde después) y con `validar-ci.mjs`.
- Regresión: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run agentes:test`, más `npm run docs:gate`.

## Cierre

- Crítico: sí (CI y dependencias). Procede segunda opinión sobre el plan y sobre el diff, sobre todo en los nombres de los checks y la condición `if`.
- Integración afectada: `docs/integracion/para-infra.md` (secciones 2 y 5). `para-backend.md` no cambia. Infra deberá actualizar su `para-frontend.md` (fuera de este repo).
- Contrato externo: cambia el nombre del check de GitHub; si existe una protección de rama que exija el nombre antiguo, bloquearía los PR y habría que cambiarla a los dos nombres nuevos (que exista esa regla es **(por confirmar)**).
- Preguntas del architect al usuario: (1) si la única diferencia del lock sería el bloque `engines` de la entrada raíz, ¿se deja sin aplicar? (propuesta: sí, por el criterio de la spec); (2) corregir la frase de `docs/08` y de la hoja de ruta de `docs/09` sobre `npm test` en el `preBuild` de Amplify (ya está en `main.tf`), fuera de la letra de la spec.
