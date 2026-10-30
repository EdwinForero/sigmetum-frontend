# M15 + M9: plan

Fecha: 2026-10-30 · Estado: cerrado · Spec: `docs/specs/2026-10-30-m15-m9-cookies-samesite-console-log-design.md`

Crítico: no. Ninguna entrada de `criticidad` coincide: las cookies de consentimiento no son el token; no cambia el contrato con el backend; `package.json` cambia solo en `--max-warnings` de un script (sin altas ni cambios en dependencias ni lockfile); no se toca CI, accesibilidad (el marcado no cambia) ni variables de entorno. Que `package.json` esté en `areasContrato` solo exige el aviso de PR.

## Supuestos y verificaciones

- `seguridad.md` S9 (línea ~103) ya exige `SameSite` y `Secure` en HTTPS. `buenas-practicas-frontend.md` pide que los avisos no crezcan y lista M9. `accesibilidad.md`: el marcado no cambia.
- `Filter.js:70` es `console.log(selectedFilters);`, la única aparición de `console.log` en `src`. `CookieBanner.js` escribe `document.cookie` en cuatro sitios (líneas ~29, 30, 44 y 45).
- Botones en el test, con `t` mockeado a la clave (`src/setupTests.js`): banner `cookies.banner.acceptAllButton` (`handleAcceptAll`) y `cookies.banner.cookiesConfigurationButton` (abre el modal); modal `cookies.modal.applyButton` (`handleAccept` y cierra) y `cookies.modal.cancelButton`. `<Trans>` está mockeado y devuelve la clave.

## Fase 1

1. **Test nuevo que falla (TDD, primero)**
   - Archivo: `src/components/CookieBanner.test.js` (crear, en LF). Imports como `ContactForm.test.js`.
   - Espía de `document.cookie`: en `beforeEach`, `writes = []`, `cookieJar = ''` y `Object.defineProperty(document, 'cookie', { configurable: true, get: () => cookieJar, set: (v) => { writes.push(v); } })`; en `afterEach`, `delete document.cookie` (restaura el accesor del prototipo) y `vi.unstubAllGlobals()`. Con `cookieJar = ''` el efecto muestra el banner; para el caso "ya aceptado", `cookieJar = 'cookieConsent=accepted'` antes de renderizar.
   - Protocolo: helper `setProtocol(p)` = `vi.stubGlobal('location', { protocol: p })`. El helper de producción debe leer `window.location.protocol` dentro de la función, no a nivel de módulo. Si el stub no tiene efecto, el developer lo señala; alternativa sin cambiar el producto: `vi.spyOn(window, 'location', 'get')`.
   - Casos (todos con `userEvent.setup()`):
     a. https y clic en `cookies.banner.acceptAllButton`: se escriben exactamente dos cookies (una empieza por `cookieConsent=accepted`, otra por `cookiePreferences=`), ambas con `path=/`, `max-age=31536000`, `SameSite=Lax` y `Secure`.
     b. Igual que (a) con `http:`: con `SameSite=Lax`, `path=/` y `max-age=31536000`, sin `Secure`.
     c. https y clic en `cookies.banner.cookiesConfigurationButton` y luego en `cookies.modal.applyButton`: mismas aserciones que (a); `cookiePreferences` con todo en `false`.
     d. http en el flujo del modal: sin `Secure`; con `SameSite=Lax`.
     e. En (a), `cookiePreferences=` seguido de `JSON.stringify({all:true,advertising:true,advertisingTracking:true,functionality:true,personalization:true,security:true})` sin codificar.
     f. `cookieJar = 'cookieConsent=accepted'`: tras renderizar, `queryByText('cookies.banner.acceptAllButton')` es `null` y no hay escrituras.
   - Comprobación: `npx vitest run src/components/CookieBanner.test.js` debe fallar en a, b, c, d y e por el motivo correcto (`expected 'cookieConsent=accepted; path=/; max-age=31536000' to contain 'SameSite=Lax'`) y pasar f. Si falla por otro motivo (no encuentra el botón, error de `defineProperty`), se corrige el test, no el componente.
   - Norma: CLAUDE.md "Reglas de trabajo" (TDD); `docs/guias/seguridad.md` S9.

2. **Helper local con `SameSite` y `Secure`, y uso en las dos funciones (M15)**
   - Archivo: `src/components/CookieBanner.js`. Nada más cambia: ni el marcado, ni las claves i18n, ni la lectura `includes("cookieConsent=accepted")`.
   - A nivel de módulo, no exportado:
     ```js
     const COOKIE_MAX_AGE = 31536000;
     const setCookie = (name, value) => {
       const secure = window.location.protocol === "https:" ? "; Secure" : "";
       document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
     };
     ```
     `window.location.protocol` se lee en cada llamada; `value` va sin `encodeURIComponent`. Se sustituyen los cuatro sitios: `setCookie("cookieConsent", "accepted")` y `setCookie("cookiePreferences", JSON.stringify(...))` en `handleAccept` (con `cookiePreferences`) y en `handleAcceptAll` (con `newPreferences`).
   - Comprobación: el archivo de test pasa entero; `grep "document.cookie =" src` devuelve solo la línea del helper (las lecturas son aceptables).
   - Norma: `seguridad.md` S9; `buenas-practicas-frontend.md` (cambio mínimo).

3. **Borrar el `console.log` (M9)**
   - Archivo: `src/components/Filter.js`: eliminar la línea ~70 `console.log(selectedFilters);` (y la línea en blanco sobrante si queda antes de `};`). Nada más cambia.
   - Comprobación: `grep "console.log" src` sin resultados; `npm test` en verde. Sin test nuevo, como indica la spec.
   - Norma: `seguridad.md` (no escribir en consola); `buenas-practicas-frontend.md`.

4. **Medir el aviso de lint y ajustar el tope**
   - Archivo: `package.json` (solo la línea del script `lint`, `eslint . --max-warnings 63`).
   - Procedimiento: ejecutar `npm run lint` con el tope aún en 63 y leer el recuento real. Si es una unidad menos (62), poner `--max-warnings 62`; si es otro valor, poner el medido y decirlo; si no baja, parar y avisar (el `console.log` no habría contado). Volver a ejecutar `npm run lint` para comprobar que pasa con el nuevo tope. Sin cambios en `eslint.config.js`. El test nuevo no debe añadir avisos.
   - Comprobación: `npm run lint` pasa; después `npm test`, `npm run build` y `npm run quality`.
   - Norma: `buenas-practicas-frontend.md` (los avisos no pueden crecer; al corregir deuda se baja el tope).

## A cargo del tester-documentador

- `docs/09-estado-actual-y-deuda-tecnica.md` (único documento con cifras): M15 y M9 pasan de las tablas de media y baja a "Resueltos", con commit `(por confirmar)` hasta el commit real; sustituir `(por confirmar)` por `611dd2d` en las filas M2 y M18 de Resueltos; hoja de ruta, punto 5: quitar M9 y la mención al `console.log` de `Filter`; fecha 30/10/2026; entrada nueva en el historial; cifras (tests, avisos de ESLint y `--max-warnings`) con los valores medidos.
- `docs/05-componentes.md`, sección `CookieBanner`: las cookies se guardan con `path=/`, `max-age` de un año y `SameSite=Lax`, más `Secure` si el protocolo es HTTPS, mediante un helper local `setCookie` no exportado. La sección `Filter` no se toca.
- `docs/08-guia-desarrollo.md`: añadir `CookieBanner.test.js` a la tabla de cobertura, si existe. Sin recuentos.
- `docs/guias/seguridad.md`: S9 (línea ~103) y la tabla de estado (línea ~131, "Cookies propias") pasan a estado resuelto; se mantiene la mención de M11.
- `docs/guias/buenas-practicas-frontend.md`: la fila de `console.log` con datos (`Filter.js`, M9, línea ~159) deja de ser deuda. Este documento no figuraba en la spec; es el único otro con M9 como deuda.
- Aviso de PR obligatorio (`package.json` está en `areasContrato`): crear `docs/specs/2026-10-30-m15-m9-aviso-pr.md` con `Integración: sin impacto — solo cambia --max-warnings del script lint, sin dependencias ni contrato`. Comprobar con `npm run docs:gate`.
- Revisión final: `grep -rn "M15\|M9\b" docs` (fuera de `specs/` y del historial) no debe dejar ninguno como deuda abierta.
- Avisos: `docs:check` rechaza recuentos tipo "N tests/claves" fuera de `docs/09`; los archivos del repo están en LF.

## Pruebas

- Nueva: `src/components/CookieBanner.test.js`. Comando: `npx vitest run src/components/CookieBanner.test.js`.
- Verificación final: `npm test`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check`, `npm run docs:gate`. `agentes:test` no hace falta: no se toca `plugins/`.
