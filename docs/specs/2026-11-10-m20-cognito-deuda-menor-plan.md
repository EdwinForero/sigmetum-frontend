# M20, deuda menor del login con Cognito: plan

Fecha: 2026-11-10 · Estado: cerrado · Spec: `docs/specs/2026-11-10-m20-cognito-deuda-menor-design.md`

Supuestos:

- Se mantienen tal cual tres decisiones del plan `2026-11-09-cognito-login-plan.md`: una sola promesa de refresco compartida (`refreshing`) y solo `renewSession` cierra la sesión cuando falla la renovación; solo se reintenta el `503` cuyo cuerpo es `Authentication service unavailable`; la guarda `useRef` sin un indicador `cancelled` en la limpieza del efecto.
- Un `5xx` o `429` de Cognito llega al llamador como el error `http` que ya construye `cognitoToken`, con el `status` de Cognito. `ProtectedRoute.js:24` trata cualquier error que no sea `401` como `unavailable` (aviso con «Reintentar», sesión conservada) y `FileUpload` muestra el diálogo de error genérico. Ninguno de los dos cambia.

## Ajustes aprobados tras la segunda opinión (prevalecen sobre el texto de los pasos)

Aprobados por el usuario el 10/11/2026.

- **Paso 2, 4xx solo con código OAuth (decisión 1 revisada):** en `renewSession` se cierra la sesión únicamente si el error es un `4xx` distinto de `429` **con `json.error`**. Un `4xx` sin `json.error` (HTML de CloudFront, WAF futuro) se propaga como reintentable, igual que red, `5xx` y `429`. Tests: `it.each` de `500`, `503`, `429` y además `403` sin cuerpo (HTML) conservan la sesión y no llaman a `assign`; `400 invalid_grant`, `400 invalid_client` y `401` con `{error:...}` la cierran. Hay que conservar el cuerpo parseado (`json`) en el error `http` de `cognitoToken` si hoy no está.
- **Paso 4, limpieza síncrona de la URL:** en lugar de `fail()` asíncrono, el efecto lee `code`, `state` y `error` de `searchParams` y **enseguida, antes de validar o canjear**, llama a `navigate('/auth/callback', { replace: true })` (con la guarda `started`, que impide un segundo canje al cambiar `searchParams`); después valida y canjea con los valores ya leídos. `setHasError(true)` se mantiene en los caminos de error. Así no hay navegación asíncrona hacia el callback si el usuario sale de la pantalla mientras `exchangeCode` está en vuelo. Los tests de los seis caminos esperan `REPLACE /auth/callback` (sin query) con `findByText`/`waitFor`, y un test nuevo comprueba que, si el componente se desmonta antes de que falle el canje, no hay `navigate` posterior.
- **Paso 1, sin token:** si `!current` (la sesión ya se borró por otra llamada), se lanza el 401 directamente, sin `refreshSession()` ni segunda redirección. Test: A falla el refresco con `400 invalid_grant` y B recibe su 401 tardío después: `assign('/login')` se llama una sola vez.
- **Paso 1, mock del test 1:** comprobar `Bearer new` antes que la condición de la primera `/b` (que va con `Bearer old`) y comparar la URL con `endsWith('/b')` (lleva `BASE_URL+API_PREFIX` delante).
- **Paso 4, sonda:** esperar con `findByText`/`waitFor`, no con `getBy`.
- **Documentación:** corregir en la spec el criterio de documentación 2 (ya alineado con la decisión 1 revisada) y, en `docs/09`, dejar como **(por confirmar)** qué devuelve Cognito para un refresco inválido.

## Fase 1 (5 pasos)

1. **401 tardío con el token ya renovado (a), con TDD**
   - Archivos: `src/services/api.js` y `src/services/api.test.js`.
   - Firmas: la función interna `send()` pasa a devolver `{ response, json, token }`, donde `token` es el que se envió en `Authorization` (o `null`). En la rama del 401: `const current = getAccessToken(); const renewed = current && current !== result.token ? true : await refreshSession();`. El resto no cambia (reintento con `sendWithRetry` y, si vuelve un 401, `clearSession` + `assign('/login')`). La API pública no cambia.
   - Comprobación: dos tests nuevos en el bloque `401 con refresco`.
     - «un 401 tardío con el token ya renovado reintenta sin otro refresco»: `fetchMock.mockImplementation`; el token de Cognito devuelve `{access_token:'new'}`; cualquier petición con `Bearer new` devuelve 200; la primera petición de `/b` devuelve una promesa diferida que el test libera con un 401; el resto, 401. Se lanza `api.getAuth('/b')`, se espera a que `api.getAuth('/a')` resuelva `'ok'` y entonces se libera `/b`. Se espera: `/b` resuelve `'ok'`, `tokenCalls` vale 1, `token === 'new'` y `assign` no se llama. Hoy falla con `tokenCalls` igual a 2.
     - «el reintento de un 401 tardío vuelve a dar 401»: `/b` queda pendiente; antes de liberarla se llama a `session.saveTokens({access_token:'new'})`; todas las peticiones devuelven 401. Se espera: `tokenCalls` vale 0, la sesión queda borrada y `assign('/login')`. Hoy falla porque hace un refresco.
   - Norma: `seguridad.md` S3 (viñeta del `401`); ajuste «refresco compartido» del plan del 09/11; `buenas-practicas-frontend.md` §11.

2. **5xx o 429 de Cognito al renovar (c), con TDD**
   - Archivos: `src/services/api.js` y `src/services/api.test.js`.
   - Firmas: en `renewSession`, el `catch` pasa a `if (error.type === 'network' || error.status === 429 || error.status >= 500) throw error;`. Actualizar el comentario de las líneas 42 y 43. Siguen cerrando la sesión: cualquier otro `4xx`, la falta de `refresh_token`, `cognito_not_configured` y un 200 sin `access_token`.
   - Comprobación: test nuevo `it.each([500, 503, 429])` (401, después el token con ese estado): rechaza con `{type:'http', status}`, conserva `old` y `R`, no llama a `assign` y hace 2 llamadas a `fetch`; hoy falla porque borra la sesión. Test nuevo `it.each([[400,'invalid_client'],[401,'unauthorized']])`: rechaza con el 401, borra la sesión y llama a `assign('/login')` (ya pasa hoy; es regresión de la decisión 1). El caso `400 invalid_grant` ya lo cubre un test existente. Sin temporizadores falsos: el `503` de Cognito no entra en el bucle de reintentos del backend.
   - Norma: decisión 1 de la spec; S3; ajustes «503 solo de autenticación» y «fallo de red no cierra» del plan del 09/11.

3. **`logout()` sin dominio (b), con TDD**
   - Archivos: `src/services/session.js` y `src/services/session.test.js`.
   - Firmas: en `logout()`, después de `clearSession()`, `if (!env.COGNITO_DOMAIN) { window.location.assign('/'); return; }`. Con dominio no cambia nada. Solo se mira el dominio, como dice la spec (descartado comprobar también `COGNITO_CLIENT_ID`).
   - Comprobación: test nuevo «logout sin dominio borra los tokens y va a /»: `vi.stubEnv('VITE_COGNITO_DOMAIN','')` y `load()`; `assign` con `'/'` una sola vez y los dos tokens a `null`. Hoy falla porque `assign` recibe `/logout?...`. El test de `logout` con dominio no se toca.
   - Norma: S4 (ruta fija, ningún dato del usuario).

4. **Callback sin `code` ni `state` en la URL tras un error (e), con TDD**
   - Archivos: `src/pages/AuthCallback.js` y `src/pages/AuthCallback.test.js`.
   - Firmas: dentro del efecto, `const fail = () => { setHasError(true); navigate('/auth/callback', { replace: true }); };`, que sustituye a los dos `setHasError(true)` del efecto (validación previa y `.catch` del canje). El `catch` del botón de reintento no cambia. El componente no se vuelve a montar (misma ruta) y `started` evita un segundo canje cuando cambia `searchParams`.
   - Comprobación: un componente `LocationProbe` dentro de `MemoryRouter` y fuera de `Routes`, que pinta `` `${useNavigationType()} ${pathname}${search}` `` en un `<span data-testid="location">` (no `<output>`: su rol implícito es `status` y rompería `findByRole('status')`). Se esperan `REPLACE /auth/callback` y el `alert` en seis caminos: `state` distinto, sin `state` guardado, `error=access_denied`, canje 400 y sin configuración (cinco ya existentes, ampliados) y fallo de red (nuevo, `fetchMock.mockRejectedValue(new TypeError('failed'))`). Hoy todos fallan porque la sonda muestra `POP /auth/callback?code=…`.
   - Norma: decisión 2 de la spec; S4; `accesibilidad.md` A12; buenas prácticas §5.

5. **Test de StrictMode que de verdad prueba la guarda (d)**
   - Archivos: solo `src/pages/AuthCallback.test.js`, en el test «con éxito canjea el código una sola vez…».
   - Firmas: sin cambios de código. El test usa un `fetch` diferido: `fetchMock.mockReturnValue(new Promise((r) => { resolveFetch = r; }))`. Justo después de `renderAt(...)`, de forma síncrona: `expect(screen.queryByRole('alert')).toBeNull()` y `getByRole('status')`. Después `resolveFetch(jsonResponse(200, {...}))`, `findByText('pagina-carga')`, otra vez `queryByRole('alert')` igual a `null`, `fetch` llamado exactamente una vez y las comprobaciones actuales de tokens y PKCE.
   - Comprobación con mutación: comentar temporalmente `if (started.current) return; started.current = true;` hace fallar el test en el primer `queryByRole('alert')`; después se restauran y `git diff` de `AuthCallback.js` solo debe mostrar lo del paso 4. Va después del paso 4.
   - Norma: ajuste «canje único» del plan del 09/11; buenas prácticas §11.

## A cargo del tester-documentador

- **`docs/09-estado-actual-y-deuda-tecnica.md`:** M20 pasa a «Resueltos», con el origen en 2265013 y una línea por causa (el hash del commit propio se rellena después del commit, como en `7019869`); cifras de tests y fecha 10/11/2026. Queda **(por confirmar)**: qué devuelve Cognito para un refresco inválido, si responde `5xx` o `429`, y el `invalid_grant` del RFC 6749 §5.2.
- **Regla de renovación en `docs/03-api.md`, `docs/integracion/para-backend.md` (líneas 25 y 91 a 93) y `docs/guias/seguridad.md` S3 (línea 43):** un `401` tardío con el token ya renovado se reintenta sin otro refresco; la red, los `5xx` y el `429` de Cognito no cierran la sesión; cualquier otro `4xx` sí la cierra. **Nota:** el criterio de documentación 2 de la spec dice «cierre solo con `400 invalid_grant`»; prevalece la decisión 1 (cualquier `4xx` salvo `429`). S3 no está en la spec, pero describe la regla y se quedaría falsa.
- **Logout sin dominio («va a `/`»):** `para-backend.md` línea 93 y `docs/06-utilidades-hooks-config.md`.
- **Callback y tests:** `docs/04-paginas.md` (`AuthCallback` navega con `replace` a `/auth/callback` en todo camino de error) y `docs/08-guia-desarrollo.md` (tabla de cobertura de `api.test.js`, `session.test.js` y `AuthCallback.test.js`). `docs/05-componentes.md` no cambia.
- **Aviso de PR `docs/specs/2026-11-10-m20-cognito-deuda-menor-aviso-pr.md`:** hace falta porque se toca `src/services/api.js` (área de contrato). Como `para-backend.md` cambia, no basta «sin impacto»: describir el cambio de cuándo se renueva el token.

## Pruebas

- Por pasos: `npm test -- --maxWorkers=2 api session AuthCallback`.
- Nuevas: 2 en el paso 1, 5 casos en el paso 2, 1 en el paso 3 y 1 en el paso 4 (red). Modificadas: 5 de `AuthCallback` en el paso 4 y el test de StrictMode en el paso 5.
- Cierre: `npm test -- --maxWorkers=2`, `npm run build`, `npm run lint`, `npm run quality`, `npm run docs:check` y `npm run docs:gate`. `agentes:test` no hace falta (no se toca `plugins/`).
- No se prueba contra el pool real (fuera de alcance): **(por confirmar en `dev`)**.

## Cierre

- **Crítico: sí.** Coincide con la entrada de `criticidad` «sesión y token (services/api.js, LoginForm, ProtectedRoute)», porque los pasos 1 y 2 cambian la renovación en `services/api.js`. No coincide con «contrato con el backend»: el backend sigue recibiendo el mismo `Bearer`.
- Documentos de integración afectados: `docs/integracion/para-backend.md` (solo la descripción, no el contrato). `para-infra.md` no se toca.
- Sin preguntas bloqueantes.
