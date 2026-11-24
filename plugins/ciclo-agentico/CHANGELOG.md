# Cambios

## 0.1.4

Modo ub opcional y retirada de Octopus. Contiene:

- **Sin Octopus**: se quita de `dependencias.json`; el campo `consultor` desaparece de `flujo.json`, de la plantilla y de `/ciclo-init` (el validador pide quitarlo si aparece); la segunda opinión usa siempre `superpowers:requesting-code-review`. La lógica genérica de `plataformas` de `bootstrap-agentes` se mantiene.
- **`llm-council` afinada**: su `description` solo la activa bajo petición (sin los disparadores automáticos del original) y `/ciclo` la nombra, igual que `ub-mode`, con el prefijo `ciclo-agentico:`.

- **Skill `ub-mode`**: texto original de https://github.com/unclebob/ub-mode (Robert C. Martin, licencia MIT, con su `LICENSE` junto a la skill) más una sección propia de uso dentro de `/ciclo`: sin commit ni push, sin instalar herramientas externas sin aprobación.
- **`/ciclo`**: regla nueva «Modo ub»: solo bajo petición del usuario; en el paso 3 el orquestador pasa al `developer` la ruta de la skill y lo dice en la puerta.

## 0.1.3

Consejo opcional. Contiene:

- **Skill `llm-council`**: cinco asesores en paralelo, revisión anónima entre ellos y veredicto del presidente (método de Karpathy; texto original de https://github.com/aiwithremy/claude-skills-llm-council, sin licencia declarada: por confirmar), más una sección propia de uso dentro de `/ciclo`.
- **`/ciclo`**: regla nueva «Consejo»: solo bajo petición, se ofrece en la puerta del paso 2 cuando el plan trae alternativas reales, solo informa y su veredicto va en la línea Segunda opinión.


## 0.1.2

Specs por mes y retención. Contiene:

- **Rutas por mes**: spec, plan y aviso para PR van en `<specsDir>/AAAA-MM/`; la plantilla de `avisoPR` pasa a `docs/specs/**-aviso-pr.md`.
- **Retención de specs**: política en el README (sección «Retención de specs») y punto 7 nuevo del paso 0 de `/ciclo`, que pregunta y borra en el árbol de trabajo, sin `git rm`.
- **`docs-gate`**: un aviso borrado (`borrados`) no cuenta como aviso para PR.
- **`refresh-estado`**: lista `specsDir` en recursivo e informa de los candidatos a depurar.

## 0.1.1

Enrutado de modelos por rol. Contiene:

- **Modelo y esfuerzo por rol**: cada agente fija `model` y `effort` en su frontmatter: `requirements`, `developer` y `tester-documentador` con sonnet y medium; `architect` con opus y high. Las llamadas a los roles desde `/ciclo` no pasan `model` ni `effort`.
- **Segunda opinión y revisión por escalado**: se piden con `model` opus y `effort` high en la propia llamada, no en un archivo.
- **Regla de fallo repetido** en `/ciclo`: si el `developer` falla lo mismo en dos vueltas consecutivas, se pide una revisión (que cuenta como vuelta y solo informa) antes de relanzarlo; si vuelve a fallar, se escala al usuario.
- **Aviso del paso 0** de `/ciclo` cuando `CLAUDE_CODE_SUBAGENT_MODEL` o `CLAUDE_CODE_EFFORT_LEVEL` están definidas y anulan la tabla; solo imprime el nombre, nunca el valor.
- **Pruebas nuevas** (`tests/modelos.test.mjs`) sobre los valores por rol, los nombres de campo y las reglas de `/ciclo`.
- Idea y tabla inspiradas en https://github.com/donimas/ai-routing (MIT), sin copiar sus plantillas, su hook ni su configuración.

## 0.1.0

Primera versión. Contiene:

- **Cuatro roles** (`agents/`): `requirements`, `architect`, `developer` y `tester-documentador`, cada uno con sus límites, su entrega y las particularidades de su contrato de salida.
- **Comandos**: `/ciclo` (orquesta los cuatro roles con puerta humana entre fases, tope de vueltas y sin commits) y `/ciclo-init` (crea o valida `.claude/flujo.json`, fusiona los permisos y añade la sección de `CLAUDE.md`).
- **Skills**: `refresh-estado` (resumen de solo lectura del paso 0) y `principios` (normas comunes y contrato de salida común que precargan los roles).
- **Scripts**: `docs-gate` (cierre documental contra `flujo.json`, incluida la exigencia de integración o de la línea `Integración: sin impacto — <motivo>` cuando se toca un área de contrato) y `bootstrap-agentes` (comprueba e instala con confirmación las dependencias, leyendo `claude plugin list --json`, y los plugins del marketplace local que declare el campo opcional `marketplaceLocal` según sus tags `perfil:<x>`).
- **Plantillas** (`templates/`): `flujo.json`, `settings-snippet.json`, `CLAUDE-seccion.md`, `spec.md` y `plan.md`.
- **Catálogo de dependencias** (`.claude-plugin/dependencias.json`), con versión revisada cuando se conoce, y manifiesto `plugin.json` (sin marketplace propio: lo aporta el repositorio que aloja el plugin).
