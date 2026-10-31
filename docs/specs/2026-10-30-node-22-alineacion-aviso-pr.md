# Aviso para PR: alineación con Node 22 y matriz Node 22 y 24 (infra:C10)

Spec: `docs/specs/2026-10-30-node-22-alineacion-design.md` · Plan: `docs/specs/2026-10-30-node-22-alineacion-plan.md`

Integración: para-infra.md actualizado — Node 22 con nvm (como el build_spec real), intención de Node 24, cierre de dos (por confirmar) y orden de despliegue por master=CRA. Sin impacto en para-backend.md.

## Qué cambia

- `package.json`: `engines.node` `>=22`. No cambian dependencias ni scripts. `package-lock.json` solo refleja `engines` en su entrada raíz (decisión del usuario, que se aparta del criterio previo de la spec de no tocarlo; el diff se verificó).
- `.nvmrc` nuevo con `22` (para `nvm use`; Amplify no lo lee).
- `.github/workflows/ci.yml`: matriz de Node 22 y 24 con `fail-fast: false`. En ambas corren `npm ci`, `npm test`, `npm run build` y `npm run agentes:test`; solo en Node 22 corren lint, calidad y `docs:check`. Se quita el segundo `setup-node`.
- `.github/dependabot.yml`: solo el comentario de `jsdom` (el pin se mantiene por cambio mínimo, no por Node; M19 en `docs/09`).
- Documentación: `README.md`, `docs/02`, `docs/08`, `docs/09`, la fila de dependencias de `docs/guias/buenas-practicas-frontend.md` y `docs/integracion/para-infra.md`.
- Fuera de la letra de la spec, por decisión del usuario: se corrigieron las frases de `docs/08`, de la hoja de ruta de `docs/09` y de `para-infra.md` que pedían añadir `npm test` al `preBuild` de Amplify; ya está en `modules/amplify/main.tf` de `sigmetum-infra`.

## Nombres de los checks (cambian)

- `Tests, compilación, calidad y documentación (Node 22)`
- `Tests, compilación, calidad y documentación (Node 24)`

El check antiguo, `Tests, compilación, calidad y documentación` (sin versión), ya no existe.

## Qué debe hacer quien administre el repositorio

- **Protección de rama:** si existe una regla que exige el nombre antiguo, bloqueará todas las PR hasta que se cambie a los dos nombres nuevos. Con la matriz ambos checks corren siempre, así que no se quedan en espera. Que exista esa regla es **(por confirmar)**.

## Qué debe hacer el otro repositorio

- `sigmetum-infra`: actualizar su `para-frontend.md` (Node 22 con nvm, `engines` y `.nvmrc` en el frontend, tests sin red ni secretos, C13 cerrado). Avisar al frontend al pasar el `build_spec` a Node 24.
- Orden de despliegue: `master` (rama de `prod`) sigue siendo Create React App (`react-scripts` 5.0.1) y es incompatible con el `build_spec` actual. Antes del primer build de `prod`, fusionar `feature/testing` en `master` o aplicar solo en `dev`. Que `terraform apply` no lance un build por sí solo es **(por confirmar)**.
- `sigmetum-backend`: nada.

## Por confirmar

- Los dos checks en verde en GitHub y la validez del YAML en GitHub.
- La instalación en Linux del paquete opcional `@napi-rs/lzma-linux-x64-gnu` (exige `^22.20 || ^24.12 || >=25`).
- Evidencia de Node 22 hasta ahora: build #7 de infra en `dev` y `npm test` en Node v22.23.4 vía `npx` en una copia local.
