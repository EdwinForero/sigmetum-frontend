# LoginForm: error anunciado y typo en es: spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

El mensaje de error del login aparece en pantalla sin que un lector de pantalla lo anuncie, y el texto en español de credenciales incorrectas tiene un typo ("contraeña"). Se corrigen ambas cosas sin tocar la lógica de sesión ni del token.

## Criterios de aceptación

### De código

1. Regla de `docs/guias/accesibilidad.md` (formularios, línea 55): "los errores se anuncian (`role="alert"` o `aria-live`) y se asocian al campo (`aria-describedby`)". Esta tarea cumple solo la parte de anunciar; asociar al campo queda fuera (ver "Fuera de alcance").
2. Un test nuevo en `src/components/LoginForm.test.js` falla antes del cambio porque el mensaje de error no está en un elemento con `role="alert"` (o `aria-live`), y pasa después. Se comprueba para el caso `401` (`login.unauthorizedLabel`) y para el `429` (`login.tooManyAttemptsLabel`).
3. Antes de que haya error no hay ningún elemento `role="alert"` en el formulario (el contenedor aparece con el error, no antes).
4. `login.unauthorizedLabel` en `src/languages/es/translation.json` (línea 124) dice "Verifica el usuario y/o contraseña". La clave de `en` no cambia.
5. La corrección del typo se verifica con un test nuevo sobre `src/languages/es/translation.json` (archivo de test propio, distinto de `LoginForm.test.js`, que simula `t` y no ve el texto). El test comprueba que `login.unauthorizedLabel` es exactamente "Verifica el usuario y/o contraseña" y que no contiene "contraeña". Debe fallar hoy por el motivo correcto (el JSON tiene el typo) y pasar tras el cambio.
6. Los tests existentes de `LoginForm` (429, 401, éxito con token en `localStorage` y navegación) siguen pasando sin modificarse; la lógica de `handleLogin` y el manejo del token no cambian.
7. `npm test`, `npm run build`, `npm run lint`, `npm run quality` y `npm run docs:check` pasan; `npm run docs:gate` en verde antes del commit.

### De documentación

1. `docs/09-estado-actual-y-deuda-tecnica.md`: "Última actualización" con la fecha de hoy y cifras (tests, claves) al día si cambian (hay un archivo de test nuevo). Sin entrada nueva de deuda (B3 y B4 siguen abiertos).
2. `docs/05-componentes.md` (`LoginForm`): indicar que el error se anuncia como alerta.
3. `docs/guias/accesibilidad.md` (decidido: se actualiza): la línea "Estado: incumple en `LoginForm`..." (~línea 56) pasa a decir que el anuncio del error del login ya se cumple, y que siguen pendientes la etiqueta asociada al campo (B3) y `aria-describedby`.
4. `docs/07-i18n-y-estilos.md` solo si hace falta (cambia un texto, no la estructura de claves; `docs/guias/mantenimiento.md` sección 2 exige tocarlo para "Traducciones" cuando hay claves nuevas, que aquí no hay).
5. `docs/08-guia-desarrollo.md` (por `src/**/*.test.js` en `docsPorArea`) con la descripción de `LoginForm.test.js` al día (ahora cubre también el anuncio del error) y mención del nuevo test del JSON de `es`.
6. Aviso de PR obligatorio: `src/components/LoginForm.js` está en `areasContrato`, así que se necesita `docs/specs/*-aviso-pr.md` (nuevo, por ejemplo `2026-10-30-loginform-error-accesible-aviso-pr.md`; los avisos existentes son de otras tareas) con la línea `Integración: sin impacto — solo accesibilidad y un texto del login; el contrato con el backend (`POST /log`, `429`) y la infraestructura no cambian.`. No se cambia `docs/integracion/`.

## Fuera de alcance

- M18 (`FileUpload` a `api.js`) y B1 (`aria-label` del botón de borrar).
- B3 (asociar `<label>` con `<input>` mediante `htmlFor`/`id`), B4 (el botón fuera del `<form>`) y `aria-describedby` del error al campo.
- Cualquier cambio en la lógica de sesión, el token, `handleLogin` o `services/api.js`.
- Otros typos o textos de `es`/`en` (incluidas las claves `userLable` y `passwordLable`).

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta (mismo `POST /log`, mismos códigos).
- `docs/integracion/para-infra.md`: no lo afecta (sin variables `VITE_*` ni recursos S3 nuevos).

## Preguntas abiertas

Ninguna. Resueltas por el usuario: (1) el typo se verifica con un test sobre el JSON de `es`; (2) se actualiza `docs/guias/accesibilidad.md`.
