# B3 y B4: etiquetas asociadas y envío con Enter en el login: plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-b1-b3-b4-accesibilidad-formularios-iconos-design.md` (solo B3 y B4; se ignora "Siguiente ciclo: B1")

## Notas de la segunda opinión (aprobadas, obligatorias)

1. **Corrección del paso 5 (lint):** la premisa del plan es falsa. `jsx-a11y/label-has-associated-control` hoy NO emite avisos en `LoginForm.js` ni en `ContactForm.js`. Los avisos reales de esas labels son `jsx-a11y/label-has-for` (exige anidar el input Y el `id`) y `control-has-associated-label` sobre los inputs. Con solo `htmlFor`/`id` (sin anidar) **no se espera que el total baje de su valor actual**. El developer mide antes y después; el criterio es que el total NO suba. `--max-warnings` solo cambia si el número real medido cambia. Anidar el input dentro del label queda descartado (cambia el marcado).
2. Añadir `expect(api.post).toHaveBeenCalledTimes(1)` también a los tests existentes de clic de `LoginForm` (que pulsan el `<span>` interior) o al test nuevo equivalente.
3. En el test de `defaultPrevented`, el `expect(notPrevented).toBe(false)` va antes de cualquier `await` y sin `await` previos; después `await screen.findByRole('alert')` para asentar el estado.
4. Los tests no usan `querySelector('#...')` con ids de `useId` (los dos puntos necesitan escapado); basta `getByLabelText`, `getAllByRole` y `.id`. Solo `container.querySelector('form')` para `fireEvent.submit`.
5. El informe del developer dice explícitamente que el clic único por rol ya pasa hoy y es red de seguridad, no un test rojo.
6. Dejar el plan, spec y aviso sin recuentos tipo "N avisos/tests" fuera de `docs/09`.

Crítico: sí. Coincide con "sesión y token (services/api.js, LoginForm, ProtectedRoute)" (se toca `LoginForm`, aunque no su lógica de token) y con "accesibilidad".

## Decisiones (lo que el developer no debe decidir)

- **React 18.3.1** (`package.json`): `useId` está disponible. Cada componente llama `const id = useId();` una vez y deriva `${id}-user`, `${id}-password`, etc. El id sale del hook: estable entre renders y único entre instancias. Se descartan ids literales (`id="username"`): chocan con dos instancias. `useId` devuelve `:r0:`, válido en `id`/`htmlFor`; Testing Library lo resuelve.
- **Contraseña:** el `<input>` es el mismo elemento y solo cambia `type`. Con `id={`${id}-password`}` fijo, el id no cambia al alternar.
- **No se toca `ButtonPrincipal`.** El `<button>` no lleva `type` (es `submit` dentro de un form); `onClick={toggleDropdown}` llama a `onClick()` solo si no hay `dropdownOptions` y sí hay `onClick`; no recibe el evento ni hace `preventDefault`/`stopPropagation`. Sin `onClick` en la prop, `toggleDropdown` es un no-op y solo actúa el submit nativo. **Sin doble envío:** se quita `onClick={handleLogin}` y el envío ocurre solo por `onSubmit`. No se añade `type` (rompería `ContactForm`, que depende del submit nativo).
- **`handleLogin` no cambia** (ni firma ni cuerpo): no recibe el evento. El form lleva `onSubmit={(e) => { e.preventDefault(); handleLogin(); }}`, un manejador en línea. Se descarta pasar `e` a `handleLogin` (tocaría su firma).
- **Layout:** el `<form>` es `flex flex-col` sin padding y el `div.flex.justify-center.px-4` ocupa todo el ancho. Mover solo ese div dentro del form, después del bloque del error y sin cambiar sus clases, conserva el layout. Orden DOM: campos, error, botón.
- **Enter:** hoy el form no tiene botón `submit` (el de mostrar contraseña es `type="button"`), así que el envío implícito no se produce. Con el botón dentro, Enter dispara el click del submit y luego el `submit`, una sola vez.
- **`TextInput` y `FilterSearchBar` no se tocan.**

## Fase 1

1. **Tests de `LoginForm` en rojo**
   - Archivo: `src/components/LoginForm.test.js` (modificar; los tests existentes no se cambian). `renderLogin` pasa a devolver el resultado de `render(...)` (para usar `container`).
   - Tests nuevos:
     - `getByLabelText('login.userLable')` es el input `type=text`; `getByLabelText('login.passwordLable')` es el de contraseña con `type=password`. Tras `user.click(getByText('login.passwordShowButton'))`, el mismo elemento (misma referencia e `id` igual) pasa a `type=text` y sigue encontrándose por la etiqueta.
     - Con `api.post.mockResolvedValue({ token: 'jwt-123' })`, `await user.type(getByLabelText('login.userLable'), 'ana{Enter}')` da `expect(api.post).toHaveBeenCalledTimes(1)` y `toHaveBeenCalledWith('/log', { username: 'ana', password: '' })`. Variante con Enter en el campo de contraseña.
     - Clic por rol: `getByRole('button', { name: 'login.logInButton' })`; `closest('form')` no nulo, `type === 'submit'` y, tras `user.click`, `api.post` llamado una sola vez.
     - `defaultPrevented`: `const notPrevented = fireEvent.submit(container.querySelector('form'))` y `expect(notPrevented).toBe(false)`. Usar `mockRejectedValue(httpError(401))` y `await screen.findByRole('alert')` para asentar el estado.
     - Ids únicos: dos `<LoginForm />` en un `MemoryRouter`; los `id` de los cuatro inputs son distintos.
   - Comprobación: `npx vitest run src/components/LoginForm.test.js`. Deben fallar por el motivo correcto: los `getByLabelText` lanzan "no label associated"; el de Enter ve `api.post` sin llamadas (el botón está fuera del form); `closest('form')` es null; `fireEvent.submit` devuelve `true` (no hay `onSubmit`). El clic único por rol ya pasa hoy (una llamada por `onClick`): es red de seguridad contra el doble envío, no un test rojo; el developer lo dice en el informe. Los tests viejos siguen en verde. Un fallo de montaje o de import no vale como rojo.
   - Norma: `docs/guias/accesibilidad.md` A4/A5; `buenas-practicas-frontend.md` (TDD).

2. **Cambiar `LoginForm.js`**
   - Archivo: `src/components/LoginForm.js`. Importar `useId` de `react`; `const id = useId();`. `<label htmlFor={`${id}-user`}>` con `<input id={`${id}-user`}>`, e igual con `${id}-password`. Sin cambiar clases, `placeholder` ni textos. `<form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>`. Mover `<div className="flex justify-center px-4"><ButtonPrincipal text={t('login.logInButton')} /></div>` dentro del `<form>`, tras el bloque del error, quitando `onClick={handleLogin}`. `handleLogin`, el token, `navigate`, las claves 429/401 y `role="alert"` quedan idénticos.
   - Comprobación: `npx vitest run src/components/LoginForm.test.js` en verde (nuevos y viejos); `git diff` solo muestra esos cambios. Comprobación visual: **(por confirmar)**.
   - Norma: `docs/guias/seguridad.md` (el token sigue tocándose solo en `LoginForm`, sin cambios); `accesibilidad.md` A5; CLAUDE.md (no tocar `services/api.js`).

3. **Tests de `ContactForm` en rojo**
   - Archivo: `src/components/ContactForm.test.js` (modificar; los existentes no se cambian y siguen con `getByPlaceholderText`).
   - Tests nuevos: (1) `getByLabelText` para `home.contactForm.nameLabel`, `emailPlaceholder`, `subjectPlaceholder` y `messagePlaceholder`; cada uno devuelve el campo esperado (`type=text`, `type=email`, `type=text` y el `<textarea>` con `tagName === 'TEXTAREA'`). (2) Dos `<ContactForm onLoad={vi.fn()} />` en el mismo `render`: todos los `id` son distintos.
   - Comprobación: `npx vitest run src/components/ContactForm.test.js`. Rojo hoy por "no label associated" y por ids vacíos o duplicados; los tests viejos en verde.
   - Norma: `accesibilidad.md` A4/A5.

4. **Cambiar `ContactForm.js`**
   - Archivo: `src/components/ContactForm.js`. Importar `useId`; `const id = useId();`. Las cuatro `label` con `htmlFor` y su campo con `id` (`${id}-name`, `-email`, `-subject`, `-message`, incluido el `<textarea>`). Sin tocar clases, `placeholder`, `maxLength`, `handleSubmit`, el botón ni su `disabled`.
   - Comprobación: `npx vitest run src/components/ContactForm.test.js` en verde (429, 400 y 500 siguen pasando; el botón sigue enviando por submit nativo).
   - Norma: `accesibilidad.md` A5.

5. **Lint y tope de avisos**
   - Archivo: `package.json` (solo `--max-warnings`, si el recuento baja).
   - Comprobación: `npm run lint` antes de empezar (anotar los avisos de `LoginForm.js` y `ContactForm.js`) y al terminar. Se espera que `jsx-a11y/label-has-associated-control` (activa hoy sobre las `<label>` sin `htmlFor`) desaparezca. **No se ha podido ejecutar**: el developer debe medirlo, no asumirlo. Fijar `--max-warnings` al número real que imprime ESLint (hoy 62). Si sube, no se da por bueno. Luego `npm test`, `npm run build`, `npm run quality`, `npm run docs:check`.
   - Norma: `buenas-practicas-frontend.md` (el tope no puede crecer); `docs/guias/mantenimiento.md`. `package.json` es `areasContrato`, pero el aviso de PR ya es obligatorio por `LoginForm.js`.

## A cargo del tester-documentador

- `docs/09-estado-actual-y-deuda-tecnica.md`: B3 y B4 a "Resueltos", commit **(por confirmar)**; B1 sigue pendiente; nota (observación) de que `TextInput` y `FilterSearchBar` (`<label>` envolvente sin texto, nombre solo por `placeholder`) quedan pendientes de B3; reflejar B16 y la hoja de ruta de accesibilidad; fila de historial del 30/10/2026 y "Última actualización: 30/10/2026"; cifras con `npm run docs:check -- --metrics`, incluida la línea del linter si baja `--max-warnings`; en las filas M15 y M9 sustituir "(por confirmar)" por `ca0840d` (la fila M9 menciona el tope: revisar coherencia).
- `docs/05-componentes.md`: `LoginForm` (envío por `submit`, botón dentro del `<form>`, etiquetas asociadas con `useId`) y `ContactForm` (etiquetas asociadas), contrastado con el código.
- `docs/08-guia-desarrollo.md`: cobertura de los tests nuevos (consultas por etiqueta y por rol, Enter, sin doble envío, ids únicos), sin recuentos; el tope de lint en la descripción del script si cambia.
- `docs/guias/accesibilidad.md` (A4/A5): actualizar el "Estado" de `LoginForm` y `ContactForm` solo en etiqueta asociada y Enter; siguen pendientes `aria-describedby`, `TextInput`/`FilterSearchBar` y los botones de icono (B1).
- `docs/07-i18n-y-estilos.md`: sin cambios (no hay claves nuevas). `docs/02-tecnologias.md`: solo si menciona el tope de avisos.
- Aviso de PR `docs/specs/2026-10-30-b3-b4-aviso-pr.md` con `Integración: sin impacto — la petición POST /log (método, ruta y cuerpo) y el tratamiento de 429 y 401 no cambian; solo cambia cómo se dispara el envío en el navegador`. Mencionar el posible cambio de `--max-warnings`. Marcar **(por confirmar)** el lector de pantalla (NVDA) y la comprobación visual.
- Advertencias: `docs:check` rechaza recuentos tipo "N tests", "N claves" o "N casos" fuera de `docs/09`, también en specs y en el aviso. Los archivos están en LF.

## Pruebas

- Modificadas: `src/components/LoginForm.test.js` y `src/components/ContactForm.test.js`.
- Comandos: `npx vitest run src/components/LoginForm.test.js src/components/ContactForm.test.js` (rojo antes de los pasos 2 y 4, verde después); cierre con `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate`.
