# M15 + M9: cookies propias con SameSite y Secure, y console.log olvidado: spec

Fecha: 2026-10-30 · Estado: cerrado

## Objetivo

(M15) Las cookies propias `cookieConsent` y `cookiePreferences` se escriben hoy sin `SameSite` ni `Secure`, y la cadena se repite en cuatro sitios de `CookieBanner.js`. Deben llevar `SameSite=Lax` y, en HTTPS, `Secure`, con la escritura centralizada en un único punto, sin cambiar nombres, valores, `path`, `max-age` ni la lógica de consentimiento.
(M9) Quitar el `console.log(selectedFilters)` olvidado en `Filter.js`.

## Criterios de aceptación

### De código

1. Existe un único punto de escritura de cookies propias en `CookieBanner.js` (helper local, no exportado); `handleAccept` y `handleAcceptAll` lo usan para ambas cookies. `grep "document.cookie =" src` devuelve solo la línea del helper.
2. Cada cookie se escribe con los atributos `path=/`, `max-age=31536000` y `SameSite=Lax`, y con `Secure` solo si `window.location.protocol === 'https:'`. En `http://localhost` no se añade `Secure`: un navegador descarta una cookie `Secure` recibida por http (salvo excepciones de localhost según navegador) y el banner reaparecería en cada visita; en producción (HTTPS) sí se añade.
3. Nombres (`cookieConsent`, `cookiePreferences`), valor `accepted`, valor de `cookiePreferences` (`JSON.stringify` tal cual, sin `encodeURIComponent`) y la lectura `document.cookie.includes("cookieConsent=accepted")` no cambian. Motivo: nada lee `cookiePreferences` (grep en `src`, M11), pero codificar cambiaría el valor almacenado y ampliaría el alcance. El JSON no contiene `;`, el único carácter que rompería la cadena.
4. Test nuevo `src/components/CookieBanner.test.js` (TDD): espía el setter de `document.cookie` (el getter de jsdom no devuelve atributos) y comprueba, en "Aceptar todo" y en "aplicar" del modal, que se escriben las dos cookies con `SameSite=Lax`, `path=/`, `max-age=31536000`; con protocolo https, además `Secure`; con http, sin `Secure`. Debe fallar antes del cambio por el motivo correcto: la cadena escrita no contiene `SameSite=Lax`. Comprueba también que con `cookieConsent=accepted` presente el banner no se renderiza.
5. El comportamiento visible y la accesibilidad del banner y del modal no cambian (mismo marcado, textos y estados).
6. `Filter.js` ya no contiene `console.log(selectedFilters)`; no cambia nada más en ese archivo. Sin test nuevo: borrar un log no cambia comportamiento observable y no hay un fallo que reproducir (CLAUDE.md pide TDD para fallos). Se comprueba con `grep "console.log" src` (sin resultados) y con `npm test` en verde.
7. `npm run lint` baja en un aviso (`no-console` es `warn` y `console.log` no está permitido). Si el recuento medido es 62, `--max-warnings` en `package.json` pasa de 63 a 62 (el recuento real lo mide el tester). Se cambia al número medido, no al supuesto.
8. `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate` pasan.

### De documentación

1. `docs/09`: M15 y M9 pasan a "Resueltos" con commit `(por confirmar)` hasta el commit real; se quitan de las tablas de prioridad media/baja y de la hoja de ruta (el punto 5 de la hoja de ruta cita el `console.log` de `Filter`); la fecha de "Última actualización" es 30/10/2026; se añade entrada al historial; las cifras (tests, avisos de ESLint, `--max-warnings`) solo se actualizan aquí.
2. `docs/09`: sustituir `(por confirmar)` por `611dd2d` en las filas M2 y M18 de Resueltos. M12 ya tiene `6d089a6`.
3. `docs/05`, sección `CookieBanner`: reflejar que `handleAccept` y `handleAcceptAll` guardan las cookies con `SameSite=Lax` y `Secure` en HTTPS mediante un helper local. La sección `Filter` solo cambia si menciona el log (no lo hace hoy).
4. `docs/08`: si tiene tabla de cobertura de tests, añadir `CookieBanner.test.js`. Sin recuentos fuera de `docs/09`.
5. `docs/guias/seguridad.md`: S9 (línea 103) y la tabla de estado (línea 131, "Cookies propias: sin `SameSite` ni `Secure` (M15)") dejan de citar M15 como deuda y pasan a describir el estado resuelto. La mención de M11 (nada lee las preferencias) se mantiene.
6. `docs/06` no cambia (el helper vive en `CookieBanner.js`, no en `src/utilities/`).
7. Aviso de PR: no hace falta. `CookieBanner.js` y `Filter.js` no están en `areasContrato` de `.claude/flujo.json`. El cambio solo toca `package.json` (por `--max-warnings`), que sí está en `areasContrato`, de modo que, si `package.json` cambia, el aviso `docs/specs/*-aviso-pr.md` con `Integración: sin impacto — <motivo>` pasa a ser obligatorio (comprobar con `docs:gate`).

## Fuera de alcance

- M11 (qué preferencias se usan de verdad), M13 (Google Fonts), M17 (política de privacidad), M1 (JWT), B2 (diálogos accesibles) y cualquier otro cambio en `CookieBanner.js`.
- Codificar el valor de `cookiePreferences`, cambiar `max-age` o `path`, o añadir lectura de preferencias.
- Cualquier otro aviso de ESLint.

## Impacto en contratos externos

- `docs/integracion/para-backend.md`: no lo afecta (cookies propias del frontend, sin envío de cabeceras ni tocar token).
- `docs/integracion/para-infra.md`: no lo afecta.
- Criticidad: no se toca sesión/token, contrato, CI, variables de entorno ni accesibilidad (comportamiento visible idéntico). Solo `package.json` por el tope de avisos; no cuenta como dependencias. Sin criticidad que lo eleve.

## Preguntas abiertas

Ninguna. Decisiones tomadas con supuesto explícito: `Secure` condicional a HTTPS; helper local en `CookieBanner.js`; valor de `cookiePreferences` sin codificar; `SameSite=Lax` (no `Strict`, que no aporta nada a cookies que solo lee el propio sitio y no cambia la navegación entrante a la web).
