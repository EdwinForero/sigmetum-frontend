# sigmetum-frontend

SPA de React + Vite de SIGMETUM-A (web de investigación ambiental de una universidad). Documentación técnica en `docs/` (empieza por `docs/README.md`), en español.

## Comandos

- `npm run dev`: servidor de desarrollo (puerto 3000)
- `npm test`: tests (Vitest) · `npm run build`: compilación a `dist/`
- `npm run lint`: ESLint (errores y tope de avisos) · `npm run quality`: seguridad (patrones, secretos, `npm audit`) y lint
- `npm run docs:check`: comprueba que la documentación no se ha quedado atrás

## Antes de empezar: lee la guía que corresponda a la tarea

Las guías están en `docs/guias/`. Léelas **antes** de escribir código, no después:

| Si la tarea toca... | Lee |
|---|---|
| **Cualquier código** | `docs/guias/buenas-practicas-frontend.md` |
| Sesión y token, formularios, subida de archivos, URLs y enlaces externos, HTML dinámico, dependencias, cookies o variables de entorno | `docs/guias/seguridad.md` |
| Interfaz: colores, formularios, diálogos, navegación, imágenes, animaciones o textos | `docs/guias/accesibilidad.md` |
| **Al terminar** cualquier feature o fix | `docs/guias/mantenimiento.md` |

Si lo que te piden **contradice una guía, avisa y pregunta antes de hacerlo**. Si la guía y el código se contradicen, dilo: no des por buena ninguna de las dos.

## Lo que nunca se hace (resumen; el detalle y el motivo están en las guías)

- Guardar secretos en el frontend: las variables `VITE_*` son públicas.
- Usar `dangerouslySetInnerHTML`, `innerHTML`, `eval` o `new Function`.
- Tocar el token de sesión fuera de `services/api.js`, `LoginForm` y `ProtectedRoute`.
- Pasar datos del usuario a `Link`, `navigate` o a una expresión regular sin escapar.
- Enlaces externos sin `rel="noopener noreferrer"` o con `http://`.
- Mutar props o estado (`sort()` sobre un array que no es una copia).
- Quitar el contorno de foco sin alternativa, o dejar un botón de solo icono sin `aria-label`.
- Añadir una dependencia sin justificarla ni pasar `npm audit`; usar `npm audit fix --force`.

## Al terminar cualquier feature o fix

1. Actualiza los documentos que indica `docs/guias/mantenimiento.md` (sección 2) **en el mismo commit**.
2. Ejecuta `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check`: los cinco deben pasar. Si corregiste avisos de ESLint, baja `--max-warnings` al número real.
3. Contrasta lo que escribas con el código; lo que no puedas comprobar, márcalo como **(por confirmar)**.
4. Si el cambio afecta al backend o a la infraestructura, actualiza `docs/integracion/` y dilo en el resumen final.
5. Las cifras (archivos, componentes, tests, claves) solo viven en `docs/09-estado-actual-y-deuda-tecnica.md`.

## Reglas de trabajo

- Los fallos se corrigen con TDD: primero un test que falle **por el motivo correcto**, después el cambio mínimo.
- Las llamadas HTTP van por `src/services/api.js`; los textos por `t()`, con la clave en `es` y `en`; los recursos de S3 se declaran en `src/config/assets.js`.
- No guardes secretos en `.env.example` ni en la documentación.
- Al crear archivos con barras invertidas (expresiones regulares), usa el editor, no `cat <<EOF`.
- No hagas commit ni push sin que te lo pidan.
