# sigmetum-frontend

SPA de React + Vite de SIGMETUM-A (web de investigación ambiental de una universidad). Documentación técnica en `docs/` (empieza por `docs/README.md`), en español.

## Comandos

- `npm run dev`: servidor de desarrollo (puerto 3000)
- `npm test`: tests (Vitest) · `npm run build`: compilación a `dist/`
- `npm run lint`: ESLint (errores y tope de avisos) · `npm run quality`: seguridad (patrones, secretos, `npm audit`) y lint
- `npm run docs:check`: comprueba que la documentación no se ha quedado atrás
- `npm run docs:gate`: cierre documental del ciclo (documentos tocados, fecha de `docs/09` y aviso para PR); se ejecuta antes del commit
- `npm run agentes:test`: tests (`node:test`) del plugin `ciclo-agentico`; `npm run agentes:bootstrap` comprueba e instala sus dependencias

## Ciclo de desarrollo (ciclo-agentico)

Las features y los fixes con agentes pasan por `/ciclo <tarea>` (plugin [ciclo-agentico](plugins/ciclo-agentico/README.md); configuración en `.claude/flujo.json`, que se valida con `/ciclo-init`; instalación y activación en [plugins/README.md](plugins/README.md)). Fases: 0 refresh de estado · 1 requisitos → puerta humana · 2 arquitectura → puerta humana · 3 desarrollo · 4 verificación y documentación (vuelve a 3 si falla, hasta `maxVueltas`) · 5 puerta humana final. Roles:

- `requirements`: convierte la tarea en un borrador de spec en `docs/specs/`; no propone solución técnica.
- `architect`: solo lee; entrega un plan por pasos contrastado con las guías y la integración, o un veto motivado.
- `developer`: implementa el plan con el cambio mínimo (TDD: aquí hay base de tests); no edita documentos.
- `tester-documentador`: ejecuta la verificación, pone los documentos al día y propone el mensaje de commit; no edita código.

Ningún rol hace commit, push ni `git add`: el commit lo haces tú tras la puerta final. Principios de trabajo: skill [principios](plugins/ciclo-agentico/skills/principios/SKILL.md). El ciclo **no sustituye** a las guías ni a las reglas de este archivo: las aplica.

## Antes de empezar: lee la guía que corresponda a la tarea

Las guías están en `docs/guias/`. Léelas **antes** de escribir código, no después:

| Si la tarea toca... | Lee |
|---|---|
| **Cualquier código** | `docs/guias/buenas-practicas-frontend.md` |
| Sesión y token, formularios, subida de archivos, URLs y enlaces externos, HTML dinámico, dependencias, cookies o variables de entorno | `docs/guias/seguridad.md` |
| Interfaz: colores, formularios, diálogos, navegación, imágenes, animaciones o textos | `docs/guias/accesibilidad.md` y `DESIGN.md` (sistema de diseño; si chocan, manda la guía) |
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
6. Cierre documental: `docs/09-estado-actual-y-deuda-tecnica.md` con la fecha de hoy en "Última actualización" y `npm run docs:gate` en verde **antes del commit**. Si se toca `plugins/`, ejecuta también `npm run agentes:test`; si se toca un área de contrato (`areasContrato` de `.claude/flujo.json`), hace falta un aviso `docs/specs/*-aviso-pr.md` y cambiar `docs/integracion/` o escribir en el aviso `Integración: sin impacto — <motivo>`.
7. La CI (`.github/workflows/ci.yml`) ejecuta esos mismos cinco comandos en cada PR (más `npm run agentes:test`; `docs:gate` es local), y la PR usa la plantilla de `.github/pull_request_template.md`: rellénala.

## Reglas de trabajo

- Los fallos se corrigen con TDD: primero un test que falle **por el motivo correcto**, después el cambio mínimo.
- Las llamadas HTTP van por `src/services/api.js`; los textos por `t()`, con la clave en `es` y `en`; los recursos de S3 se declaran en `src/config/assets.js`.
- No guardes secretos en `.env.example` ni en la documentación.
- Al crear archivos con barras invertidas (expresiones regulares), usa el editor, no `cat <<EOF`.
- No hagas commit ni push sin que te lo pidan.
