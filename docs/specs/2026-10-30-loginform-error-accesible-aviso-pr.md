# Aviso para PR: login accesible

Spec: `docs/specs/2026-10-30-loginform-error-accesible-design.md`

## Qué cambia

- `src/components/LoginForm.js`: el mensaje de error se muestra en un `<span role="alert">` que solo existe cuando hay error. No cambian `handleLogin`, el token ni la navegación.
- `src/languages/es/translation.json`: se corrige el typo de `login.unauthorizedLabel` ("Verifica el usuario y/o contraseña"). La clave de `en` no cambia.
- Tests: casos `401` y `429` con `role="alert"` en `LoginForm.test.js` y un test nuevo sobre el JSON de `es` (`src/languages/es-typos.test.js`).

Integración: sin impacto — solo accesibilidad y un texto del login; el contrato con el backend (`POST /log`, `429`) y la infraestructura no cambian.

## Qué debe hacer el otro repositorio

Nada. `sigmetum-backend` y `sigmetum-infra` no necesitan cambios.

## Límite conocido

Un segundo login fallido con el mismo error no se vuelve a anunciar (misma clave, sin re-render). Pasar de `401` a `429` sí se anuncia. Es aceptado: no hay un `role="alert"` permanente. Sin probar con un lector de pantalla real **(por confirmar)**.
