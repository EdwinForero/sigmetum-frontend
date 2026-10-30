# Plugins locales (marketplace `locales-front`)

Esta carpeta es un marketplace local de Claude Code: `.claude-plugin/marketplace.json` declara, con el nombre `locales-front`, los plugins que viven aquí. Hay dos: el núcleo portable `ciclo-agentico` (perfil `base`), copiado tal cual del repositorio `sigmetum-backend`, y `dominio-frontend` (perfil `frontend`), propio de este repositorio. Es el **único** documento que dice qué plugins hay y dónde están; el resto de la documentación enlaza aquí.

Las normas del proyecto y su motivo están en las guías (las `guias` de `.claude/flujo.json`); el ciclo las aplica, no las sustituye.

## Plugins y skills

| Plugin | Perfil (tag) | Skills | Cuándo se usa |
|---|---|---|---|
| [`ciclo-agentico`](ciclo-agentico/README.md) | `base` | `principios`, `refresh-estado` (más los comandos `/ciclo` y `/ciclo-init` y los cuatro roles) | Núcleo portable del flujo agéntico: toda feature o fix con agentes |
| `dominio-frontend` | `frontend` | `design-taste-frontend` (taste skill, con su licencia) | Portada, landing pages y rediseños: no es para tablas de datos ni formularios de producto |

**Reparto de responsabilidades.** `ciclo-agentico` es el módulo exportable: no se personaliza para este repositorio, así que no se edita aquí (ver [Tras cambiar un plugin local](#tras-cambiar-un-plugin-local)). Lo propio de este repositorio va en `dominio-frontend` y en categorías nuevas ([Añadir una categoría nueva](#añadir-una-categoría-nueva)), y los plugins externos se declaran en `.claude/settings.json`. **No se dejan skills sueltas en `.claude/skills/`**: toda skill vive en un plugin.

## Plugins externos del proyecto

Se declaran en `.claude/settings.json` (marketplaces y `enabledPlugins`), así que Claude Code ofrece instalarlos al confiar en la carpeta:

| Plugin | Para qué |
|---|---|
| `superpowers@superpowers-marketplace` | Flujo de trabajo: planificación, TDD, depuración y verificación. Es el que fija el catálogo de `ciclo-agentico`; sustituye al de `claude-plugins-official` |
| `i-have-adhd@i-have-adhd` | Estilo de salida del ciclo (`estilo` de `.claude/flujo.json`) |
| `ui-ux-pro-max@ui-ux-pro-max-skill` | Diseño de interfaz, accesibilidad, paletas y estilos |
| `frontend-design`, `playwright` (`claude-plugins-official`), `understand-anything`, `humanizer` | Ya estaban habilitados; se mantienen |

`awesome-design-md` **no es un plugin**: es un repositorio de ficheros `DESIGN.md` (sistemas de diseño de marcas) que se copian a mano al proyecto. Aquí se adaptó el de Mintlify (licencia MIT del repositorio) como estructura: [DESIGN.md](../DESIGN.md), en la raíz, con los valores de este repositorio y no los de Mintlify.

## Cómo se activan

Cada entrada del marketplace lleva un tag `perfil:<x>`. Los `perfiles` de `.claude/flujo.json` (aquí, `base` y `frontend`) deciden qué plugins aplican al proyecto, y `marketplaceLocal` apunta a esta carpeta (`"plugins"`). Con eso, `npm run agentes:bootstrap` (o `-- --dry-run` para solo informar) lista los plugins locales que faltan, marcados con `[local]`, y, si se confirma, ejecuta una vez `claude plugin marketplace add ./plugins` y `claude plugin install <plugin>@locales-front` por cada uno. A mano es lo mismo:

```
claude plugin marketplace add ./plugins
claude plugin install dominio-frontend@locales-front
claude plugin install ciclo-agentico@locales-front   # solo si no tienes ya ciclo-agentico@locales
```

Después, reinicia la sesión de Claude Code y lanza `/ciclo-init` para validar `.claude/flujo.json`. Puede que Claude Code exija el prefijo del plugin (`/ciclo-agentico:ciclo-init`, `/ciclo-agentico:ciclo`) **(por confirmar)**.

**(Por confirmar en este repositorio)** que `claude plugin marketplace add ./plugins` funciona en este equipo. En el backend se verificó el 28/10/2026 en Windows: Claude Code guarda el origen como directorio con **ruta absoluta**, así que el marketplace queda registrado por equipo y cada equipo nuevo debe ejecutarlo una vez.

Un marketplace se identifica por su nombre y se registra por equipo. Este se llama `locales-front` para no chocar con el marketplace `locales` del repositorio `sigmetum-backend`, que en un equipo con los dos repositorios apunta a la carpeta del backend. Como el núcleo `ciclo-agentico` es idéntico en ambos, no hace falta instalarlo dos veces: si el equipo ya tiene `ciclo-agentico@locales` (del backend), ese ya sirve aquí. En ese caso, a la pregunta de `npm run agentes:bootstrap` sobre `ciclo-agentico@locales-front`, responde que no (si no, quedarían dos copias activas con los mismos comandos). Un equipo sin el backend instala `ciclo-agentico@locales-front`. Qué copia se instala solo importa si difieren, y entonces hay que sincronizarlas **(por confirmar: cómo se comporta Claude Code con dos plugins del mismo nombre en marketplaces distintos)**.

Si editas un plugin que ya está instalado, lee [Tras cambiar un plugin local](#tras-cambiar-un-plugin-local).

## Tras cambiar un plugin local

Claude Code ejecuta los comandos, agentes y skills de un plugin instalado desde su copia en la caché (`~/.claude/plugins/cache`), no desde esta carpeta: un cambio aquí no llega a la sesión hasta que se actualiza el plugin.

1. Si el cambio altera el comportamiento, sube `version` en el `.claude-plugin/plugin.json` del plugin y añade la entrada en `ciclo-agentico/CHANGELOG.md` (y ajusta la versión que fija `ciclo-agentico/tests/manifiestos.test.mjs`).
2. Actualiza o reinstala el plugin: `claude plugin marketplace update locales-front` y después `claude plugin update ciclo-agentico@locales-front`, o `claude plugin uninstall ciclo-agentico@locales-front` y `claude plugin install ciclo-agentico@locales-front` **(por confirmar: que `update` recoja los cambios de un marketplace local sin subir la versión)**.
3. Reinicia la sesión de Claude Code para que cargue la copia nueva.

Los scripts que se ejecutan como entradas de `verificacion` de `.claude/flujo.json` (por ejemplo, `npm run docs:gate`, que llama a `plugins/ciclo-agentico/scripts/docs-gate.mjs`) usan la copia del repositorio, así que ven el cambio sin reinstalar nada.

Como `ciclo-agentico` es una copia del backend, un cambio en el núcleo debe hacerse en los dos repositorios para que no diverjan **(por confirmar: no hay mecanismo que lo vigile)**.

## Añadir una categoría nueva

1. Crea `plugins/<nombre>/` con `.claude-plugin/plugin.json` (`name`, `version`, `description`, `author`) y `skills/<nombre>/SKILL.md` (con `name` igual a la carpeta y una `description` que diga cuándo usarla). Las skills no pueden ir anidadas en subcarpetas de `skills/`: la categoría es el plugin.
2. Añade su entrada a `.claude-plugin/marketplace.json` con `source: "./<nombre>"` y un tag `perfil:<x>`. No añadas campos que el validador no conozca.
3. Añade el perfil a `perfiles` y la carpeta `skills/` a `skillsProyecto` en `.claude/flujo.json`.
4. Añade la fila a la tabla de este documento.
5. Comprueba con `claude plugin validate plugins --strict` y `npm run agentes:test`.
