# sigmetum-frontend

SPA de React + Vite de SIGMETUM-A. Documentación técnica en `docs/` (empieza por `docs/README.md`), en español.

## Comandos

- `npm run dev`: servidor de desarrollo (puerto 3000)
- `npm test`: tests (Vitest); `npm run build`: compilación a `dist/`
- `npm run docs:check`: comprueba que la documentación no se ha quedado atrás

## Después de cada feature o fix

**Sigue `docs/MANTENIMIENTO.md` antes de dar el trabajo por terminado.** En resumen:

1. Busca en su sección 2 qué documentos corresponden al tipo de cambio y actualízalos **en el mismo commit**.
2. Ejecuta `npm test`, `npm run build` y `npm run docs:check`. Los tres deben pasar.
3. Contrasta lo que escribas con el código; lo que no puedas comprobar, márcalo como **(por confirmar)**.
4. Si el cambio afecta al backend o a la infraestructura, actualiza `docs/integracion/` y dilo en el resumen final.
5. Las cifras (archivos, componentes, tests, claves) solo viven en `docs/09-estado-actual-y-deuda-tecnica.md`.

## Reglas del código

- Los fallos se corrigen con TDD: primero un test que falle por el motivo correcto.
- Las llamadas HTTP van por `src/services/api.js`; los textos por `t()`, con la clave en `es` y `en`.
- Los recursos de S3 se declaran en `src/config/assets.js` y se usan con `assetUrl()`.
- No guardes secretos en `.env.example` ni en la documentación.
- Al crear archivos con barras invertidas (expresiones regulares), usa el editor, no `cat <<EOF`.
- No hagas commit ni push sin que te lo pidan.
