# Mantenimiento de la documentación

Este documento dice **qué hay que revisar y actualizar en `docs/` después de cada feature o fix**. Es la regla de trabajo del repositorio: Claude Code la sigue a través de [CLAUDE.md](../../CLAUDE.md), y las personas, con la lista de la PR.

## 1. La regla

1. **La documentación se actualiza en el mismo commit (o la misma PR) que el cambio.** Un cambio no está terminado hasta que pasa la lista de este documento.
2. **Se contrasta con el código, nunca de memoria.** Si no puedes comprobar algo, márcalo como **(por confirmar)**.
3. **Cada dato vive en un solo sitio.** Los demás documentos enlazan, no copian. Las cifras (archivos, componentes, tests, claves) viven solo en [09](../09-estado-actual-y-deuda-tecnica.md#métricas).
4. **Antes de dar el trabajo por terminado:** `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check` en verde. Son los cinco de la definición de terminado de [buenas-practicas-frontend.md](buenas-practicas-frontend.md#1-definición-de-terminado).
5. **Las guías de esta carpeta mandan.** Si lo que te piden contradice una guía (buenas prácticas, seguridad o accesibilidad), se avisa y se pregunta antes de hacerlo.

## 2. Qué documento tocar según el cambio

| Si cambias... | Actualiza | Comprueba |
|---|---|---|
| Una **página** o **ruta** | [01](../01-arquitectura.md) (tabla de rutas), [04](../04-paginas.md) | La ruta es pública o protegida; `Navbar`/`Footer` si aparece en el menú |
| Un **componente** nuevo o su comportamiento | [05](../05-componentes.md) | Props, estado, métodos y en qué grupo va |
| **Estado global** de `App.js` o el flujo de datos | [01](../01-arquitectura.md), [04](../04-paginas.md) (sección `App`) | Los diagramas de secuencia siguen siendo ciertos |
| `services/api.js` o **un endpoint** que consumes | [03](../03-api.md) y [integracion/para-backend.md](../integracion/para-backend.md) (secciones 2 y 7) | Campos que lee el frontend, método, ruta y quién lo llama |
| Una **variable `VITE_*`** | `.env.example`, [06](../06-utilidades-hooks-config.md), [08](../08-guia-desarrollo.md) y [integracion/para-infra.md](../integracion/para-infra.md) (sección 3) | Valor por entorno (dev, prod) |
| Un **recurso de `config/assets.js`** | [06](../06-utilidades-hooks-config.md) y [integracion/para-infra.md](../integracion/para-infra.md) (sección 5) | La ruta existe en el bucket |
| Una **utilidad**, **hook** o servicio | [06](../06-utilidades-hooks-config.md) | Entradas, salidas y ejemplo |
| **Traducciones** | [07](../07-i18n-y-estilos.md) | Claves en `es` y `en`; `npm test` comprueba la paridad |
| **Colores, tipografías o animaciones** | [07](../07-i18n-y-estilos.md) | Contraste de los colores nuevos (WCAG AA) |
| Una **dependencia**, la versión de Node o la herramienta de build | [02](../02-tecnologias.md), [08](../08-guia-desarrollo.md) y, si afecta al build, [integracion/para-infra.md](../integracion/para-infra.md) (secciones 2 y 3) | Que el requisito de Node sigue siendo válido para Amplify y para el backend |
| Un **script** de `package.json` | [08](../08-guia-desarrollo.md) (tabla de scripts) | |
| **ESLint**: una regla nueva o relajada, o el tope de avisos (`--max-warnings`) | [buenas-practicas-frontend.md](buenas-practicas-frontend.md#14-eslint-y-el-tope-de-avisos) y [02](../02-tecnologias.md) | Si corregiste avisos, el tope baja al número real (`npm run quality` lo exige) |
| Una **vulnerabilidad aceptada** (`ACCEPTED_ADVISORIES`) o una **deuda conocida** de `quality-check.mjs` | [seguridad.md](seguridad.md) (regla S6 y estado actual) y [09](../09-estado-actual-y-deuda-tecnica.md) | Motivo por escrito |
| Algo de **seguridad**: sesión, cookies, cabeceras, privacidad, subida de archivos | [seguridad.md](seguridad.md) (regla y estado) y [09](../09-estado-actual-y-deuda-tecnica.md) | Lista de comprobación de la PR |
| Algo de **accesibilidad**: contraste, teclado, diálogos, idioma, foco | [accesibilidad.md](accesibilidad.md) (regla y estado) y [07](../07-i18n-y-estilos.md) si cambia la paleta | Recalcular el contraste |
| Un **test** nuevo | [08](../08-guia-desarrollo.md) (tabla de cobertura) | Sale de "Pendiente" si estaba allí |
| Un **fallo corregido** | [09](../09-estado-actual-y-deuda-tecnica.md): pasa el hallazgo a "Resueltos" con su commit | Quítalo también de `integracion/` si estaba allí |
| Una **deuda o discrepancia nueva** | [09](../09-estado-actual-y-deuda-tecnica.md) y, si afecta al backend o la infra, `integracion/` | Id, prioridad, archivo y qué hay que hacer |
| Algo que **cambia el contrato con el backend** (forma de una respuesta, columnas del Excel, autenticación) | [integracion/para-backend.md](../integracion/para-backend.md) y avisar al backend (sección 6 de este documento) | |
| Algo que **cambia lo que necesita la infraestructura** (build, variables, dominios, recursos estáticos) | [integracion/para-infra.md](../integracion/para-infra.md) y avisar a infra (sección 6) | |
| Los **plugins o skills de Claude** | `.claude/` y la tabla de herramientas de [08](../08-guia-desarrollo.md) | |
| Los **documentos** o **guías** (nuevos, renombrados o movidos) | Índice de [README.md](../README.md), el README de la raíz y [CLAUDE.md](../../CLAUDE.md) | `npm run docs:check` valida los enlaces y que cada guía figure en el índice |

## 3. Listas de comprobación por tipo de cambio

### Feature nueva

- [ ] Pasan `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check`.
- [ ] Cumple las guías de [buenas prácticas](buenas-practicas-frontend.md), y de [seguridad](seguridad.md) y [accesibilidad](accesibilidad.md) si toca sesión, formularios, URLs, dependencias o interfaz.
- [ ] Páginas, componentes y rutas nuevos están en 01, 04 y 05.
- [ ] Si llama a un endpoint, está en 03 y en `integracion/para-backend.md`.
- [ ] Si necesita una variable o un recurso nuevo, está en `.env.example`, 06, 08 y `integracion/para-infra.md`.
- [ ] Los textos nuevos están en `es` y `en`.
- [ ] Los tests nuevos figuran en la tabla de cobertura de 08.
- [ ] Si cierra una deuda, está en "Resueltos" de 09. Si deja una nueva, está anotada.

### Corrección de un fallo

- [ ] Hay un test que **fallaba antes** del arreglo y pasa después.
- [ ] El hallazgo pasa a "Resueltos" en 09 con el hash del commit y una línea sobre la causa.
- [ ] Si describía un comportamiento erróneo en otro documento (por ejemplo "**Error:** ..."), se reescribe en presente y sin el aviso.
- [ ] Si el fallo estaba en `integracion/`, se quita de la tabla de discrepancias.

### Dependencia, herramienta o versión de Node

- [ ] 02 (tabla con versión y uso) y 08 (requisitos y scripts).
- [ ] Si toca el build o Node: `integracion/para-infra.md` (sección 2).
- [ ] Se comprueba que los tests siguen funcionando con la versión de Node del backend y de Amplify.
- [ ] Se ejecuta `npm audit` (lo hace `npm run quality`) y se anota cualquier excepción en [seguridad.md](seguridad.md).

### Refactor sin cambio de comportamiento

- [ ] Se actualizan los nombres y las rutas de archivo que cambien en 04, 05 y 06.
- [ ] No se toca el contrato con el backend; si hay que tocarlo, deja de ser un refactor.

### Cambio que afecta al backend o a la infraestructura

- [ ] Se actualiza el documento de `integracion/` correspondiente.
- [ ] Se avisa (sección 6).
- [ ] Las discrepancias resueltas se pasan a una línea en el historial de 09.

### Antes de fusionar la rama

- [ ] Se vuelve a ejecutar la comprobación de métricas: `npm run docs:check -- --metrics`, y se actualiza la tabla de 09 si cambió alguna cifra.
- [ ] La fecha y el commit del encabezado de 09 y de [README.md](../README.md) son los de la fusión.
- [ ] No quedan menciones a cosas que ya no existen (búsqueda de términos obsoletos, sección 4).

## 4. Validación

### Lo que comprueba `npm run docs:check`

El script ([scripts/docs-check.mjs](../../scripts/docs-check.mjs)) compara el código con la documentación y **falla con código de salida 1** si algo no coincide:

| Comprobación | Código | Documento |
|---|---|---|
| Enlaces y anclas internos | Todos los `.md` | Los propios `.md` |
| Rutas | `<Route path>` de `App.js` | 01 |
| Páginas | `src/pages/*.js` | 04 (una sección por página) |
| Componentes | `src/components/*.js` | 05 (una sección por componente) |
| Utilidades, hooks, servicios y config | `src/utilities`, `hooks`, `services`, `config` | 06 |
| Endpoints | Llamadas a `api.*` y `fetch` con `API_PREFIX` | 03 |
| Variables de entorno | `.env.example` | 06, 08 y `integracion/para-infra.md` |
| Recursos de S3 | `config/assets.js` | `integracion/para-infra.md` |
| Dependencias | `package.json` | 02 |
| Scripts | `package.json` | 08 |
| Tests | `src/**/*.test.js` | Tabla de cobertura de 08 |
| Guías | `docs/guias/*.md` | Deben figurar en el índice de `docs/README.md` y en `CLAUDE.md` |
| Métricas | Recuento real de páginas, componentes, tests y claves | Tabla de 09, que debe ser la **única** con cifras |

`npm run docs:check -- --metrics` imprime los valores reales para actualizar 09.

Por su parte, `npm run quality` ([scripts/quality-check.mjs](../../scripts/quality-check.mjs)) es la puerta de seguridad y calidad: patrones prohibidos, secretos, `npm audit` de producción y ESLint. Además exige que el tope `--max-warnings` de `package.json` coincida con los avisos reales, para que la deuda que se paga no se vuelva a acumular.

Además, `npm test` incluye `translations.test.js`: comprueba que español e inglés tienen las mismas claves y marcadores de interpolación.

### Lo que el script **no** puede comprobar

Esto es revisión manual, y por eso está en las listas de la sección 3:

| Qué | Cómo |
|---|---|
| Que lo descrito **es cierto** (props, flujos, comportamientos) | Leer el código que cambió y el párrafo que lo describe |
| Que las **discrepancias** con el backend y la infra siguen vigentes | Revisar el código del otro repositorio antes de afirmarlo |
| Que los diagramas siguen siendo correctos | Releerlos tras un cambio de flujo |
| **Términos obsoletos** | Buscar en `docs/`: `REACT_APP`, `react-scripts`, `Create React App`, `eu-west-3`, `framer-motion`. Solo deben aparecer en notas históricas o de migración |
| Contraste de colores nuevos | Calcular la relación con el fondo (mínimo 4,5:1 en texto normal) |
| El **número de tests** | Sale de `npm test` |

## 5. Hallazgos y deuda técnica

Se registran en [09](../09-estado-actual-y-deuda-tecnica.md).

| Prefijo | Significado |
|---|---|
| **A** | Error funcional grave del frontend |
| **M** | Mantenibilidad, seguridad o robustez (prioridad media) |
| **B** | Accesibilidad, calidad y detalles (prioridad baja) |
| **D** | Discrepancia frente al **backend** (detalle en `integracion/para-backend.md`) |
| **I** | Problema frente a la **infraestructura** (detalle en `integracion/para-infra.md`) |

Ciclo de vida de un hallazgo:

1. **Se anota** con id, descripción, ubicación (`archivo:línea`) y qué hay que hacer.
2. **Se resuelve** con un commit que incluye su test.
3. **Pasa a "Resueltos"** en 09 con el hash del commit. No se borra: el historial explica por qué el código es como es.

Los ids no se reutilizan. Si un hallazgo se descarta, se queda con una nota ("No procede: motivo").

## 6. Avisar al backend y a la infraestructura

`integracion/para-backend.md` y `integracion/para-infra.md` son la fuente de verdad de **lo que espera el frontend**. Cada repositorio tiene un `INTEGRACION.md` que apunta a ellos.

- **Cambias algo que afecta al otro lado:** actualiza el documento de `integracion/` **y** deja constancia en la PR (qué cambia y qué debe hacer el otro equipo).
- **El otro repositorio cambia algo:** revisa la sección "Si cambias algo" del documento de `integracion/` y actualiza el frontend y este documento.
- **Discrepancia resuelta en el otro repositorio:** pásala de la tabla de discrepancias a una línea en el historial de 09 y verifica el cambio contra su código.

## 7. Estilo

- **Idioma:** español. El código y los mensajes de commit, en inglés.
- **Formato:** tablas para datos comparables, listas para pasos, diagramas de `mermaid` para flujos.
- **Certeza:** marca **(verificado)** lo comprobado contra el código y **(por confirmar)** lo deducido.
- **Enlaces:** a archivos con ruta relativa (`[05](../05-componentes.md#speciescard)`). No copies contenido que ya existe en otro documento.
- **Código:** cita `archivo:línea` solo cuando ayuda a localizar un fallo; los números de línea envejecen.
- **Sin secretos:** nunca valores de `.env`, tokens ni contraseñas. Solo nombres de variables.
- **Fechas:** absolutas (`30/09/2026`), no relativas.

## 8. Plantilla para la PR

```markdown
## Documentación
- [ ] `npm test`, `npm run build` y `npm run docs:check` en verde
- [ ] Documentos actualizados: (lista)
- [ ] Afecta al backend o a la infra: sí / no. Si sí, qué tienen que hacer
- [ ] Hallazgos resueltos o nuevos en 09: (ids)
```

## 9. Mantener este documento

- Se actualiza cuando aparece un tipo de cambio que no está en la tabla de la sección 2.
- Si una comprobación manual de la sección 4 se puede automatizar, se añade a `scripts/docs-check.mjs` y se mueve a la primera tabla.
- El script y este documento se revisan juntos: que un documento figure en la tabla 2 y no tenga comprobación automática es aceptable, pero debe ser una decisión consciente.
