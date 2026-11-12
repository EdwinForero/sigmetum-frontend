# Aviso para PR: pulido de las páginas públicas (12/11/2026)

Iteración «pulido de las páginas públicas» (spec y plan en esta misma carpeta mientras no se fusionen; los documentos vivos la citan por nombre y commit, nunca por ruta).

## Qué cambia

- `package.json` y `package-lock.json` (`package.json` es área de contrato; el `lock` va en el mismo commit): `@playwright/test@^1.65.0` como **devDependency**, script `npm run e2e` y `--max-warnings` de `lint` de 43 a 18 (el recuento real). Solo desarrollo: no entra en el build, en la CI ni en producción. El navegador se instala aparte (`npx playwright install chromium`). `npm audit --audit-level=high` sale con código 1, pero con **el mismo conjunto** de altas y críticas que en `HEAD` (`source-map-js`, `tinypool`, `vite`, `vitest`, `xlsx` y `zod`; todas de desarrollo salvo `xlsx`, ya aceptada en M14): `@playwright/test` no añade ninguna; `npm run quality` (con `--omit=dev`) pasa.
- `src/components/LoginForm.js` (área de contrato, sesión y token): **solo estilos**. Hexadecimales sustituidos por tokens (`ink`, `moss`, `surface`), radio de los campos y del botón de mostrar contraseña a `rounded-xl` y el aviso de error con el sistema compartido de avisos (`noticeStyles`). No cambian `handleLogin`, el token, `api.js`, `session.js`, las claves `login.*` ni ninguna petición.
- Páginas públicas (sin contrato): `Home`, `About`, `Cookies`, `Explore` y `VegetationGallery` rehechas con tokens, `.page-container` y el sistema de avisos; `Header`, `Navbar`, `Footer` (tres columnas con los logos institucionales), banner de cookies, `SpeciesCard` operable con teclado, `ContactForm` con validación propia y botón «Enviar» con `aria-disabled`, nuevos `EmptyState`, `LogoLink` y `GalleryViewer`, y `config/institutions.js` (todos los enlaces `https`, incluido EFYVE). `UseAtBottom.js` se borra.
- Suite E2E local de las páginas públicas (`e2e/`, `playwright.config.js`): no está en la CI. `.gitignore` y ESLint ignoran `test-results/` y `playwright-report/`.
- `scripts/quality-check.mjs`: se retira la deuda de `http://` de `Home` (ya es `https`).

Integración: sin impacto — `@playwright/test` es una devDependency solo de desarrollo y `LoginForm.js` solo cambia estilos; no cambia ningún contrato con el backend ni con infra. (`para-backend.md` solo describe ahora, de forma descriptiva, la validación extra en cliente de `POST /send-email`: formato del correo y mensaje de al menos 20 caracteres; la petición no cambia.) **La validación del cliente no sustituye a la del servidor:** el backend debe seguir validando `POST /send-email`; el cliente solo evita envíos que ya sabe inválidos. `LoginForm.js` solo cambia estilos (sin tocar `handleLogin`, el token ni `api.js`).

## Qué debe hacer el otro repositorio

- **`sigmetum-backend`:** nada. `POST /send-email` recibe lo mismo; el cliente solo deja de enviar antes los casos que ya sabía inválidos. Confirmar si el servidor tiene un límite propio para el mensaje **(por confirmar)**.
- **`sigmetum-infra`:** nada. No hay variables ni recursos nuevos; Amplify no ejecuta la suite E2E.
- **Vuelta atrás:** revertir el commit; no hay migraciones.

## Cambios visibles en las páginas privadas (previstos, no son regresiones)

- **Confirmaciones con icono `warning` (vuelta 1):** `DialogAdvice` con `variant="warning"` en `FileUpload` (campos vacíos, «¿continuar?»), `ImageGalleryManager`, `TermsManager` y `DataManagement`: icono y borde naranja (`#8A5300`) en las privadas, antes con el estilo de información.
- **Cabecera y menú móvil:** ítem activo del panel móvil con subrayado de 4 px y negrita en vez de `border-l-4` (B61); pie móvil con los enlaces en dos columnas (944 px de alto a 390 px, antes 1032; B62).
- Aspecto discontinuo del botón de `LoginForm` mientras está ocupado y de los botones de texto deshabilitados (borde `moss`, sin `opacity-50`).
- `div`, `strong`, `caption` y `option` pasan de Amaranth a Sen; el `<select>` también; `summary` en negrita; `Sidebar` con `font-normal`; borde de error de `TextInput` con `invalid`; cabecera sin borde (sombra con scroll), pie nuevo (el documento crece +283 px a 1440 px y +777 px a 390 px) y banner de cookies claro.
- Medido (orquestador, local con API y sesión simuladas): la `x` del `<h1>` no cambia en ninguna privada (0 px de diferencia, 8 de 8), sin desborde a 390 px y tipografía solo Sen y Amaranth con pesos 400 y 700.

## Pendiente

- **`/security-review`** por `LoginForm.js` y `package.json` (críticos): lo ejecuta el orquestador; **aún no se ha ejecutado**.
- **Por confirmar (no medido):** backend real y datos reales, Safari y Firefox, lector de pantalla, barras de scroll clásicas, el contraste del texto del hero sobre la foto real, el cambio de 768 a 1024 px con el visor abierto y los objetivos táctiles a 320 px.
- **Decisiones del usuario resueltas en la vuelta 1:** B61 (`border-l-4` del menú móvil, ya con subrayado) y B62 (pie móvil en dos columnas). Cursiva científica: solo se declara Amaranth cursiva 700; su aspecto real frente a la sintética **(por confirmar)** en un navegador con las fuentes reales.
- **Deuda B59 (riesgo de proceso):** sin test de la `key` de `Explore`, `errorSummary` sin i18next real, sin E2E de la rejilla del pie ni del subrayado móvil.
- **Diagramas a regenerar:** ninguno automático (el repositorio no genera diagramas). Describen un flujo que cambió: `docs/01-arquitectura.md` (diagrama de capas del layout: pie y envoltura `MotionConfig`; flujo del explorador: ahora con «Reintentar» y «Quitar filtros», este último con foco al `<h1>`; foco al destino en `/#contacto` y en la flecha del hero), y `docs/04-paginas.md` (Home, Explore, VegetationGallery).
