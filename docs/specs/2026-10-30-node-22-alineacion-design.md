# Alinear el frontend con Node 22 y probar también Node 24 (infra:C10): spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

El build de Amplify fija Node 22 (`nvm install 22 && nvm use 22`, `npm ci`, `npm test`, `npm run build`, artefactos `dist`; infra:C10, verificado por infra en `dev`, build #7, 30/10/2026). El frontend sigue declarando Node 20 en la CI, la documentación, una guía y `dependabot.yml`, y `package.json` no tiene `engines`. Hay que alinear versión, documentación e integración con Node 22 como base, y anticipar la migración de infra a Node 24 haciendo que la CI pruebe ambas versiones (decisión del usuario).

## Decisiones del usuario (cierran las preguntas anteriores)

1. **CI:** matriz Node 22 y 24 (no unificar solo en 22).
2. **`engines.node`:** `>=22`. Se **añade** `.nvmrc` con `22`.
3. **`jsdom`:** se deja el pin `^26`; no se toca la dependencia ni `package-lock.json`. Se corrigen los textos que lo atribuyen a Node 20 y se abre una nota en `docs/09` para valorar jsdom 27+.
4. **Guía `docs/guias/buenas-practicas-frontend.md` línea 125:** se autoriza editar **solo esa fila** (Node 22 en lugar de Node 20, coherente con el motivo real del pin de jsdom). Nada más de la guía.

## Estado actual (contrastado en el repositorio)

- `.github/workflows/ci.yml`: workflow `name: CI`; un único job con id `verify` y `name: Tests, compilación, calidad y documentación` (ese es hoy el nombre del check de GitHub). Suite en Node 20 (comentario "Node 20: el mismo que usan el backend (Elastic Beanstalk) y Amplify") y un segundo `setup-node` con Node 22 solo para `npm run agentes:test` (el glob de `node --test` exige Node 21 o posterior). Triggers: PR, push a `master` y `feature/testing`, lunes 06:00 (cron) y `workflow_dispatch`. `timeout-minutes: 15`, `concurrency` por `github.ref`.
- `npm run quality` incluye `npm audit` (resultado independiente de la versión de Node). La ejecución semanal existe para detectar vulnerabilidades nuevas.
- `package.json`: sin `engines`; `jsdom` `^26.1.0`; `test` = `vitest run`. No hay `.nvmrc` ni `.npmrc`, así que `engines` solo avisaría al instalar.
- `.claude/flujo.json`: `package.json` y `.github/**` están en `areasContrato` (y en `docsPorArea`: `package.json` → `docs/02` y `docs/08`; `.github/**` → `docs/08`). `.nvmrc` no figura ni en `areasContrato` ni en `docsPorArea`: no es área de contrato por sí mismo, pero el cambio ya lo es por `package.json` y `.github/**`. `scripts/docs-check.mjs` no exige mencionar archivos nuevos (solo comprueba enlaces, guías, comandos y métricas), así que mencionar `.nvmrc` en `docs/08` y `docs/02` es por coherencia, no por exigencia del script.
- Amplify ya ejecuta `nvm install 22 && nvm use 22` y no depende de `.nvmrc`; el archivo sirve al equipo (`nvm use`).
- Texto que dice "Node 20" (excluido `docs/specs/`): `README.md` línea 11; `docs/02-tecnologias.md` línea 29 (incluye el motivo del pin de jsdom); `docs/08-guia-desarrollo.md` línea 5, línea 134 (descripción de la CI) y línea 136 (`dependabot`); `docs/integracion/para-infra.md` línea 37; `.github/dependabot.yml` línea 16 (comentario del `ignore` de jsdom); guía `docs/guias/buenas-practicas-frontend.md` línea 125. `docs/09` cita Node 22 en la línea 52 (por revisar al editarlo).
- Protección de rama: `docs/09` (hoja de ruta, punto 10) y `docs/08` la tienen pendiente ("Proteger las ramas `master` y `feature/testing` exigiendo la CI en verde"); no consta que esté activada (por confirmar en los ajustes de GitHub). Si lo estuviera, exigiría el check actual y la matriz lo cambiaría.
- Node local de este equipo: v24.16.0 (npm 11.13.0). Node 22 no se puede probar aquí; lo que consta en Node 22 es el build #7 de infra en `dev`.
- Tests y red: ningún `*.test.js` lee `process.env`, `import.meta.env` ni usa `stubEnv`; `fetch` solo aparece en `FileUpload.test.js` y `api.test.js` (a verificar que siempre está mockeado).
- Recursos de `VITE_S3_URL`: todas las claves de `src/config/assets.js` (`LOGO`, `BANNER`, `ABOUT`, `GLOSSARY`, `LOGOS.*`) empiezan por `assets/`; los usos de `assetUrl` están en `Header`, `Home`, `About` y `Explore` y solo pasan claves de ese objeto.
- Rama de producción: `master` sigue siendo Create React App (react-scripts 5.0.1, sin Vite ni Vitest ni `vite.config.js`; 39 commits por detrás de `feature/testing`), **verificado con `git` por el orquestador el 30/10/2026**: `git show origin/master:package.json` da `react-scripts 5.0.1` con `build` = `react-scripts build` y `test` = `react-scripts test`, y `git rev-list --count origin/master..origin/feature/testing` da 39.

## Criterios de aceptación

### De código

1. `package.json` tiene `engines.node` = `">=22"`. `npm ci` no falla por ello (sin `engine-strict` solo avisa; se comprueba ejecutándolo).
2. Existe `.nvmrc` en la raíz con el contenido `22` y nada más.
3. `.github/workflows/ci.yml` usa una `strategy.matrix` con Node `22` y `24` y `fail-fast: false` (se ven ambos resultados). `setup-node` usa `${{ matrix.node }}`, mantiene `cache: npm`, y desaparece el segundo `setup-node` (el de Node 22 solo para `agentes:test`). No cambian permisos, triggers, `concurrency`, `timeout-minutes` ni el orden relativo de los pasos; no se añaden ni quitan comandos.
4. **Nombre de los checks.** El `name:` del job incluye explícitamente la versión (`${{ matrix.node }}`) para que los checks resultantes sean `Tests, compilación, calidad y documentación (Node 22)` y `... (Node 24)` (o la forma equivalente que se documente; no dejar el nombre fijo, porque dos checks con el mismo nombre serían ambiguos). Hoy el check se llama `Tests, compilación, calidad y documentación` (job `verify`, workflow `CI`): ese nombre deja de existir. Los nombres definitivos quedan escritos en `docs/08` y en el aviso de PR.
5. **Qué corre en cada versión.**
   - En **ambas** (22 y 24): `npm ci`, `npm test`, `npm run build` y `npm run agentes:test` (barato, y el glob de `node --test` vale con Node >= 21, o sea con ambas).
   - Solo en **Node 22** (la principal, la de Amplify; se condiciona con `if: matrix.node == 22` o equivalente): `npm run lint`, `npm run quality` (incluye `npm audit`, independiente de la versión: ejecutarlo dos veces duplicaría coste y ruido en el cron semanal) y `npm run docs:check` (comprueba texto, no ejecuta código dependiente de la versión).
   - `npm run docs:check` sigue encontrando los cinco comandos de la definición de terminado en el texto de `ci.yml`; se comprueba ejecutándolo.
6. Los comentarios de `ci.yml` que hablan de Node 20 (cabecera del `setup-node` y el del paso de `agentes:test`) se reescriben para reflejar la matriz, la razón de cada condición y que `agentes:test` ya no necesita un `setup-node` aparte.
7. `.github/dependabot.yml` no cambia su regla `ignore` de `jsdom`; solo el texto del comentario de la línea 16, que pasa a decir que el pin se mantiene por cambio mínimo y no por Node 20 (con Node 22 como base podría valorarse jsdom 27+).
8. **Node 24 local (verificable):** `npm ci`, `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run agentes:test` pasan en el Node local v24.16.0. Se registra la salida resumida.
9. **Node 22 (por confirmar):** no se puede ejecutar aquí. Queda **(por confirmar)** hasta ver la CI en verde en GitHub (check de Node 22). Evidencia ya existente: build #7 de infra en `dev` (30/10/2026). El developer puede valorar una ejecución puntual con `npx` y Node 22 sin instalar nada global ni tocar el sistema; la spec solo lo admite como posibilidad.
10. `npm test` termina solo, sin red real, sin secretos y sin modo watch: se comprueba con `grep` sobre `src/**/*.test.js` (sin `process.env`, `import.meta.env` ni red real; `fetch` solo mockeado) y con una ejecución local.
11. **Validez del YAML:** si existe una forma local de validar `ci.yml` sin dependencias nuevas (por ejemplo, que una herramienta ya presente en el repositorio lo parsee), se usa; si no, queda **(por confirmar)** hasta ver los dos checks en verde en GitHub.
12. No cambia nada bajo `src/`, ni `dependencies`/`devDependencies`, ni `package-lock.json`. Los cambios de `package.json` se limitan a `engines`.

### De documentación

1. `docs/integracion/para-infra.md`, sección 2: Node 22 (`nvm install 22 && nvm use 22`, como el `build_spec` real); intención de pasar a Node 24 (la CI del frontend ya lo prueba en matriz; infra avisará al migrar); se cierra el "(por confirmar)" de que `npm test` no necesita red ni secretos (evidencia del criterio de código 10 y el build #7); se cierra el "(por confirmar)" de infra:C13 sobre que no se pide por `VITE_S3_URL` nada fuera de `assets/` (evidencia de `src/config/assets.js` y los usos de `assetUrl`; galería y carrusel usan URLs prefirmadas del backend, no CloudFront, a contrastar con el código).
2. Misma sección o la de orden de despliegue: nota de que Amplify de `prod` construye desde `master`, que sigue siendo Create React App y es incompatible con el `build_spec` actual (Node 22, `npm test`, `dist`). Antes del primer build de producción hay que fusionar `feature/testing` en `master`, o aplicar solo en `dev`. Que el `apply` por sí mismo no lanza un build queda **(por confirmar)**.
3. `docs/08-guia-desarrollo.md`: describe la CI con matriz (qué corre en ambas versiones y qué solo en 22), los **nombres exactos de los dos checks** y que **si se configura la protección de rama hay que exigir ambos** (y que el check antiguo ya no existe, por lo que una regla previa que lo exigiera habría que actualizarla); menciona `.nvmrc` y `engines`; el texto de `dependabot` y del pin de jsdom deja de decir Node 20.
4. `docs/02-tecnologias.md` (incluida la línea 29 del pin de jsdom, que no se atribuye ya a Node 20), `README.md` línea 11 y la guía `docs/guias/buenas-practicas-frontend.md` línea 125 (solo esa fila) dicen Node 22. `docs/02` menciona `.nvmrc` y `engines` donde proceda. No queda "Node 20" fuera de `docs/specs/` salvo en un histórico justificado (se comprueba con `grep`).
5. `docs/09-estado-actual-y-deuda-tecnica.md`: fecha de "Última actualización" 30/10/2026; nota de que infra:C10 está atendida por el frontend; nueva fila **M19** (siguiente id libre: los ids de prioridad media llegan hasta M18) en "Prioridad media" para valorar jsdom 27+ con Node 22 como base, exigiendo `npm audit` y justificación y revisando el efecto en los tests; actualizar la línea 52 si cita Node. Las cifras solo viven aquí. El punto 10 de la hoja de ruta (proteger ramas) se menciona con la advertencia de exigir ambos checks.
6. Aviso de PR `docs/specs/*-aviso-pr.md` con la línea `Integración:` (el cambio toca `package.json` y `.github/**`, áreas de contrato; la integración sí cambia: `para-infra.md`), los nombres de los dos checks y la advertencia sobre la protección de rama. Los mensajes de commit en inglés, imperativo y sin prefijo.
7. `npm run docs:check` y `npm run docs:gate` en verde. Sin recuentos del tipo "N tests/claves/archivos/avisos" fuera de `docs/09`, tampoco en esta spec ni en el aviso.

## Fuera de alcance

- Migrar a Node 24 en Amplify y tocar `sigmetum-infra` o `sigmetum-backend` (la CI solo lo prueba).
- Desbloquear `jsdom` 27+ y cualquier cambio de dependencias o de la regla `ignore` de dependabot.
- Cualquier cambio de `src/` (código de producción).
- Activar o modificar la protección de rama en GitHub (ajuste manual del repositorio; solo se documenta qué exigir).
- Editar otra parte de las guías que no sea la fila de la línea 125.
- B1, B20, M1, M13, M11, M17.
- Fusionar `feature/testing` en `master` (solo se documenta el orden). `feature/testing` tiene 4 commits de merge que la rama local no tiene; no afecta a este cambio.

## Impacto en contratos externos

- `docs/integracion/para-infra.md`: lo afecta. Sección 2 pasa a Node 22, se cierran dos "(por confirmar)", se añade la intención de Node 24 y la nota de orden de despliegue. Infra debe actualizar a su vez su `para-frontend.md` (fuera de este repositorio).
- `docs/integracion/para-backend.md`: no lo afecta (ningún cambio de API ni de `src/services/api.js`).
- Contrato con GitHub (checks requeridos): cambia el nombre del check de la CI; afecta a cualquier regla de protección de rama que exista o se cree.
- Criticidad (de `.claude/flujo.json`): CRÍTICO por "CI" y "dependencias" (`engines`); procede segunda opinión sobre plan y diff.

## Riesgos

- **Coste de CI doble:** `npm ci`, `npm test`, `npm run build` y `agentes:test` corren dos veces por PR, push y cron semanal. Se acota con `lint`, `quality` y `docs:check` solo en Node 22 y con `timeout-minutes` por job.
- **Check renombrado:** una protección de rama que exigiera el nombre actual dejaría de aplicarse o bloquearía los PR; mitigación en los criterios 4 y de documentación 3 y 6.
- **Node 24 puede fallar en CI aunque pase en local** (otro sistema, caché): con `fail-fast: false` se verá el resultado de cada versión sin ocultar el de 22.
- **Divergencia entre versiones:** al no ejecutar lint/quality en 24, un problema solo de 24 en esos pasos no se detecta en CI; se asume porque se comprobó en local y es contrato de intención, no de producción.

## Preguntas abiertas

Ninguna. Las cinco preguntas del borrador anterior están resueltas por el usuario (ver "Decisiones del usuario"). Quedan solo verificaciones marcadas **(por confirmar)**: Node 22 en la CI de GitHub, validez del YAML y que `apply` no lanza un build. Que `master` es CRA con 39 commits de diferencia ya está verificado con `git`.
