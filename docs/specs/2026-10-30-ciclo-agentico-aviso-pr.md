# Aviso para PR: ciclo-agentico en el frontend

Fecha: 30/10/2026

Se incorpora el flujo agéntico `ciclo-agentico` (copia del núcleo de `sigmetum-backend`). Toca áreas de contrato de `.claude/flujo.json` (`package.json`, `vite.config.js`, `.github/**`) solo por añadir scripts de desarrollo, acotar los tests de Vitest a `src/` y añadir a la CI un paso con Node 22 que ejecuta `npm run agentes:test`; no cambia endpoints, variables `VITE_*`, recursos de S3 ni el build que ejecuta Amplify.

Integración: sin impacto — solo herramientas de desarrollo (scripts de `package.json`, `plugins/`, `.claude/`); el contrato con el backend y lo que necesita la infraestructura no cambian.

Qué debe hacer cada equipo: ninguno. Quien trabaje en este repositorio con Claude Code debe registrar el marketplace local (ver [plugins/README.md](../../plugins/README.md#cómo-se-activan)).
